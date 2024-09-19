package server

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/breadchris/share/html"
	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
	"go/ast"
	"go/format"
	"go/parser"
	"go/printer"
	"go/token"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing/fstest"
	"time"

	"golang.org/x/time/rate"

	"github.com/breadchris/share/editor/internal/builder"
	"github.com/breadchris/share/editor/pkg/goplay"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

var ErrEmptyRequest = errors.New("empty request")

type APIv2HandlerConfig struct {
	Client       *goplay.Client
	Builder      builder.BuildService
	BuildTimeout time.Duration
}

func (cfg APIv2HandlerConfig) buildContext(parentCtx context.Context) (context.Context, context.CancelFunc) {
	if cfg.BuildTimeout == 0 {
		return parentCtx, func() {}
	}

	return context.WithDeadline(parentCtx, time.Now().Add(cfg.BuildTimeout))
}

type APIv2Handler struct {
	logger  *zap.Logger
	limiter *rate.Limiter
	cfg     APIv2HandlerConfig
}

func NewAPIv2Handler(cfg APIv2HandlerConfig) *APIv2Handler {
	return &APIv2Handler{
		logger:  zap.L().Named("api.v2"),
		cfg:     cfg,
		limiter: rate.NewLimiter(rate.Every(frameTime), compileRequestsPerFrame),
	}
}

// HandleGetSnippet handles requests to get snippet by id.
func (h *APIv2Handler) HandleGetSnippet(w http.ResponseWriter, r *http.Request) error {
	vars := mux.Vars(r)
	snippetID := vars["id"]

	snippet, err := h.cfg.Client.GetSnippet(r.Context(), snippetID)
	if err != nil {
		if errors.Is(err, goplay.ErrSnippetNotFound) {
			return Errorf(http.StatusNotFound, "snippet %q not found", snippetID)
		}

		h.logger.Error("failed to get snippet", zap.String("snippetID", snippetID), zap.Error(err))
		return err
	}

	files, err := goplay.SplitFileSet(snippet.Contents, goplay.SplitFileOpts{
		DefaultFileName: "main.go",
		CheckPaths:      false,
	})
	if err != nil {
		// Serve stuff as-is
		h.logger.Error(
			"Cannot split snippet to files",
			zap.Error(err),
			zap.String("contents", snippet.Contents),
			zap.String("snippetID", snippetID),
		)
		files = map[string]string{snippet.FileName: snippet.Contents}
	}

	WriteJSON(w, FilesPayload{Files: files})
	return nil
}

// HandleShare handles snippet share requests.
func (h *APIv2Handler) HandleShare(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()

	payload, _, err := fileSetFromRequest(r)
	if err != nil {
		return err
	}

	snippetID, err := h.cfg.Client.Share(ctx, payload.Reader())
	if err != nil {
		return err
	}
	if err != nil {
		if isContentLengthError(err) {
			return ErrSnippetTooLarge
		}

		h.logger.Error("share error", zap.Error(err))
		return err
	}

	WriteJSON(w, ShareResponse{SnippetID: snippetID})
	return nil
}

// HandleFormat handles gofmt requests.
func (h *APIv2Handler) HandleFormat(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()

	backend, err := backendFromQuery(r.URL.Query())
	if err != nil {
		return NewBadRequestError(err)
	}

	defer r.Body.Close()
	payload, fileNames, err := fileSetFromRequest(r)
	if err != nil {
		return err
	}

	rsp, err := h.cfg.Client.GoImports(ctx, payload.Bytes(), backend)
	if err != nil {
		if isContentLengthError(err) {
			return ErrSnippetTooLarge
		}

		h.logger.Error("goimports error", zap.Error(err))
		return err
	}

	if err := rsp.HasError(); err != nil {
		return NewBadRequestError(err)
	}

	results, err := goplay.SplitFileSet(rsp.Body, goplay.SplitFileOpts{
		DefaultFileName: fileNames[0],
		CheckPaths:      true,
	})
	if err != nil {
		h.logger.Error("failed to reconstruct files set from format response", zap.Error(err), zap.String("rsp", rsp.Body))
		return NewHTTPError(http.StatusInternalServerError, fmt.Errorf("failed to reconstruct files set from format response: %w", err))
	}

	WriteJSON(w, FilesPayload{Files: results})
	return nil
}

