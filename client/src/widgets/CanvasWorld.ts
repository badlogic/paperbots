import * as events from "./Events"
import { Widget } from "./Widget"
import { AssetManager, Input, InputListener, TimeKeeper, setElementEnabled } from "../Utils"
import * as compiler from "../language/Compiler"
import * as vm from "../language/VirtualMachine"
import { NumberType, StringType, NothingType } from "../language/Compiler";

export class CanvasWorld extends Widget {
	canvas: HTMLCanvasElement;
	context: CanvasRenderingContext2D;

	constructor(bus: events.EventBus) {
		super(bus);
	}

	render(): HTMLElement {
		let dom = $(/*html*/`
			<div id="pb-canvas-world">
				<canvas></canvas>
			</div>
		`);

		let canvas = dom.find("canvas");
		this.canvas = canvas[0] as HTMLCanvasElement
		this.context = this.canvas.getContext('2d');

		let canvasResize = ( ) => {
			var canvas = dom.find("canvas");
			var width = canvas.width();
			var height = width / 16 * 9;
			if (height == canvas.height()) {
				requestAnimationFrame(canvasResize)
				return;
			}
			canvas.height(height);
			requestAnimationFrame(canvasResize)
		}
		requestAnimationFrame(canvasResize);

		let functions = new compiler.ExternalFunctions();
		functions.addFunction("line", [
			{name: "x1", type: NumberType},
			{name: "y1", type: NumberType},
			{name: "x2", type: NumberType},
			{name: "y2", type: NumberType},
			{name: "color", type: StringType}
		], NothingType, true, (x1, y1, x2, y2, color) => {
			let ctx = this.context;
			ctx.strokeStyle = color;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		});

		functions.addFunction("clear", [
			{name: "color", type: StringType}
		], NothingType, false, (color) => {
			let ctx = this.context;
			ctx.fillStyle = color;
			ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		});

		functions.addFunction("show", [], NothingType, true, () => {
			let asyncResult: vm.AsyncPromise<void> = {
				completed: false,
				value: null
			}
			requestAnimationFrame(() => { asyncResult.completed = true });
			return asyncResult;
		});
		this.bus.event(new events.AnnounceExternalFunctions(functions));

		return dom[0];
	}
	onEvent(event: events.Event) {
	}
}