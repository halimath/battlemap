// Package boundary provides primitives to interact with the openapi HTTP API.
//
// Code generated by github.com/deepmap/oapi-codegen DO NOT EDIT.
package boundary

import (
	"fmt"
	"net/http"

	"github.com/deepmap/oapi-codegen/pkg/runtime"
	"github.com/labstack/echo/v4"
)

const (
	BearerScopes = "bearer.Scopes"
)

// BattleMap defines model for BattleMap.
type BattleMap struct {
	Drawings []Drawing `json:"drawings"`
	Grid     bool      `json:"grid"`
	Id       string    `json:"id"`
	Tokens   []Token   `json:"tokens"`
	Zones    []Zone    `json:"zones"`
}

// Drawing defines model for Drawing.
type Drawing struct {
	At     XY     `json:"at"`
	Id     string `json:"id"`
	Points []XY   `json:"points"`
}

// Error defines model for Error.
type Error struct {

	// error code
	Code int `json:"code"`

	// Human-readable error message
	Error string `json:"error"`
}

// Token defines model for Token.
type Token struct {
	At    XY     `json:"at"`
	Color string `json:"color"`
	Id    string `json:"id"`
}

// VersionInfo defines model for VersionInfo.
type VersionInfo struct {

	// The version string of the API specs.
	ApiVersion string `json:"apiVersion"`

	// Git commit hash of the backend code.
	Commit string `json:"commit"`

	// The version string of the backend component.
	Version string `json:"version"`
}

// XY defines model for XY.
type XY []int

// Zone defines model for Zone.
type Zone struct {
	At    XY     `json:"at"`
	Id    string `json:"id"`
	Label string `json:"label"`
	Size  XY     `json:"size"`
}

// UpdateBattleMapJSONBody defines parameters for UpdateBattleMap.
type UpdateBattleMapJSONBody BattleMap

// UpdateBattleMapJSONRequestBody defines body for UpdateBattleMap for application/json ContentType.
type UpdateBattleMapJSONRequestBody UpdateBattleMapJSONBody

// ServerInterface represents all server handlers.
type ServerInterface interface {
	// Create an authorization token for the client
	// (POST /auth/new)
	CreateAuthToken(ctx echo.Context) error
	// Get the battle with the given id
	// (GET /maps/{id})
	GetBattleMap(ctx echo.Context, id string) error
	// Update the battle with the given id
	// (PUT /maps/{id})
	UpdateBattleMap(ctx echo.Context, id string) error
	// Retrieve version information
	// (GET /version-info)
	GetVersionInfo(ctx echo.Context) error
}

// ServerInterfaceWrapper converts echo contexts to parameters.
type ServerInterfaceWrapper struct {
	Handler ServerInterface
}

// CreateAuthToken converts echo context to params.
func (w *ServerInterfaceWrapper) CreateAuthToken(ctx echo.Context) error {
	var err error

	ctx.Set(BearerScopes, []string{""})

	// Invoke the callback with all the unmarshalled arguments
	err = w.Handler.CreateAuthToken(ctx)
	return err
}

// GetBattleMap converts echo context to params.
func (w *ServerInterfaceWrapper) GetBattleMap(ctx echo.Context) error {
	var err error
	// ------------- Path parameter "id" -------------
	var id string

	err = runtime.BindStyledParameterWithLocation("simple", false, "id", runtime.ParamLocationPath, ctx.Param("id"), &id)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("Invalid format for parameter id: %s", err))
	}

	ctx.Set(BearerScopes, []string{""})

	// Invoke the callback with all the unmarshalled arguments
	err = w.Handler.GetBattleMap(ctx, id)
	return err
}

// UpdateBattleMap converts echo context to params.
func (w *ServerInterfaceWrapper) UpdateBattleMap(ctx echo.Context) error {
	var err error
	// ------------- Path parameter "id" -------------
	var id string

	err = runtime.BindStyledParameterWithLocation("simple", false, "id", runtime.ParamLocationPath, ctx.Param("id"), &id)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("Invalid format for parameter id: %s", err))
	}

	ctx.Set(BearerScopes, []string{""})

	// Invoke the callback with all the unmarshalled arguments
	err = w.Handler.UpdateBattleMap(ctx, id)
	return err
}

// GetVersionInfo converts echo context to params.
func (w *ServerInterfaceWrapper) GetVersionInfo(ctx echo.Context) error {
	var err error

	ctx.Set(BearerScopes, []string{""})

	// Invoke the callback with all the unmarshalled arguments
	err = w.Handler.GetVersionInfo(ctx)
	return err
}

// This is a simple interface which specifies echo.Route addition functions which
// are present on both echo.Echo and echo.Group, since we want to allow using
// either of them for path registration
type EchoRouter interface {
	CONNECT(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
	DELETE(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
	GET(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
	HEAD(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
	OPTIONS(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
	PATCH(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
	POST(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
	PUT(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
	TRACE(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
}

// RegisterHandlers adds each server route to the EchoRouter.
func RegisterHandlers(router EchoRouter, si ServerInterface) {
	RegisterHandlersWithBaseURL(router, si, "")
}

// Registers handlers, and prepends BaseURL to the paths, so that the paths
// can be served under a prefix.
func RegisterHandlersWithBaseURL(router EchoRouter, si ServerInterface, baseURL string) {

	wrapper := ServerInterfaceWrapper{
		Handler: si,
	}

	router.POST(baseURL+"/auth/new", wrapper.CreateAuthToken)
	router.GET(baseURL+"/maps/:id", wrapper.GetBattleMap)
	router.PUT(baseURL+"/maps/:id", wrapper.UpdateBattleMap)
	router.GET(baseURL+"/version-info", wrapper.GetVersionInfo)

}