func (h *APIv2Handler) HandleRun(w http.ResponseWriter, r *http.Request) error {
	body, err := filesPayloadFromRequest(r)
	if err != nil {
		return NewBadRequestError(err)
	}

	baseHTML, err := os.ReadFile("html/html.go")
	if err != nil {
		return NewBadRequestError(err)
	}

	i := interp.New(interp.Options{
		GoPath: filepath.FromSlash("./"),
		SourcecodeFilesystem: fstest.MapFS{
			"src/main/vendor/github.com/breadchris/share/html/html.go": &fstest.MapFile{
				Data: baseHTML,
			},
		},
	})

	i.Use(stdlib.Symbols)

	for name, contents := range body.Files {
		h.logger.Debug("evaluating code", zap.String("name", name))
		_, err := i.Eval(contents)
		if err != nil {
			return NewBadRequestError(err)
		}
	}

	_, err = i.Eval(string(baseHTML))
	if err != nil {
		return NewBadRequestError(err)
	}

	v, err := i.Eval("Render")
	if err != nil {
		return NewBadRequestError(err)
	}

	res := v.Interface().(func() string)

	h.logger.Debug("response from compiler", zap.Any("res", res))
	WriteJSON(w, RunResponse{
		Events: []*goplay.CompileEvent{
			{
				Message: res(),
				Kind:    "stdout",
				Delay:   0,
			},
		},
	})

	return nil
}

func (h *APIv2Handler) HandleRunGoPlayground(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()

	params, err := RunParamsFromQuery(r.URL.Query())
	if err != nil {
		return NewBadRequestError(err)
	}

	snippet, err := evalPayloadFromRequest(r)
	if err != nil {
		return NewBadRequestError(err)
	}

	res, err := h.cfg.Client.Evaluate(ctx, goplay.CompileRequest{
		Version: goplay.DefaultVersion,
		WithVet: params.Vet,
		Body:    snippet,
	}, params.Backend)
	if err != nil {
		return err
	}

	if err := res.HasError(); err != nil {
		return NewBadRequestError(err)
	}

	h.logger.Debug("response from compiler", zap.Any("res", res))
	WriteJSON(w, RunResponse{
		Events: res.Events,
	})

	return nil
}

// HandleCompile handles WebAssembly compile requests.
func (h *APIv2Handler) HandleCompile(w http.ResponseWriter, r *http.Request) error {
	// Limit for request timeout
	ctx, cancel := h.cfg.buildContext(r.Context())
	defer cancel()

	// Wait for our queue in line for compilation
	if err := h.limiter.Wait(ctx); err != nil {
		return NewHTTPError(http.StatusTooManyRequests, err)
	}

	files, err := buildFilesFromRequest(r)
	if err != nil {
		return err
	}

	result, err := h.cfg.Builder.Build(ctx, files)
	if err != nil {
		if builder.IsBuildError(err) || errors.Is(err, context.Canceled) {
			return NewHTTPError(http.StatusBadRequest, err)
		}

		return err
	}

	WriteJSON(w, BuildResponseV2{
		FileName:     result.FileName,
		IsTest:       result.IsTest,
		HasBenchmark: result.HasBenchmark,
		HasFuzz:      result.HasFuzz,
	})
	return nil
}

type ConvertRequest struct {
	HTML string `json:"html"`
}

type ConvertResponse struct {
	Code string `json:"code"`
}

