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
			let el = canvas[0] as HTMLCanvasElement
			if (el.width != 960) {
				el.width = 960;
				el.height = 510;
			}
			requestAnimationFrame(canvasResize)
		}
		canvasResize();
		this.announceExternalFunctions();

		return dom[0];
	}

	announceExternalFunctions () {
		let functionsAndTypes = new compiler.ExternalFunctionsTypesConstants();

		functionsAndTypes.addFunction("clear", [
			{name: "color", type: StringType}
		], NothingType, false, (color) => {
			let ctx = this.context;
			ctx.fillStyle = color;
			ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		});

		functionsAndTypes.addFunction("show", [], NothingType, true, () => {
			let asyncResult: vm.AsyncPromise<void> = {
				completed: false,
				value: null
			}
			requestAnimationFrame(() => { asyncResult.completed = true });
			return asyncResult;
		});

		functionsAndTypes.addFunction("drawCircle",[
		{name: "x", type: NumberType},
		{name: "y", type: NumberType},
		{name: "radius", type: NumberType},
		{name: "color", type: StringType}
		], NothingType, false, (x, y, radius, color) =>{

			let ctx = this.context;
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
     	 	ctx.fillStyle = color;
      		ctx.fill();

		});

		functionsAndTypes.addFunction("drawLine", [
			{name: "x1", type: NumberType},
			{name: "y1", type: NumberType},
			{name: "x2", type: NumberType},
			{name: "y2", type: NumberType},
			{name: "color", type: StringType},
		], NothingType, true, (x1, y1, x2, y2, color) => {
			let ctx = this.context;
			ctx.strokeStyle = color;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		});

		functionsAndTypes.addFunction("drawRectangle",[
			{name: "x", type: NumberType },
			{name: "y", type: NumberType },
			{name: "width", type: NumberType},
			{name: "height", type: NumberType },
			{name: "color", type: StringType}
		], NothingType,false,(x,y,width,hegiht,color) =>{
			let ctx = this.context;
			ctx.fillStyle = color;
			ctx.fillRect(x, y, width, hegiht);
		});

		functionsAndTypes.addFunction("drawEllipse",[
			{name: "x", type: NumberType},
			{name: "y", type: NumberType},
			{name: "radiusX", type: NumberType},
			{name: "radiusY", type: NumberType},
			{name: "color", type: StringType}
		], NothingType,false,(x, y, radiusX, radiusY, color) =>{
			let ctx = this.context;
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.ellipse(x,y,radiusX,radiusY,0 * Math.PI/180, 0, 2 * Math.PI);
			ctx.fill();
		});

		functionsAndTypes.addFunction("drawText",[
			{name: "text", type: StringType},
			{name: "x", type: NumberType},
			{name: "y", type: NumberType},
			{name: "fontSize", type: NumberType},
			{name: "fontFamily", type: StringType},
			{name: "color", type: StringType}
		], NothingType, false, (text,x,y,fontSize,fontFamily,color) =>{
			let ctx = this.context;
			ctx.font = fontSize.toString()+"px "+fontFamily;
			ctx.fillStyle = color;
			ctx.fillText(text,x,y);
		});

		let imageType = functionsAndTypes.addType("image", [
			{name: "width", type: NumberType},
			{name: "height", type: NumberType},
			{name: "url", type: StringType}
		], false);

		functionsAndTypes.addFunction("loadImage",[
			{name: "url", type: StringType}
		], imageType, true, (url) => {
			var image = new Image();
			let asyncResult: vm.AsyncPromise<Array<any>> = {
				completed: false,
				value: null
			}
			image.onload = () => {
				asyncResult.completed = true;
				let record = [];
				record[0] = image.width;
				record[1] = image.height;
				record[2] = url;
				record[3] = image;
				asyncResult.value = record;
			};
			image.onerror = () => {
				alert("Couldn't load image " + url);
				asyncResult.completed = true;
				let record = [];
				record[0] = image.width;
				record[1] = image.height;
				record[2] = url;
				record[3] = new Image();
				asyncResult.value = record;
			}
			image.src = url;
			return asyncResult;
		});
		functionsAndTypes.addFunction("drawImage",[
			{name: "image", type: imageType},
			{name: "x", type: NumberType},
			{name: "y", type: NumberType},
			{name: "width", type: NumberType},
			{name: "height", type: NumberType}
		], NothingType, false, (image,x,y,width,height) =>{
			let ctx = this.context;
			if (!image[3]) return;
			ctx.drawImage(image[3],x,y,width,height);
		});


		var mouseX = 0;
		var mouseY = 0;
		var mouseButtonDown = false;
		// getMouseX(), getMouseY()
		// getMouseButtonDown(): boolean

		let input = new Input(this.canvas);
		let canvas = this.canvas;
		input.addListener({
			down: (x, y) => {
				mouseButtonDown = true;
			},
			up:  (x, y) => {
				mouseButtonDown = false;


			},
			moved: (x, y) => {
				mouseX = x / $(canvas).width() * canvas.width;
				mouseY = y / $(canvas).height() * canvas.height;
			},
			dragged: (x, y) => {
				mouseX = x / $(canvas).width() * canvas.width;
				mouseY = y / $(canvas).height() * canvas.height;
			}
		});
		functionsAndTypes.addFunction("getMouseX",[],NumberType,false,()=>{
			return mouseX;
		});
		functionsAndTypes.addFunction("getMouseY",[],NumberType,false,()=>{
			return mouseY;
		});

		functionsAndTypes.addFunction("isMouseButtonDown",[],compiler.BooleanType,false,()=>{
			return mouseButtonDown;
		})

		functionsAndTypes.addFunction("rgb", [
			{name: "red", type: NumberType},
			{name: "green", type: NumberType},
			{name: "blue", type: NumberType}
		], StringType, false, (red: number, green: number, blue: number) => {
			red = Math.max(0, Math.min(255, red));
			green = Math.max(0, Math.min(255, green))
			blue = Math.max(0, Math.min(255, blue))
			return `rgb(${red}, ${green}, ${blue})`;
		});

		functionsAndTypes.addFunction("rgba", [
			{name: "red", type: NumberType},
			{name: "green", type: NumberType},
			{name: "blue", type: NumberType},
			{name: "alpha", type: NumberType}
		], StringType, false, (red: number, green: number, blue: number, alpha) => {
			red = Math.max(0, Math.min(255, red));
			green = Math.max(0, Math.min(255, green))
			blue = Math.max(0, Math.min(255, blue)) / 255;
			return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
		});

		this.bus.event(new events.AnnounceExternalFunctions(functionsAndTypes));
	}

	onEvent(event: events.Event) {
		if (event instanceof events.Run) {
			let ctx = this.context;
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		} else if (event instanceof events.BeforeSaveProject) {
			event.project.type = "canvas";
		}
	}
}