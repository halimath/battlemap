import ws from "ws"
import { Logger } from "tslog"

const l = new Logger()

class BattleMapParticipants {
    private lastMessage: string | null = null

    constructor(public readonly editor: ws.WebSocket, public readonly viewers: Array<ws.WebSocket> = []) { }

    addViewer(s: ws.WebSocket) {
        this.viewers.push(s)
        if (this.lastMessage !== null) {
            s.send(this.lastMessage)
        }
    }

    removeViewer(s: ws.WebSocket) {
        this.viewers.splice(this.viewers.indexOf(s))
    }

    close() {
        this.viewers.forEach(f => f.close())
    }

    publish(msg: string) {
        this.lastMessage = msg
        this.viewers.forEach(f => f.send(msg, { binary: false }))
    }
}

const PathPattern = /^\/(?<action>(edit)|(view))\/(?<id>.*)$/

export const wsServer = new ws.Server({ noServer: true })
wsServer.on("connection", (socket, req) => {
    l.debug("got connection")

    const match = PathPattern.exec(req.url ?? "")
    if (!match || !match.groups?.action || !match.groups?.id) {
        l.warn(`invalid ws path: '${req.url}'`)
        socket.close()
        return
    }
    const action = match.groups.action
    const id = match.groups.id

    switch (action) {
        case "edit":
            return createBattleMap(id, socket)
        case "view":
            return viewBattleMap(id, socket)
    }
})

const battleMaps = new Map<string, BattleMapParticipants>()

function createBattleMap(id: string, socket: ws.WebSocket) {
    if (battleMaps.has(id)) {
        l.warn(`Got conflict editing battle map with id ${id}`)
        socket.close()
        return
    }

    l.info(`starting new battle map with id '${id}'`)
    const participants = new BattleMapParticipants(socket)
    battleMaps.set(id, participants)

    socket.on("close", () => {
        l.info(`Closing battle map with id '${id}'`)
        battleMaps.delete(id)
        participants.close()
    })

    socket.on("message", (msg, binary) => {
        if (binary) {
            l.warn(`Got binary message. Discarding ${msg}`)
            return
        }

        if (Array.isArray(msg)) {
            msg = Buffer.concat(msg)
        }

        const update = msg.toString()

        l.info(`Got update for map ${id}`)
        participants.publish(update)
    })
}

function viewBattleMap(id: string, socket: ws.WebSocket) {
    if (!battleMaps.has(id)) {
        l.warn(`Got view connect for non-existing map ${id}`)
        socket.close()
        return
    }

    l.info(`adding viewer for battle map with id '${id}'`)

    const participants = battleMaps.get(id)!
    participants.addViewer(socket)

    socket.on("close", () => {
        l.info(`Disconnecting follower from battle map with id '${id}'`)
        participants.removeViewer(socket)
    })
}