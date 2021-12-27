import express from "express"
import { Logger } from "tslog"

const l = new Logger()

export const app = express()

app.use((req, res, next) => {
    const start = process.hrtime()

    res.on("finish", () => {
        const time = process.hrtime(start)
        const millis = time[0] * 1000 + time[1] / 1000000

        l.info("Request", {
            method: req.method,
            path: req.path,
            "user-agent": req.headers["user-agent"],
            status: res.statusCode,
            time: millis,
        })    
    })

    next()
})

app.use((req, _, next) => {
    if (req.url.startsWith("/join/")) {
        console.log(req.url)
        req.url = "/index.html"
    }

    next()
})

app.use("/", express.static("./public"))