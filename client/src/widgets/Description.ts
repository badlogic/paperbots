import { Widget } from "./Widget"
import { EventBus, Event } from "./Events";

export class Description extends Widget {
	constructor(bus: EventBus) {
		super(bus);
	}

	render(): HTMLElement {
		let dom = $(/*html*/`
			<div id="pb-description"></div>
		`);
		return dom[0];
	}

	onEvent(event: Event) {
	}
}