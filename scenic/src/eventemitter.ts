
export interface EventListener<T> {
    (evt: T): void
}

export class EventEmitter<T> {
    private readonly listener = new Map<string, Array<EventListener<T>>>()

    on(name: string, listener: EventListener<T>): EventEmitter<T> {
        if (!this.listener.has(name)) {
            this.listener.set(name, [listener])
            return this
        }

        this.listener.get(name)?.push(listener)

        return this
    }

    emit(name: string, event: T): EventEmitter<T> {
        this.listener.get(name)?.forEach(l => l(event))

        return this
    }
}