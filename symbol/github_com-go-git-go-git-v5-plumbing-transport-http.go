// Code generated by 'yaegi extract github.com/go-git/go-git/v5/plumbing/transport/http'. DO NOT EDIT.

package symbol

import (
	"github.com/go-git/go-git/v5/plumbing/transport/http"
	ghttp "net/http"
	"reflect"
)

func init() {
	Symbols["github.com/go-git/go-git/v5/plumbing/transport/http/http"] = map[string]reflect.Value{
		// function, constant and variable definitions
		"DefaultClient":        reflect.ValueOf(&http.DefaultClient).Elem(),
		"NewClient":            reflect.ValueOf(http.NewClient),
		"NewClientWithOptions": reflect.ValueOf(http.NewClientWithOptions),
		"NewErr":               reflect.ValueOf(http.NewErr),

		// type definitions
		"AuthMethod":    reflect.ValueOf((*http.AuthMethod)(nil)),
		"BasicAuth":     reflect.ValueOf((*http.BasicAuth)(nil)),
		"ClientOptions": reflect.ValueOf((*http.ClientOptions)(nil)),
		"Err":           reflect.ValueOf((*http.Err)(nil)),
		"TokenAuth":     reflect.ValueOf((*http.TokenAuth)(nil)),

		// interface wrapper definitions
		"_AuthMethod": reflect.ValueOf((*_github_com_go_git_go_git_v5_plumbing_transport_http_AuthMethod)(nil)),
	}
}

// _github_com_go_git_go_git_v5_plumbing_transport_http_AuthMethod is an interface wrapper for AuthMethod type
type _github_com_go_git_go_git_v5_plumbing_transport_http_AuthMethod struct {
	IValue   interface{}
	WName    func() string
	WSetAuth func(r *ghttp.Request)
	WString  func() string
}

func (W _github_com_go_git_go_git_v5_plumbing_transport_http_AuthMethod) Name() string {
	return W.WName()
}
func (W _github_com_go_git_go_git_v5_plumbing_transport_http_AuthMethod) SetAuth(r *ghttp.Request) {
	W.WSetAuth(r)
}
func (W _github_com_go_git_go_git_v5_plumbing_transport_http_AuthMethod) String() string {
	if W.WString == nil {
		return ""
	}
	return W.WString()
}
