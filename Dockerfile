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

ARG version=0.3.2
ARG commit=local

WORKDIR /app

COPY backend ./
COPY --from=NODE_BUILDER /src/app/dist ./internal/boundary/public
RUN go build -ldflags "-X main.Version=${version} -X main.Commit=${commit}" .

FROM alpine:latest

RUN apk add tzdata

COPY --from=GO_BUILDER /app/backend /backend

EXPOSE 8080

LABEL maintainer="Alexander Metzner <alexander.metzner@gmail.com>" \
    version=${version} \
    commit=${commit} \
    url="https://github.com/halimath/fate-core-remote-table" \
    vcs-uri="https://github.com/halimath/fate-core-remote-table.git"

ENTRYPOINT [ "/backend" ]