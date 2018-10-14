import {AssetManager, Input, TimeKeeper, InputListener} from "./Utils";
import { Debugger } from "./widgets/Debugger";
import { Editor } from "./widgets/Editor"
import { Botland } from "./widgets/Botland";
import * as compiler from "./Compiler"

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

export abstract class Widget implements EventListener {
	constructor(protected bus: EventBus) { }
	abstract render (): HTMLElement;
	abstract onEvent(event: Event);
}

export class Paperbots implements EventListener {
	private eventBus = new EventBus();
	private editor = new Editor(this.eventBus);
	private debugger = new Debugger(this.eventBus);
	private playground = new Botland(this.eventBus);

	constructor(parent: HTMLElement) {
		// register all components with the bus
		this.eventBus.addListener(this);
		this.eventBus.addListener(this.editor);
		this.eventBus.addListener(this.debugger);
		this.eventBus.addListener(this.playground);

		// Render the components
		let dom = $(/*html*/ `
			<div id="pb-main">
			</div>
		`);

		let editorAndDebugger = $(/*html */`
			<div id ="pb-editor-and-debugger">
			</div>
		`);
		editorAndDebugger.append(this.editor.render());
		editorAndDebugger.append(this.debugger.render());
		dom.append(editorAndDebugger);
		dom.append(this.playground.render());
		$(parent).append(dom);
	}

	onEvent(event: Event) {
	}
}