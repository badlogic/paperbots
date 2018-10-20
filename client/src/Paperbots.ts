import {AssetManager, Input, TimeKeeper, InputListener} from "./Utils";
import { EventBus, EventListener, Event, ProjectLoaded, SourceChanged, ProjectSaved, ProjectChanged } from "./widgets/Events"
import { Toolbar } from "./widgets/Toolbar";
import { Debugger } from "./widgets/Debugger";
import { Editor } from "./widgets/Editor"
import { RobotWorld } from "./widgets/RobotWorld";
import * as compiler from "./language/Compiler"
import { SplitPane } from "./widgets/SplitPane";
import { Docs } from "./widgets/Docs";
import { Description } from "./widgets/Description";
import { Api } from "./Api";
import { Dialog } from "./widgets/Dialog";

export class Paperbots implements EventListener {
	private eventBus = new EventBus();
	private toolbar = new Toolbar(this.eventBus);
	private editor = new Editor(this.eventBus);
	private debugger = new Debugger(this.eventBus);
	private playground = new RobotWorld(this.eventBus);
	private docs = new Docs(this.eventBus);
	private desc = new Description(this.eventBus);
	private unsaved = false;

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

		let editor = this.editor.render();
		let editorLabel = $(/*html*/`<div id="pb-docs-label" class="pb-label">PROGRAM</div>`);
		editorAndDocs.append(editorLabel);
		editorLabel.click(() => {
			$(editor).toggle();
		});
		editorAndDocs.append(editor);

		let help = this.docs.render();
		let helpLabel = $(/*html*/`<div id="pb-docs-label" class="pb-label">HELP</div>`);
		helpLabel.click(() => {
			$(help).toggle();
		});
		editorAndDocs.append(helpLabel);
		editorAndDocs.append(help);
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

		// Check if we got a project id, and if so, try to load it
		let projectId = Api.getProjectId();
		if (projectId) {
			this.loadProject(projectId);
		}

		// Setup a check to alert the user to not leave the site
		// If there are unsaved changes
		window.onbeforeunload = () => {
			if (window.location.host == "localhost:8001") return;
			if (this.unsaved) {
				return "You have unsaved changes. Are you sure you want to leave?";
			} else {
				return null;
			}
		}
	}

	loadProject (id: string) {
		let content = $(/*html*/`
		<div style="display: flex; flex-direction: column; width: 100%; height: 100%;">
			<p>Loading project ${id}, stay tuned!</p>
			<div id="pb-spinner" class="fa-3x" style="text-align: center; margin: 0.5em"><i class="fas fa-spinner fa-pulse"></i></div>
		</div>`
		);
		let spinner = content.find("#pb-spinner");
		let dialog = new Dialog("Loading", content[0], []);
		dialog.show();

		Api.loadProject(id, (project) => {
			dialog.hide();
			this.eventBus.event(new ProjectLoaded(project));
		}, (error) => {
			dialog.hide();
			if (error.error == "ProjectDoesNotExist") {
				Dialog.alert("Sorry", $(`<p>The project with id ${id} does not exist.</p>`));
			} else {
				Dialog.alert("Sorry", $(`<p>Couldn't load project ${id}.</p>`));
			}
		});
	}

	onEvent(event: Event) {
		if (event instanceof ProjectChanged) {
			this.unsaved = true;
		} else if (event instanceof ProjectSaved) {
			this.unsaved = false;
		} else if (event instanceof ProjectLoaded) {
			this.unsaved = false;
		}
	}
}