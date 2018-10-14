import { EventBus, Event, EventListener } from "./Events"

export abstract class Widget implements EventListener {
	constructor(protected bus: EventBus) { }
	abstract render (): HTMLElement;
	abstract onEvent(event: Event);
}