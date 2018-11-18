import { EventBus, EventListener, Event } from "./widgets/Events"
import { Toolbar, ToolbarMode } from "./widgets/Toolbar";

export class DevsPage implements EventListener {
	private eventBus = new EventBus();
	private toolbar = new Toolbar(this.eventBus, ToolbarMode.UserPage);

	constructor (parent: JQuery) {
		// Register the components
		this.eventBus.addListener(this);
		this.eventBus.addListener(this.toolbar);

		// Add the toolbar to the parent directly
		$(this.toolbar.render()).insertBefore($(parent).find("#pb-devs-page"));
	}

	onEvent(event: Event) {
	}
}