func (h *APIv2Handler) HandleConvert(w http.ResponseWriter, r *http.Request) error {
	var req ConvertRequest
	b, err := io.ReadAll(r.Body)
	if err != nil {
		return NewBadRequestError(err)
	}
	if err := json.Unmarshal(b, &req); err != nil {
		return NewBadRequestError(err)
	}
	n, err := html.ParseHTMLString(req.HTML)
	if err != nil {
		return NewBadRequestError(err)
	}

	var buf bytes.Buffer

	fset := token.NewFileSet()

	cfg := &printer.Config{
		Mode:     printer.TabIndent,
		Tabwidth: 4,
	}

	err = cfg.Fprint(&buf, fset, n.RenderGoCode(fset))
	if err != nil {
		return err
	}

	formattedCode, err := format.Source(buf.Bytes())
	if err != nil {
		return err
	}

	WriteJSON(w, ConvertResponse{Code: string(formattedCode)})
	return nil
}

type ModifyRequest struct {
	Code   string `json:"code"`
	Change string `json:"change"`
	Cursor struct {
		Line int `json:"line"`
		Pos  int `json:"col"`
	} `json:"cursor"`
}

type ModifyResponse struct {
	Code string `json:"code"`
}

func (h *APIv2Handler) HandleModify(w http.ResponseWriter, r *http.Request) error {
	var req ModifyRequest
	b, err := io.ReadAll(r.Body)
	if err != nil {
		return NewBadRequestError(err)
	}
	if err := json.Unmarshal(b, &req); err != nil {
		return NewBadRequestError(err)
	}

	newCode, err := modifyFunction(req.Code, req.Change, req.Cursor.Line, req.Cursor.Pos)
	if err != nil {
		return NewBadRequestError(err)
	}

	WriteJSON(w, ModifyResponse{Code: newCode})
	return nil
}

// modifyFunction modifies the parameters in the function by either adding or modifying "Class" calls.
func modifyFunction(source string, change string, line, pos int) (string, error) {
	fset := token.NewFileSet()

	node, err := parser.ParseFile(fset, "", source, parser.AllErrors)
	if err != nil {
		return "", err
	}

	modified := false

	ast.Inspect(node, func(n ast.Node) bool {
		if fn, ok := n.(*ast.CallExpr); ok {
			fnStart := fset.Position(fn.Pos())

			var i *ast.Ident
			if i, ok = fn.Fun.(*ast.Ident); !ok {
				return true
			}

			if fnStart.Line == line && fnStart.Column < pos && fnStart.Column+len(i.Name) >= pos {
				foundClassCall := false

				for _, arg := range fn.Args {
					if callExpr, ok := arg.(*ast.CallExpr); ok {
						if funIdent, ok := callExpr.Fun.(*ast.Ident); ok && funIdent.Name == "Class" {
							foundClassCall = true

							if len(callExpr.Args) > 0 {
								if aa, ok := callExpr.Args[0].(*ast.BasicLit); ok && aa.Kind == token.STRING {
									aa.Value = strings.TrimSuffix(aa.Value, "\"") + " " + change + "\""
								}
							}
							break
						}
					}
				}

				if !foundClassCall {
					classCall := &ast.CallExpr{
						Fun:  ast.NewIdent("Class"),
						Args: []ast.Expr{&ast.BasicLit{Kind: token.STRING, Value: fmt.Sprintf("\"%s\"", change)}},
					}
					fn.Args = append(fn.Args, classCall)
				}

				modified = true
				return false
			}
		}
		return true
	})

	// If no modifications were made, return the original source
	if !modified {
		return source, nil
	}

	// Use the printer package to convert the modified AST back to source code
	var buf bytes.Buffer
	if err := printer.Fprint(&buf, fset, node); err != nil {
		return "", err
	}

	return buf.String(), nil
}

func (h *APIv2Handler) Mount(r *mux.Router) {
	r.Path("/run").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleRun))
	r.Path("/format").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleFormat))
	r.Path("/share").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleShare))
	r.Path("/share/{id}").Methods(http.MethodGet).HandlerFunc(WrapHandler(h.HandleGetSnippet))
	r.Path("/compile").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleCompile))
	r.Path("/convert").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleConvert))
	r.Path("/modify").Methods(http.MethodPost).HandlerFunc(WrapHandler(h.HandleModify))
}
