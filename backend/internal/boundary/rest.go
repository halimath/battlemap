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
	if auth.IsAuthorized(ctx) {
		kvlog.Warn(kvlog.Evt("alreadyAuthorized"))
		return echo.ErrForbidden
	}

	token, err := h.authProvider.CreateToken()
	if err != nil {
		return err
	}

	return ctx.Blob(http.StatusCreated, "text/plain", []byte(token))
}

func (h *restHandler) GetBattleMap(ctx echo.Context, id string) error {
	bm, lastModified, err := h.controller.Load(ctx.Request().Context(), id)
	if err != nil {
		return err
	}

	ifModifiedSince := ctx.Request().Header.Get("If-Modified-Since")
	if ifModifiedSince != "" {
		cacheDate, err := time.Parse(time.RFC1123, ifModifiedSince)
		if err == nil {
			if !cacheDate.UTC().Truncate(time.Second).Before(lastModified.UTC().Truncate(time.Second)) {
				return ctx.NoContent(http.StatusNotModified)
			}
		}
	}

	header := ctx.Response().Header()
	header.Add("Last-Modified", lastModified.In(GMT).Format(time.RFC1123))
	header.Add("Cache-Control", "private; must-revalidate")

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
		ID:     d.Id,
		At:     convertXYDto(d.At),
		Points: convertXYDtos(d.Points),
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

func convertXYDtos(dtos []XY) []battlemap.XY {
	r := make([]battlemap.XY, len(dtos))

	for i, dto := range dtos {
		r[i] = convertXYDto(dto)
	}

	return r
}

func convertXYDto(dto XY) battlemap.XY {
	return battlemap.XY{dto[0], dto[1]}
}

func convertEntity(e battlemap.BattleMap) BattleMap {
	return BattleMap{
		Id:       e.ID,
		Grid:     e.Grid,
		Drawings: convertMany(e.Drawings, convertDrawing),
		Zones:    convertMany(e.Zones, convertZone),
		Tokens:   convertMany(e.Tokens, convertToken),
	}
}

func convertDrawing(d battlemap.Drawing) Drawing {
	return Drawing{
		Id:     d.ID,
		At:     convertXY(d.At),
		Points: convertMany(d.Points, convertXY),
	}
}

func convertZone(z battlemap.Zone) Zone {
	return Zone{
		Id:    z.ID,
		At:    convertXY(z.At),
		Label: z.Label,
		Size:  convertXY(z.Size),
	}
}

func convertToken(t battlemap.Token) Token {
	return Token{
		Id:    t.ID,
		At:    convertXY(t.At),
		Color: t.Color,
	}
}

func convertXY(x battlemap.XY) XY {
	return XY{x[0], x[1]}
}
