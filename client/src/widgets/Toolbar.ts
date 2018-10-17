import { Widget } from "./Widget"
import { EventBus, Event } from "./Events";

export class Toolbar extends Widget {
	constructor(bus: EventBus) {
		super(bus);
	}

	render(): HTMLElement {
		let dom = $(/*html*/`
			<div id="pb-toolbar">
				<div id="pb-toolbar-logo" class="pb-toolbar-button-right">PAPERBOTS</div>
				<div class="pb-toolbar-button-right">Login</div>
			</div>
		`);
		return dom[0];
	}

	onEvent(event: Event) {
	}
}