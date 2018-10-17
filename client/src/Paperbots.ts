import {AssetManager, Input, TimeKeeper, InputListener} from "./Utils";
import { EventBus, EventListener, Event } from "./widgets/Events"
import { Toolbar } from "./widgets/Toolbar";
import { Debugger } from "./widgets/Debugger";
import { Editor } from "./widgets/Editor"
import { Botland } from "./widgets/Botland";
import * as compiler from "./Compiler"
import { SplitPane } from "./widgets/SplitPane";
import { Docs } from "./widgets/Docs";
import { Description } from "./widgets/Description";

export class Paperbots implements EventListener {
	private eventBus = new EventBus();
	private toolbar = new Toolbar(this.eventBus);
	private editor = new Editor(this.eventBus);
	private debugger = new Debugger(this.eventBus);
	private playground = new Botland(this.eventBus);
	private docs = new Docs(this.eventBus);
	private desc = new Description(this.eventBus);

	constructor(parent: HTMLElement) {
		// register all components with the bus
		this.eventBus.addListener(this);
		this.eventBus.addListener(this.toolbar);
		this.eventBus.addListener(this.editor);
		this.eventBus.addListener(this.debugger);
		this.eventBus.addListener(this.playground);
		this.eventBus.addListener(this.docs);
		this.eventBus.addListener(this.desc);

		// Render the components
		let dom = $(/*html*/ `
			<div id="pb-main">
			</div>
		`);

		dom.append(this.toolbar.render());

		let editorAndDebugger = $(/*html */`
			<div id ="pb-editor-and-debugger">
			</div>
		`);
		editorAndDebugger.append(this.debugger.render());

		let editorAndDocs = $(/*html*/`
			<div id="pb-editor-and-docs">
			</div>
		`)
		editorAndDocs.append(this.editor.render());
		let docs = this.docs.render();
		let helpLabel = $(/*html*/`<div id="pb-docs-label" class="pb-label">HELP</div>`);
		helpLabel.click(() => {
			$(docs).toggle();
		});
		editorAndDocs.append(helpLabel);
		editorAndDocs.append(docs);
		editorAndDebugger.append(editorAndDocs);

		let playgroundAndDescription = $(/*html*/`
			<div id="pb-playground-and-description">
			</div>
		`);

		playgroundAndDescription.append(this.playground.render());
		playgroundAndDescription.append(this.desc.render());

		let splitPane = new SplitPane(editorAndDebugger, playgroundAndDescription);
		dom.append(splitPane.dom);
		$(parent).append(dom);
	}

	onEvent(event: Event) {
	}
}