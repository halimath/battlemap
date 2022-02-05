FROM node:16 as NODE_BUILDER

WORKDIR /src/scenic
COPY scenic/package*.json ./
RUN npm i

WORKDIR /src/battlemap
COPY battlemap/package*.json ./
RUN npm i

WORKDIR /src/app
COPY app/package*.json ./
RUN npm i

###

WORKDIR /src/scenic
COPY scenic ./
RUN npm run build

WORKDIR /src/battlemap
COPY battlemap ./
RUN npm run build

WORKDIR /src/docs
COPY docs/api.yaml .

WORKDIR /src/app
COPY app ./
RUN ls .
RUN npm run generate-api-client
RUN npm run build


FROM golang:1.18-rc-alpine AS GO_BUILDER

WORKDIR /app

COPY backend ./
COPY --from=NODE_BUILDER /src/app/dist ./internal/boundary/public
RUN go build

FROM alpine:latest

RUN apk add tzdata

COPY --from=GO_BUILDER /app/backend /backend

EXPOSE 8080

ENTRYPOINT [ "/backend" ]