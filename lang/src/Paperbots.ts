import {SyntaxError, parse} from "./Parser";
import {TextMarker} from "../node_modules/@types/codemirror/index";
import {Input} from "./Input";

export module paperbots {
	export class Compiler {
		parse(input: string) {
			return parse(input);
		}
	}

	export class Editor {
		private editor: CodeMirror.Editor;
		private canvas: Canvas;
		private compiler: Compiler;

		constructor(canvasElement: HTMLCanvasElement, private editorElement: HTMLElement, private compilerOutput: HTMLElement) {
			this.compiler = new Compiler();
			this.canvas = new Canvas(canvasElement);
			this.editor = CodeMirror(editorElement, {
				tabSize: 3,
				indentUnit: 3,
				indentWithTabs: true,
				lineNumbers: true,
				gutters: ["gutter-breakpoints", "CodeMirror-linenumbers"],
				fixedGutter: true,
				extraKeys: {
					"Tab": "indentAuto"
				}
			});
			this.editor.getDoc().setValue(window.localStorage.getItem("editor-content") || "");

			var markers = Array<TextMarker>();
			var compile = () => {
				try {
					let result = this.compiler.parse(this.editor.getDoc().getValue());
					compilerOutput.innerHTML = JSON.stringify(result, null, 2);
					markers.forEach(marker => marker.clear());
					markers.length = 0;
				} catch (e) {
					markers.forEach(marker => marker.clear());
					markers.length = 0;
					let err = (e as SyntaxError);
					let loc = err.location;
					let from = {line: loc.start.line - 1, ch: loc.start.column - 1 - (loc.start.line == loc.end.line && loc.start.column == loc.end.column ? 1 : 0)};
					let to = {line: loc.end.line - 1, ch: loc.end.column - 1};
					markers.push(this.editor.getDoc().markText(from, to, { className: "compiler-error", title: err.message}));
					compilerOutput.innerHTML = loc.start.line + ":" + loc.start.column + ": " + err.message;
				}
			}

			this.editor.on("change", (instance, change) => {
				compile();
				window.localStorage.setItem("editor-content", this.editor.getDoc().getValue());
			});

			this.editor.on("gutterClick", function(cm, n) {
				let info = cm.lineInfo(n);
				cm.setGutterMarker(n, "gutter-breakpoints", info.gutterMarkers ? null : makeMarker());
			});

			function makeMarker() {
				let marker = $(`
				<svg height="15" width="15">
					<circle cx="7" cy="7" r="7" stroke-width="1" fill="#cc0000" />
			  	</svg>
				`);
				return marker[0];
			}

			compile();
		}
	}

	interface ImageAsset {
		image: HTMLImageElement;
		url: string;
	}

	class AssetManager {
		private toLoad = new Array<ImageAsset>();
		private loaded = {};
		private error = {};

		loadImage(url: string) {
			var img = new Image();
			var asset: ImageAsset = { image: img, url: url };
			this.toLoad.push(asset);
			img.onload = () => {
				this.loaded[asset.url] = asset;
				let idx = this.toLoad.indexOf(asset);
				if (idx >= 0) this.toLoad.splice(idx, 1);
				console.log("Loaded image " + url);
			}
			img.onerror = () => {
				this.loaded[asset.url] = asset;
				let idx = this.toLoad.indexOf(asset);
				if (idx >= 0) this.toLoad.splice(idx, 1);
				console.log("Couldn't load image " + url);
			}
			img.src = url;
		}

		getImage(url: string): HTMLImageElement {
			return (this.loaded[url] as ImageAsset).image;
		}

		hasMoreToLoad() {
			return this.toLoad.length;
		}
	}


	export class Wall { }
	export class NumberTile { constructor (public readonly value: number) { } }
	export class LetterTile { constructor (public readonly value: string) { } }
	export type WorldObject = Wall | NumberTile | LetterTile;
	export class Robot {
		x = 0;
		y = 0;
		angle = 0;
	}

