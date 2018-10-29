import { EventBus, EventListener, Event } from "./widgets/Events"
import { Toolbar, ToolbarMode } from "./widgets/Toolbar";
import { Api, Project } from "./Api";
import { Dialog } from "./widgets/Dialog";
import { Player } from "./widgets/Player";
import { ProjectPreview } from "./widgets/ProjectPreview";

export class DevsPage implements EventListener {
	private eventBus = new EventBus();
	private toolbar = new Toolbar(this.eventBus, ToolbarMode.UserPage);

	constructor (parent: HTMLElement) {
		// Register the components
		this.eventBus.addListener(this);
		this.eventBus.addListener(this.toolbar);

		// Add the toolbar to the parent directly
		$(this.toolbar.render()).insertBefore($(parent).find("#pb-devs-page"));
	}

	onEvent(event: Event) {
	}
}