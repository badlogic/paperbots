import { EventBus, EventListener, Event, SourceChanged } from "./widgets/Events"
import { Editor } from "./widgets/Editor";
import { Debugger } from "./widgets/Debugger";
import { CanvasWorld } from "./widgets/CanvasWorld";

export class CanvasPage implements EventListener {
	private eventBus = new EventBus();
	private editor = new Editor(this.eventBus);
	private debugger = new Debugger(this.eventBus);
	private canvas = new CanvasWorld(this.eventBus);

	constructor(parent: JQuery) {
		// register all components with the bus
		this.eventBus.addListener(this);
		this.eventBus.addListener(this.editor);
		this.eventBus.addListener(this.debugger);
		this.eventBus.addListener(this.canvas);

		let dom = $(/*html*/`
			<div id="pb-canvas-page">
			</div>
		`);

		dom.append(this.debugger.render());
		dom.append(this.editor.render());
		dom.append(this.canvas.render());

		parent.append(dom);
	}

	sentSource = false;
	onEvent(event: Event) {
		if (event instanceof SourceChanged) {
			if (!this.sentSource) requestAnimationFrame(() => this.editor.setSource(`
var x = 0
while true do
	clear("black")
	line(x, 0, x, 100, "red")
	x = x + 1
	show()
end
			`));
			this.sentSource = true;
		}
	}
}