	export class World {
		static WORLD_SIZE = 16;
		tiles = Array<WorldObject>(16 * 16);
		robot = new Robot();

		constructor () {
			for (var i = 0; i < 10; i++) {
				this.setTile(i, 2, new Wall());
			}
			this.setTile(2, 2, new NumberTile(12));

			let hello = "Hello world.";
			for (var i = 0; i < hello.length; i++) {
				this.setTile(4 + i, 4, new LetterTile(hello.charAt(i)));
			}
		}

		getTile (x: number, y: number): WorldObject {
			if (x < 0 || x > World.WORLD_SIZE) return null;
			if (y < 0 || y > World.WORLD_SIZE) return null;
			return this.tiles[x + y * World.WORLD_SIZE];
		}

		setTile (x: number, y: number, tile: WorldObject) {
			if (x < 0 || x > World.WORLD_SIZE) return;
			if (y < 0 || y > World.WORLD_SIZE) return;
			this.tiles[x + y * World.WORLD_SIZE] = tile;
		}
	}

	class Canvas {
		private canvas: HTMLCanvasElement;
		private world = new World();
		private ctx: CanvasRenderingContext2D;
		private assets = new AssetManager();
		private selectedTool = "Floor";
		private input: Input;
		private lastWidth = 0;

		constructor(private canvasContainer: HTMLElement) {
			let container = $(canvasContainer);
			this.canvas = container.find("#pb-canvas")[0] as HTMLCanvasElement;
			this.ctx = this.canvas.getContext("2d");
			this.assets.loadImage("img/wall.png");
			this.assets.loadImage("img/floor.png");
			this.assets.loadImage("img/robot.png");
			requestAnimationFrame(() => { this.draw(); });

			let tools = container.find("#pb-canvas-tools input");
			for (var i = 0; i < tools.length; i++) {
				$(tools[i]).click((tool) => {
					tools.removeClass("selected");
					$(tool.target).addClass("selected");
					this.selectedTool = (tool.target as HTMLInputElement).value;
				});
			}

			this.input = new Input(this.canvas);
			this.input.addListener({
				down: (x, y) => {
					let cellSize = this.canvas.width / World.WORLD_SIZE;
					x = x / cellSize | 0;
					y = (this.canvas.height - y) / cellSize | 0;
					if (this.selectedTool == "Wall") {
						this.world.setTile(x, y, new Wall());
					} else if (this.selectedTool == "Floor") {
						this.world.setTile(x, y, null);
					}
				},
				up: (x, y) => {
					let cellSize = this.canvas.width / World.WORLD_SIZE;
					x = x / cellSize | 0;
					y = (this.canvas.height - y) / cellSize | 0;
					if (this.selectedTool == "Wall") {
						this.world.setTile(x, y, new Wall());
					} else if (this.selectedTool == "Floor") {
						this.world.setTile(x, y, null);
					} else if (this.selectedTool == "Number") {
						var number = null;
						while (number == null) {
							number = prompt("Please enter a number between 0-99.", "0");
							if (!number) return;
							try {
								number = parseInt(number, 10);
								if (number < 0 || number > 99) {
									alert("The number must be between 0-99.");
									number = null;
								}
							} catch (e) {
								alert("The number must be between 0-99.");
								number = null;
							}
						}
						this.world.setTile(x, y, new NumberTile(number));
					} else if (this.selectedTool == "Letter") {
						var letter = null;
						while (letter == null) {
							letter = prompt("Please enter a letter", "a");
							if (!letter) return;

							letter = letter.trim();
							if (letter.length != 1) {
								alert("Only a single letter is allowed.");
								letter = null;
							}
						}
						this.world.setTile(x, y, new LetterTile(letter));
					}
				},
				moved: (x, y) => {
					let cellSize = this.canvas.width / World.WORLD_SIZE;
					x = x / cellSize | 0;
					y = (this.canvas.height - y) / cellSize | 0;
				},
				dragged: (x, y) => {
					let cellSize = this.canvas.width / World.WORLD_SIZE;
					x = x / cellSize | 0;
					y = (this.canvas.height - y) / cellSize | 0;
					if (this.selectedTool == "Wall") {
						this.world.setTile(x, y, new Wall());
					} else if (this.selectedTool == "Floor") {
						this.world.setTile(x, y, null);
					}
				}
			});
		}

