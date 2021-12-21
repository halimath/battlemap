
export interface EventListener {
    (evt: any): void
}

export class EventEmitter {
    private readonly listener = new Map<string, Array<EventListener>>()

    on(name: string, listener: EventListener): EventEmitter {
        if (!this.listener.has(name)) {
            this.listener.set(name, [listener])
            return this
        }

        this.listener.get(name)!.push(listener)

        return this
    }

    emit(name: string, event: any): EventEmitter {
        if (this.listener.has(name)) {
            this.listener.get(name)!.forEach(l => l(event))
        }

        return this
    }
}