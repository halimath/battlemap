package boundary

import (
	"embed"
	"io/fs"
	"net/http"
	"net/url"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/halimath/battlemap/backend/internal/control"
	"github.com/halimath/kvlog"
)

const (
	bufferSize = 1024
)

var (
	//go:embed public
	staticFiles embed.FS
)

func ProvideHTTPServer(c *control.BattleMapController) http.Server {
	r := mux.NewRouter()

	r.HandleFunc("/ws/edit/{id}", handleEditConnect(c))
	r.HandleFunc("/ws/view/{id}", handleViewConnect(c))

	staticFilesFS, err := fs.Sub(staticFiles, "public")
	if err != nil {
		panic(err)
	}

	r.PathPrefix("/edit").Handler(forwardMiddleware(r, "/"))
	r.PathPrefix("/view").Handler(forwardMiddleware(r, "/"))

	r.PathPrefix("/").Handler(http.FileServer(http.FS(staticFilesFS)))

	return http.Server{
		Addr: ":8080",
		// Handler: kvlog.Middleware(kvlog.L, r),
		Handler: r,
	}
}

func forwardMiddleware(next http.Handler, forward string) http.Handler {
	if _, err := url.Parse(forward); err != nil {
		panic(err)
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.URL, _ = url.Parse(forward)
		next.ServeHTTP(w, r)
	})
}

func handleEditConnect(ctrl *control.BattleMapController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]

		upgrader := websocket.Upgrader{
			ReadBufferSize:  bufferSize,
			WriteBufferSize: bufferSize,
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			kvlog.Warn(kvlog.Evt("failedToUpgradeProtocol"), kvlog.Err(err))
			return
		}

		c, err := ctrl.BeginEdit(id)
		if err != nil {
			conn.Close()
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		for {
			t, data, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsCloseError(err, websocket.CloseGoingAway) {
					kvlog.Info(kvlog.Evt("editorClosedMap"), kvlog.KV("id", id))
					ctrl.EndEdit(id)
					return
				}

				kvlog.Error(kvlog.Evt("errorReadingWSMessage"), kvlog.Err(err))
				ctrl.EndEdit(id)
				return
			}

			if t != websocket.TextMessage {
				kvlog.Error(kvlog.Evt("invalidWSMessageType"), kvlog.KV("type", t))
				ctrl.EndEdit(id)
				return
			}

			dto, err := unmarshal(data)
			if err != nil {
				kvlog.Error(kvlog.Evt("invalidWSMessage"), kvlog.Err(err))
				continue
			}

			kvlog.Info(kvlog.Evt("mapUpdateReceived"), kvlog.KV("id", id))

			c <- convertBattleMapToEntity(dto)
		}
	}
}

func handleViewConnect(ctrl *control.BattleMapController) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]

		upgrader := websocket.Upgrader{
			ReadBufferSize:  bufferSize,
			WriteBufferSize: bufferSize,
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			kvlog.Warn(kvlog.Evt("failedToUpgradeProtocol"), kvlog.Err(err))
			return
		}

		c, err := ctrl.BeginView(id)
		if err != nil {
			conn.Close()
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		for b := range c {
			kvlog.Info(kvlog.Evt("sendingUpdate"))
			data, err := marshall(convertBattleMapFromEntity(b))
			if err != nil {
				kvlog.Error(kvlog.Evt("failedToMarshallDTO"), kvlog.Err(err))
				continue
			}

			if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
				if websocket.IsCloseError(err, websocket.CloseGoingAway) {
					kvlog.Info(kvlog.Evt("viewerClosedWS"))
					if err := ctrl.EndView(id, c); err != nil {
						kvlog.Error(kvlog.Evt("errorEndingView"), kvlog.Err(err))
					}
					return
				}
			}
		}
		kvlog.Info(kvlog.Evt("closingViewer"))
		conn.Close()
	}
}