		setWorld(world: World) {
			this.world = world;
		}

		getWorld (): World {
			return this.world;
		}

		draw () {
			requestAnimationFrame(() => { this.draw(); });

			let ctx = this.ctx;
			let canvas = this.canvas;
			if (this.lastWidth != canvas.clientWidth) {
				canvas.width = canvas.clientWidth;
				canvas.height = canvas.clientWidth;
				this.lastWidth = canvas.width;
			}

			ctx.fillStyle = "#eeeeee";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			if (!this.assets.hasMoreToLoad()) {
				this.drawWorld();
			} else {
				this.drawGrid();
			}
		}

		drawImage (img: HTMLImageElement, x: number, y: number, w: number, h: number) {
			this.ctx.drawImage(img, x, this.canvas.height - y - h, w, h);
		}
		drawRotatedImage (img: HTMLImageElement, x: number, y: number, w: number, h: number, angle: number) {
			this.ctx.save();
			this.ctx.translate(x + w / 2, this.canvas.height - y - h + h / 2);
			this.ctx.rotate(Math.PI / 180 * angle);
			this.ctx.drawImage(img, -w/2, -h/2, w, h);
			this.ctx.restore();
		}

		drawText(text: string, x: number, y: number) {
			let ctx = this.ctx;
			let cellSize = this.canvas.width / World.WORLD_SIZE;
			ctx.fillStyle = "#000000";
			ctx.font = cellSize * 0.5 + "pt Arial";
			let metrics = ctx.measureText(text);
			ctx.fillText(text, x + cellSize / 2 - metrics.width / 2, this.canvas.height - y - cellSize / 4);
		}

		drawWorld () {
			let ctx = this.ctx;
			let canvas = this.canvas;
			let cellSize = canvas.width / World.WORLD_SIZE;

			this.drawGrid();

			for (var y = 0; y < canvas.height; y += cellSize) {
					for (var x = 0; x < canvas.width; x += cellSize) {
					var img = null;
					let wx = (x / cellSize) | 0;
					let wy = (y / cellSize) | 0;
					let obj = this.world.getTile(wx, wy);
					if (obj instanceof Wall) {
						img = this.assets.getImage("img/wall.png");
					} else if (obj instanceof NumberTile) {
						this.drawText("" + obj.value, x, y);
					} else if (obj instanceof LetterTile) {
						this.drawText("" + obj.value, x, y);
					}

					if (img) this.drawRotatedImage(img, x, y, cellSize, cellSize, 0);
				}
			}

			let robot = this.world.robot;
			this.drawRotatedImage(this.assets.getImage("img/robot.png"), robot.x * cellSize, robot.y * cellSize, cellSize, cellSize, robot.angle);
		}

		drawGrid () {
			let ctx = this.ctx;
			let canvas = this.canvas;

			ctx.strokeStyle = "#7f7f7f";
			let cell_size = canvas.width / World.WORLD_SIZE;
			ctx.beginPath();
			ctx.setLineDash([2, 2]);
			for (var y = 0; y < canvas.height; y += cell_size) {
				ctx.moveTo(0, y);
				ctx.lineTo(canvas.width, y);
			}
			for (var x = 0; x < canvas.width; x += cell_size) {
				ctx.moveTo(x, 0);
				ctx.lineTo(x, canvas.height);
			}
			ctx.stroke();
		}
	}
}