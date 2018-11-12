import * as events from "./Events"
import { Widget } from "./Widget"
import { AssetManager, Input, InputListener, TimeKeeper, setElementEnabled } from "../Utils"
import * as compiler from "../language/Compiler"
import * as vm from "../language/VirtualMachine"
import * from "howler"
import { NumberType, StringType, NothingType } from "../language/Compiler";
import { DocCategory } from "./Docs";

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
		this.announceDocs();

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
				mouseX = x / $(canvas).width() * canvas.width;
				mouseY = y / $(canvas).height() * canvas.height;
			},
			up:  (x, y) => {
				mouseButtonDown = false;
				mouseX = x / $(canvas).width() * canvas.width;
				mouseY = y / $(canvas).height() * canvas.height;
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
		let soundType = functionsAndTypes.addType("sound", [
			{name: "url", type: StringType},
			{name: "duration", type: NumberType},
			{name: "volume",type: NumberType},
			{name: "rate",type: NumberType}
		], false);
		

		functionsAndTypes.addFunction("loadSound",[
			{name:"url",type:StringType}
		],soundType,true,(url)=>{
			var sound = new Howl({
				src: [url, url]
			  });
			let asyncResult: vm.AsyncPromise<Array<any>> = {
				completed: false,
				value: null
			}
			sound.on("load",()=>{
				asyncResult.completed = true;
				let record = [];
				record[0] = url;
				record[1] = sound.duration;
				record[2] = sound.volume;
				record[3] = sound.rate;
				record[4] = sound;
				asyncResult.value = record;

			});
			sound.on("loaderror",()=>{
				alert("Couldn't load sound " + url);
				asyncResult.completed = true;
				let record = [];
				record[0] = url;
				record[1] = sound.duration;
				record[2] = sound.volume;
				record[3] = sound.rate;
				record[4] = new Howl({
					src: [url, url]
					});
				asyncResult.value = record;
			});
		
			return asyncResult;

		});

		functionsAndTypes.addFunction("playSound",[
			{name:"sound",type:soundType}
		],NumberType,false,(sound)=>{
			return sound[sound.length-1].play();
		});
		functionsAndTypes.addFunction("stopSound",[
			{name:"sound",type:soundType},
			{name:"soundId",type:NumberType}
		],NothingType,false,(sound,soundId)=>{
			sound[sound.length-1].stop(soundId);
		});
		
		functionsAndTypes.addFunction("pauseSound",[
			{name:"sound",type:soundType},
			{name:"soundId",type:NumberType}
		],NothingType,false,(sound,soundId)=>{
			sound[sound.length-1].pause(soundId);
		});
		functionsAndTypes.addFunction("setVolume",[
			{name:"volume",type:NumberType},
			{name:"sound",type:soundType},
			{name:"soundId",type:NumberType}
		],NothingType,false,(volume,sound,soundId)=>{
			sound[sound.length-1].volume(volume,soundId);

		});
		functionsAndTypes.addFunction("setRate",[
			{name:"rate",type:NumberType},
			{name:"sound",type:soundType},
			{name:"soundId",type:NumberType}
		],NothingType,false,(rate,sound,soundId)=>{
			sound[sound.length-1].rate(rate,soundId);

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

	announceDocs () {
		let docs: DocCategory = {
			name: "Canvas program functions & types",
			desc: /*html*/`
				<p>
					Use these functions and types to draw shapes and images and get input from the mouse and keyboard!
				</p>
				<p>
					Your program can draw to, and receive user input from the canvas. The canvas is always 960 pixels wide
					and 510 pixels high.A pixel can be located by its <code>(x, y)</code> coordinate.
				</p>
				<p>
					The <code>x</code> coordinate can be between <code>0</code> (left most pixel) and <code>959</code> (right most pixel). The <code>y</code> coordinate can be between <code>0</code> (top most pixel) and <code>509</code> (bottom most pixel). Most of the drawing functions expect you to specify coodinates and sizes in pixels.
				</p>
				<p>
					A pixel also has a color consisting of a red, green, and blue component. Each color component can have a value between <code>0</code> (no contribution) and <code>255</code> (full contribution). The final color of a pixel is calculated by the graphics card of your computer. Like a painter, it mixes the 3 colors red, green, and blue according to their contribution.
				<p>
					Most of the drawing functions expect you to specify a color as a <code>string</code>. For example, you can specify the color red as <code>"red"</code>, the color yellow as <code>"yellow"</code> and so on. There's a total of 140 color names you can pick from. See this handy <a target="_blank" href="https://www.w3schools.com/colors/colors_names.asp">color name table</a> for what color names are available.
				</p>
				<p>
					If you want to create a color from its red, green, and blue components directly, you can use the <code>rgb(red: number, green: number, blue: number): string</code> function. E.g. <code>rgb(255, 0, 0)</code> would create the color red. <code>rgb(0, 255, 255)</code> would create the color yellow.
				</p>
				<p>
					You can do more than draw a still image with a canvas program! A computer redraws the screen
					dozens of times per second (usually somewhere between 60 and 120 times, depending on your display). If you want to do animation in your program, you have to draw a new image to the canvas that often as well. Here's an example:
				</p><pre><code>var kittenImage = loadImage("img/kitten.png")
var x = 0
while true do
   clear("white")
   drawImage(kittenImage, x, 100, kittenImage.width / 5, kittenImage.height / 5)
   show()
   x = x + 2
end</code>
</pre>
				<p>
					This program loads a kitten image, and moves it across the screen, from the left to the right by 2 pixels every frame. The <code>show()</code> function displays everything we've drawn so far and waits until the next time we need to redraw the entire canvas.
				</p>
				<p>
					You can also get input from your user via the mouse and keyboard! When the mouse cursor (or a finger on the touch screen) is over the canvas, you can call the <code>getMouseX()</code> and <code>getMouseY()</code> functions to get the <code>(x, y)</code> coordinate of the mouse cursor (or finger) relative to the canvas. Here's a program that draws the kitty at the mouse (or finger) position:
				</p>
<pre><code>var kittenImage = loadImage("img/kitten.png")
while true do
   clear("white")
   drawImage(kittenImage, getMouseX(), getMouseY(), kittenImage.width / 5, kittenImage.height / 5)
   show()
end</code>
</pre>
				<p>
					There are many more functions to get user input, see below!
				</p>
			`,
			entries: [],
			subCategories: [
				{
					name: "Clearing and showing the canvas",
					desc: "These functions let you clear the canvas and show it.",
					entries: [
						{
							anchor: "canvas-clear",
							name: "<code>clear(color: string)</code>",
							desc: "Erases the entire canvas with the <code>color</code>."
						},
						{
							anchor: "canvas-show",
							name: "<code>show()</code>",
							desc: "Displays everything that has been drawn so far on the canvas, then waits until the next time the whole canvas needs to be redrawn."
						}
					],
					subCategories: []
				},
				{
					name: "Drawing shapes",
					desc: "This functions let draw shapes.",
					entries: [
						{
							anchor: "canvas-draw-line",
							name: "<code>drawLine(x1: number, y1: number, x2: number, y2: number, color: string)</code>",
							desc: "Draws a line from <code>(x1, y1)</code> to <code>(x2, y2)</code> with the given <code>color</code>."
						},
						{
							anchor: "canvas-draw-rect",
							name: "<code>drawRectangle(x: number, y: number, width: number, height: number, color: string)</code>",
							desc: "Draws a filled rectangle with the given <code>color</code>. The <code>(x, y)</code> coordinate specifies the position of the top left corner of the rectangle. The <code>width</code> and <code>height</code> specify the size of the rectangle in pixels."
						},
						{
							anchor: "canvas-draw-circle",
							name: "<code>drawCircle(x: number, y: number, radius: number, color: string)</code>",
							desc: "Draws a filled circle with the given <code>color</code>. The <code>(x, y)</code> coordinate specifies the position of the center of the circle. The <code>radius</code> specifies the radius of the circle in pixels."
						},
						{
							anchor: "canvas-draw-ellipse",
							name: "<code>drawEllipse(x: number, y: number, radiusX: number, radiusY: number, color: string)</code>",
							desc: "Draws a filled ellipse with the given <code>color</code>. The <code>(x, y)</code> coordinate specifies the position of the center of the ellipse. The <code>radiusX</code> and <code>radiusY</code> parameters specify the radius of the circle in pixels on the x- and y-axis respectively."
						}
					],
					subCategories: []
				},
				{
					name: "Drawing text",
					desc: "This functions let draw text.",
					entries: [
						{
							anchor: "canvas-draw-text",
							name: "<code>drawText(text: string, x: number, y: number, fontSize: number, fontName: String, color: string)</code>",
							desc: "Draws the text with the given color, size, and font. The <code>(x, y)</code> coordinate specifies the position of the bottom left corner of the text. The <code>fontSize</code> parameter specifies the height of the text in pixels. The <code>fontName</code> specifies the name of the font, e.g. \"Arial\", or \"Helvetica\". See the <a target=\"_blank\" href=\"https://www.w3schools.com/cssref/css_websafe_fonts.asp\">safe web font list</a> for available font names. Note that this function will ignore new lines in the text!"
						}
					],
					subCategories: []
				},
				{
					name: "Colors",
					desc: "These functions let create color strings from red, green, and blue color values.",
					entries: [
						{
							anchor: "canvas-rgb",
							name: "<code>rgb(red: number, green: number, blue: number): string</code>",
							desc: "Returns a string representing the color given by the mixture of <code>red</code>, <code>green</code>, and <code>blue</code>. The color values must be in the range <code>0</code> to <code>255</code>."
						},
						{
							anchor: "canvas-rgba",
							name: "<code>rgba(red: number, green: number, blue: number, alpha: number): string</code>",
							desc: "Returns a string representing the color given by the mixture of <code>red</code>, <code>green</code>, and <code>blue</code>. The color values must be in the range <code>0</code> to <code>255</code>. The <code>alpha</code> parameter specifies the opacity of the color, with <code>0</code> meaning fully transparent, and <code>255</code> meaning fully opaque."
						},
					],
					subCategories: []
				},
				{
					name: "Loading and drawing images",
					desc: "These functions and records let load images from the Web and draw them onto the canvas.",
					entries: [
						{
							anchor: "canvas-load-image",
							name: "<code>loadImage(url: string): image</code>",
							desc: "Loads the image from the given <code>url</code> and returns it as an <code>image</code> record value. If loading the image failed, a dialog will be shown displaying an error."
						},
						{
							anchor: "canvas-draw-image",
							name: "<code>drawImage(image: image, x: number, y: number, width: number, height: number)</code>",
							desc: "Draws the <code>image</code> to the canvas. The <code>(x, y)</code> coordinate specifies the position of the top left corner of the image on the canvas. The <code>width</code> and <code>height</code> specify the size at which the image should be drawn. If the image could not be loaded previously, nothing will be drawn."
						},
						{
							anchor: "canvas-image",
							name: "<code>record image</code>",
							desc: /*html*/`
								<p>
									This record type stores the data for an image loaded via <code>loadImage(url: string): image</code>. It has the following fields:
								</p>
								<ul>
									<li><em>width</em>: the width of the image in pixels.</li>
									<li><em>height</em>: the height of the image in pixels.</li>
									<li><em>url</em>: the url from which the image was loaded.</li>
								</ul>
							`
						}
					],
					subCategories: []
				},
				{
					name: "Mouse and touch input",
					desc: "These functions let check where the mouse cursor or finger is on the canvas.",
					entries: [
						{
							anchor: "canvas-get-mouse-x",
							name: "<code>getMouseX(): number</code>",
							desc: "Returns the x-coordinate of the current mouse cursor or finger location on the canvas."
						},
						{
							anchor: "canvas-get-mouse-y",
							name: "<code>getMouseY(): number</code>",
							desc: "Returns the y-coordinate of the current mouse cursor or finger location on the canvas."
						},
						{
							anchor: "canvas-is-mouse-button-down",
							name: "<code>isMouseButtonDown(): boolean</code>",
							desc: "Returns whether any mouse button is pressed, or at least one finger is touching the canvas."
						},
					],
					subCategories: []
				}
			]
		}
		this.bus.event(new events.AnnounceDocumentation(docs));
	}

	
}