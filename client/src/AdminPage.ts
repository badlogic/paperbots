import { EventBus, EventListener, Event } from "./widgets/Events"
import { Toolbar, ToolbarMode } from "./widgets/Toolbar";
import { Api, Project, Sorting } from "./Api";
import { Dialog } from "./widgets/Dialog";
import { ProjectList } from "./widgets/ProjectList";

export class AdminPage implements EventListener {
	private eventBus = new EventBus();
	private toolbar = new Toolbar(this.eventBus, ToolbarMode.UserPage);
	private projects: Project[] = [];
	private fetching = false;

	constructor (parent: JQuery) {
		// Register the components
		this.eventBus.addListener(this);
		this.eventBus.addListener(this.toolbar);

		// Add the toolbar at the top of the page
		parent.append(this.toolbar.render());

		// Render the components
		let dom = $(/*html*/ `
			<div id="pb-admin-page">
				<h1>Administration</h1>
			</div>
		`);
		let projectList = new ProjectList(this.eventBus, (sorting, dateOffset, success, error) => Api.getProjectsAdmin(sorting, dateOffset, success, error));
		dom.append(projectList.render());
		$(parent).append(dom);
	}

	onEvent(event: Event) {
	}
}