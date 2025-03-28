package router

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/breadchris/share/screenshare/auth"
	"github.com/breadchris/share/screenshare/config"
	"github.com/breadchris/share/screenshare/ui"
	"github.com/breadchris/share/screenshare/ws"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/zerolog/hlog"
	"github.com/rs/zerolog/log"
)

type Health struct {
	Status  string `json:"status"`
	Clients int    `json:"clients"`
	Reason  string `json:"reason,omitempty"`
}

type UIConfig struct {
	AuthMode                 string `json:"authMode"`
	User                     string `json:"user"`
	LoggedIn                 bool   `json:"loggedIn"`
	Version                  string `json:"version"`
	RoomName                 string `json:"roomName"`
	CloseRoomWhenOwnerLeaves bool   `json:"closeRoomWhenOwnerLeaves"`
}

func Router(conf config.Config, rooms *ws.Rooms, users *auth.Users, version string) *mux.Router {
	router := mux.NewRouter()
	router.NotFoundHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// https://github.com/gorilla/mux/issues/416
		accessLogger(r, 404, 0, 0)
	})
	router.Use(hlog.AccessHandler(accessLogger))
	router.Use(handlers.CORS(handlers.AllowedMethods([]string{"GET", "POST"}), handlers.AllowedOriginValidator(conf.CheckOrigin)))
	router.HandleFunc("/stream", rooms.Upgrade)
	router.Methods("POST").Path("/login").HandlerFunc(users.Authenticate)
	router.Methods("POST").Path("/logout").HandlerFunc(users.Logout)
	router.Methods("GET").Path("/config").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, loggedIn := users.CurrentUser(r)
		_ = json.NewEncoder(w).Encode(&UIConfig{
			AuthMode:                 conf.AuthMode,
			LoggedIn:                 loggedIn,
			User:                     user,
			Version:                  version,
			RoomName:                 rooms.RandRoomName(),
			CloseRoomWhenOwnerLeaves: conf.CloseRoomWhenOwnerLeaves,
		})
	})
	router.Methods("GET").Path("/health").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		i, err := rooms.Count()
		status := "up"
		if err != "" {
			status = "down"
			w.WriteHeader(500)
		}
		_ = json.NewEncoder(w).Encode(Health{
			Status:  status,
			Clients: i,
			Reason:  err,
		})
	})
	if conf.Prometheus {
		log.Info().Msg("Prometheus enabled")
		router.Methods("GET").Path("/metrics").Handler(basicAuth(promhttp.Handler(), users))
	}

	ui.Register(router)

	return router
}

func accessLogger(r *http.Request, status, size int, dur time.Duration) {
	log.Debug().
		Str("host", r.Host).
		Int("status", status).
		Int("size", size).
		Str("ip", r.RemoteAddr).
		Str("path", r.URL.Path).
		Str("duration", dur.String()).
		Msg("HTTP")
}

func basicAuth(handler http.Handler, users *auth.Users) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, pass, ok := r.BasicAuth()

		if !ok || !users.Validate(user, pass) {
			w.Header().Set("WWW-Authenticate", `Basic realm="screego"`)
			w.WriteHeader(401)
			_, _ = w.Write([]byte("Unauthorized.\n"))
			return
		}

		handler.ServeHTTP(w, r)
	}
}
