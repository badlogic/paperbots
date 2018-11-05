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

		this.editor.setEmbedURls(false);

		parent.append(dom);
	}

	sentSource = false;
	onEvent(event: Event) {
		if (event instanceof SourceChanged) {
			if (!this.sentSource) requestAnimationFrame(() => this.editor.setSource(`
var img = loadImage("https://avatars1.githubusercontent.com/u/514052?s=88&v=4")

while true do
	clear("black")
	var x = getMouseX()
	var y = getMouseY()

	var start = time()

	repeat 1000 times
		drawImage(img, random() * 960, random() * 510, img.width, img.height)
	end

	if isMouseButtonDown() then
		drawRectangle(x, y, img.width, img.height, "red")
	else
		drawRectangle(x, y, img.width, img.height, "green")
	end

	drawText(toString(truncate((time() - start) * 1000)) .. "ms", 100, 100, 43, "Arial", "red")

	show()
end
			`));
			this.sentSource = true;
		}
	}
}

/*var img = loadImage("https://pbs.twimg.com/profile_images/996073929000341504/2KsTl4Tj_400x400.jpg")

clear("black")drawRectangle(0, 0, 100, 100, "green")
drawLine(0, 480, 640, 0, "red")
drawLine(0, 0, 640, 480, "red")
drawText("Hello world", 100, 100, 32, "Arial", "red")
drawImage(img, 0, 0, 100, 100)*/