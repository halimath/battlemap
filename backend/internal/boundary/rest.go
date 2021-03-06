//go:generate oapi-codegen -generate types,server -package boundary -o rest_gen.go ../../../docs/api.yaml

package boundary

import (
	"net/http"
	"time"

	"github.com/halimath/battlemap/backend/internal/boundary/auth"
	"github.com/halimath/battlemap/backend/internal/control"
	"github.com/halimath/battlemap/backend/internal/entity/battlemap"
	"github.com/halimath/kvlog"
	"github.com/labstack/echo/v4"
)

var (
	GMT *time.Location
)

func init() {
	var err error
	GMT, err = time.LoadLocation("GMT")
	if err != nil {
		panic(err)
	}
}

type restHandler struct {
	versionInfo  VersionInfo
	controller   *control.BattleMapController
	authProvider auth.Provider
}

var _ ServerInterface = &restHandler{}

func (h *restHandler) CreateAuthToken(ctx echo.Context) error {
	var token string
	var err error

	existingToken, ok := auth.ExtractBearerToken(ctx)
	if ok {
		kvlog.Info(kvlog.Evt("renewToken"))
		token, err = h.authProvider.RenewToken(existingToken)
	} else {
		kvlog.Info(kvlog.Evt("createToken"))
		token, err = h.authProvider.CreateToken()
	}

	if err != nil {
		return err
	}

	return ctx.Blob(http.StatusCreated, "text/plain", []byte(token))
}

func (h *restHandler) GetBattleMap(ctx echo.Context, id string) error {
	bm, err := h.controller.Load(ctx.Request().Context(), id)
	if err != nil {
		return err
	}

	ifModifiedSince := ctx.Request().Header.Get("If-Modified-Since")
	if ifModifiedSince != "" {
		cacheDate, err := time.Parse(time.RFC1123, ifModifiedSince)
		if err == nil {
			if !cacheDate.UTC().Truncate(time.Second).Before(bm.LastModified.UTC().Truncate(time.Second)) {
				return ctx.NoContent(http.StatusNotModified)
			}
		}
	}

	header := ctx.Response().Header()
	header.Add("Last-Modified", bm.LastModified.In(GMT).Format(time.RFC1123))
	header.Add("Cache-Control", "private, no-cache")

	return ctx.JSON(http.StatusOK, convertEntity(bm))
}

func (h *restHandler) UpdateBattleMap(ctx echo.Context, id string) error {
	userID, ok := auth.UserID(ctx)
	if !ok {
		return echo.ErrForbidden
	}

	var dto UpdateBattleMapJSONBody

	if err := ctx.Bind(&dto); err != nil {
		return err
	}

	err := h.controller.Update(ctx.Request().Context(), userID, convertDto(dto))
	if err != nil {
		return err
	}

	return ctx.NoContent(http.StatusNoContent)
}

func (h *restHandler) GetVersionInfo(ctx echo.Context) error {
	return ctx.JSON(http.StatusOK, h.versionInfo)
}

func convertDto(dto UpdateBattleMapJSONBody) battlemap.BattleMap {
	return battlemap.BattleMap{
		ID:       dto.Id,
		Grid:     dto.Grid,
		Drawings: convertMany(dto.Drawings, convertDrawingDto),
		Zones:    convertMany(dto.Zones, convertZoneDto),
		Tokens:   convertMany(dto.Tokens, convertTokenDto),
	}
}

func convertMany[I, O any](is []I, mapper func(i I) O) []O {
	r := make([]O, len(is))

	for idx, i := range is {
		r[idx] = mapper(i)
	}

	return r
}

func convertDrawingDto(d Drawing) battlemap.Drawing {
	return battlemap.Drawing{
		ID:       d.Id,
		At:       convertXYDto(d.At),
		Vertices: convertXYDtos(d.Vertices),
	}
}

func convertZoneDto(z Zone) battlemap.Zone {
	return battlemap.Zone{
		ID:    z.Id,
		At:    convertXYDto(z.At),
		Label: z.Label,
		Size:  convertXYDto(z.Size),
	}
}

func convertTokenDto(t Token) battlemap.Token {
	return battlemap.Token{
		ID:    t.Id,
		At:    convertXYDto(t.At),
		Color: t.Color,
	}
}

func convertXYDtos(dtos []Vertex) []battlemap.Vertex {
	r := make([]battlemap.Vertex, len(dtos))

	for i, dto := range dtos {
		r[i] = convertXYDto(dto)
	}

	return r
}

func convertXYDto(dto Vertex) battlemap.Vertex {
	return battlemap.Vertex{dto[0], dto[1]}
}

func convertEntity(e battlemap.BattleMap) BattleMap {
	return BattleMap{
		BattleMapUpdate: BattleMapUpdate{
			Id:       e.ID,
			Grid:     e.Grid,
			Drawings: convertMany(e.Drawings, convertDrawing),
			Zones:    convertMany(e.Zones, convertZone),
			Tokens:   convertMany(e.Tokens, convertToken),
		},
		LastModified: e.LastModified,
	}
}

func convertDrawing(d battlemap.Drawing) Drawing {
	return Drawing{
		Id:       d.ID,
		At:       convertVertex(d.At),
		Vertices: convertMany(d.Vertices, convertVertex),
	}
}

func convertZone(z battlemap.Zone) Zone {
	return Zone{
		Id:    z.ID,
		At:    convertVertex(z.At),
		Label: z.Label,
		Size:  convertVertex(z.Size),
	}
}

func convertToken(t battlemap.Token) Token {
	return Token{
		Id:    t.ID,
		At:    convertVertex(t.At),
		Color: t.Color,
	}
}

func convertVertex(x battlemap.Vertex) Vertex {
	return Vertex{x[0], x[1]}
}
