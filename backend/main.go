package main

import (
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/halimath/battlemap/backend/internal/boundary"
	"github.com/halimath/battlemap/backend/internal/control"
	"github.com/halimath/kvlog"
)

func main() {
	controller := control.Provide()
	httpServer := boundary.ProvideHTTPServer(controller)

	kvlog.Info(kvlog.Evt("startup"))

	termChan := make(chan int, 1)

	signalCh := make(chan os.Signal, 1)
	signal.Notify(signalCh, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		s := <-signalCh

		kvlog.Info(kvlog.Evt("receivedSignal"), kvlog.KV("signal", s))
		httpServer.Close()

		termChan <- 0
	}()

	go func() {
		kvlog.Info(kvlog.Evt("httpListen"), kvlog.KV("addr", ":8080"))
		err := httpServer.ListenAndServe()
		if err != http.ErrServerClosed {
			kvlog.Error(kvlog.Evt("httpServerFailedToStart"), kvlog.Err(err))
			termChan <- 1
		}
	}()

	exitCode := <-termChan
	kvlog.Info(kvlog.Evt("exit"), kvlog.KV("code", exitCode))
	kvlog.L.Close()
	os.Exit(exitCode)
}
