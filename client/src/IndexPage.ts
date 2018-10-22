import { EventBus, EventListener, Event } from "./widgets/Events"
import { Toolbar, ToolbarMode } from "./widgets/Toolbar";
import { Api } from "./Api";
import { Dialog } from "./widgets/Dialog";

export class IndexPage implements EventListener {
	private eventBus = new EventBus();
	private toolbar = new Toolbar(this.eventBus, ToolbarMode.UserPage);

	constructor (parent: HTMLElement) {
		// Register the components
		this.eventBus.addListener(this);
		this.eventBus.addListener(this.toolbar);

		// Render the components
		let dom = $(/*html*/ `
			<div id="pb-index-page">
			</div>
		`);
		dom.append(this.toolbar.render());
		$(dom).append($(/*html*/`
			<h1>Welcome to Paperbots</h1>
		`));

		$(parent).append(dom);

		// Migration for old URLs
		let projectId = Api.getUrlParameter("projectId")
		if (projectId) {
			(window.location as any) = `/project.html?id=${projectId}`;
		}

		// TODO once this page is implemented
		// stop redirecting.
		(window.location as any) = "/project.html"
	}

	onEvent(event: Event) {
	}
}