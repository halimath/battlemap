import { wsServer } from "./src/ws"
import { app } from "./src/http"
import { Logger } from "tslog"

const l = new Logger()

const httpServer = app.listen(8080, "0.0.0.0", () => {
    l.info("listening on 0.0.0.0:8080")
})

httpServer.on("upgrade", (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit("connection", socket, request)
    })
})

process.on("SIGINT", () => {
    l.info("Shutting down")
    httpServer.close()
    process.exit(0)
})