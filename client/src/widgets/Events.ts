import * as compiler from "../Compiler"

export class SourceChanged { constructor(public source: string, public module: compiler.Module | null) {}}
export class Run { }
export class Debug { }
export class Step { constructor(public line: number) {} }
export class Stop { }
export class LineChange { constructor(public line: number) {} }
export class Select { constructor(public startLine: number, public startColumn: number, public endLine: number, public endColumn: number) {} }
export class AnnounceExternalFunctions { constructor(public functions: compiler.ExternalFunctions) {} }
export type Event = SourceChanged | Run | Debug | Step | Stop | LineChange | Selection;

export interface EventListener {
	onEvent(event: Event);
}

export class EventBus {
	private listeners = new Array<EventListener>()

	addListener(listener: EventListener) {
		this.listeners.push(listener);
	}

	event(event: Event) {
		this.listeners.forEach(listener => listener.onEvent(event));
	}
}