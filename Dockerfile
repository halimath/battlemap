FROM node:16 as BUILDER

WORKDIR /src/scenic
COPY scenic/package*.json ./
RUN npm i

WORKDIR /src/battlemap
COPY battlemap/package*.json ./
RUN npm i

WORKDIR /src/app
COPY app/package*.json ./
RUN npm i

WORKDIR /src/service
COPY service/package*.json ./
RUN npm i

###

WORKDIR /src/scenic
COPY scenic ./
RUN npm run build

WORKDIR /src/battlemap
COPY battlemap ./
RUN npm run build

WORKDIR /src/app
COPY app ./
RUN ls .
RUN npm run build

WORKDIR /src/service
COPY service ./
RUN npm run build

FROM node:16

WORKDIR /app

COPY --from=BUILDER /src/service/node_modules ./node_modules/
COPY --from=BUILDER /src/service/dist/index.js .
COPY --from=BUILDER /src/app/dist ./public/

ENTRYPOINT [ "node", "index.js" ]