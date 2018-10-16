import {AssetManager, Input, TimeKeeper, InputListener} from "./Utils";
import { EventBus, EventListener, Event } from "./widgets/Events"
import { Debugger } from "./widgets/Debugger";
import { Editor } from "./widgets/Editor"
import { Botland } from "./widgets/Botland";
import * as compiler from "./Compiler"
import { SplitPane } from "./widgets/SplitPane";

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
		editorAndDebugger.append(this.debugger.render());
		editorAndDebugger.append(this.editor.render());

		let splitPane = new SplitPane(editorAndDebugger, $(this.playground.render()));
		dom.append(splitPane.dom);
		$(parent).append(dom);
	}

	onEvent(event: Event) {
	}
}