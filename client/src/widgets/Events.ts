import * as compiler from "../Compiler"

export class SourceChanged { constructor(public source: string, public module: compiler.Module | null) {}}
export class Run { }
export class Debug { }
export class Pause { }
export class Resume { }
export class Stop { }
export class Step { constructor(public line: number) {} }
export class LineChange { constructor(public line: number) {} }
export class Select { constructor(public startLine: number, public startColumn: number, public endLine: number, public endColumn: number) {} }
export class AnnounceExternalFunctions { constructor(public functions: compiler.ExternalFunctions) {} }

export class LoggedIn { };
export class LoggedOut { };
export type Event =
	SourceChanged | Run | Debug | Pause | Resume | Stop | Step | LineChange | Selection |
	LoggedIn | LoggedOut;

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