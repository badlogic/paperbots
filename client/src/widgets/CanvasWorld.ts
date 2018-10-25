import * as events from "./Events"
import { Widget } from "./Widget"
import { AssetManager, Input, InputListener, TimeKeeper, setElementEnabled } from "../Utils"
import * as compiler from "../language/Compiler"
import * as vm from "../language/VirtualMachine"
import { countColumn } from "codemirror";

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
			new compiler.ExternalFunctionParameter("x1", "number"),
			new compiler.ExternalFunctionParameter("y1", "number"),
			new compiler.ExternalFunctionParameter("x2", "number"),
			new compiler.ExternalFunctionParameter("y2", "number"),
			new compiler.ExternalFunctionParameter("color", "string")
		], "nothing", true, (x1, y1, x2, y2, color) => {
			let ctx = this.context;
			ctx.strokeStyle = color;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		});

		functions.addFunction("clear", [
			new compiler.ExternalFunctionParameter("color", "string")
		], "nothing", false, (color) => {
			let ctx = this.context;
			ctx.fillStyle = color;
			ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		});

		functions.addFunction("show", [], "nothing", true, () => {
			let asyncResult: vm.AsyncPromise<void> = {
				completed: false,
				value: null
			}
			requestAnimationFrame(() => { asyncResult.completed = true });
			return asyncResult;
		});

		functions.addFunction("drawCircle",[
		new compiler.ExternalFunctionParameter("radius","number"),
		new compiler.ExternalFunctionParameter("x","number"),
		new compiler.ExternalFunctionParameter("y","number"),
		new compiler.ExternalFunctionParameter("color","string")],
		"nothing", false, (radius,x,y,color) =>{

			let ctx = this.context;
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, 2*Math.PI, false);
     	 	ctx.fillStyle = color;
      		ctx.fill();
     		
		});
		functions.addFunction("drawRectangle",[
			new compiler.ExternalFunctionParameter("width","number"),
			new compiler.ExternalFunctionParameter("height","number"),
			new compiler.ExternalFunctionParameter("x","number"),
			new compiler.ExternalFunctionParameter("y","number"),
			new compiler.ExternalFunctionParameter("color","string")
		],"nothing",false,(width,hegiht,x,y,color) =>{
			let ctx = this.context;
			ctx.fillStyle = color;
			ctx.fillRect(x, y, width, hegiht);
		});

		functions.addFunction("drawEllipse",[
			new compiler.ExternalFunctionParameter("radiusX","number"),
			new compiler.ExternalFunctionParameter("radiusY","number"),
			new compiler.ExternalFunctionParameter("x","number"),
			new compiler.ExternalFunctionParameter("y","number"),
			new compiler.ExternalFunctionParameter("color","string")
		],"nothing",false,(radiusX,radiusY,x,y,color) =>{
			let ctx = this.context;
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.ellipse(x,y,radiusX,radiusY,0 * Math.PI/180, 0, 2 * Math.PI);
			ctx.fill();

		});

		functions.addFunction("drawText",[
			new compiler.ExternalFunctionParameter("text","string"),
			new compiler.ExternalFunctionParameter("x","number"),
			new compiler.ExternalFunctionParameter("y","number"),
			new compiler.ExternalFunctionParameter("fontSize","number"),
			new compiler.ExternalFunctionParameter("fontFamily","string"),
			new compiler.ExternalFunctionParameter("color","string")
		],"nothing",false,(text,x,y,fontSize,fontFamily,color) =>{
			let ctx = this.context;
			ctx.font = fontSize.toString()+"px"+fontFamily;
			ctx.fillStyle = color;
			ctx.fillText(text,x,y);
		})
		this.bus.event(new events.AnnounceExternalFunctions(functions));

		return dom[0];
	}
	onEvent(event: events.Event) {
	}
}