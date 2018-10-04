import {TextMarker} from "../node_modules/@types/codemirror/index";
import {AssetManager, Input, TimeKeeper, InputListener} from "./Utils";
import {CompilerError, compile} from "./Compiler";

export module paperbots {
	export class Editor {
		private canvas: Canvas;
		private codeEditor: CodeEditor;

		constructor(canvasElement: HTMLCanvasElement, editorElement: HTMLElement, outputElement: HTMLElement) {
			this.canvas = new Canvas(canvasElement);
			this.codeEditor = new CodeEditor(editorElement, outputElement);
		}
	}

	export class CodeEditor {
		private editor: CodeMirror.Editor;
		private markers = Array<TextMarker>();

		constructor (private editorElement: HTMLElement, private outputElement: HTMLElement) {
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

			this.editor.on("change", (instance, change) => {
				this.compile();
				window.localStorage.setItem("editor-content", this.editor.getDoc().getValue());
			});

			this.editor.on("gutterClick", function(cm, n) {
				let info = cm.lineInfo(n);
				cm.setGutterMarker(n, "gutter-breakpoints", info.gutterMarkers ? null : this.newBreakpointMarker());
			});

			this.editor.getDoc().setValue(window.localStorage.getItem("editor-content") || "");
			this.compile();
		}

		compile () {
			this.markers.forEach(marker => marker.clear());
			this.markers.length = 0;

			try {
				let result = compile(this.editor.getDoc().getValue());
				this.outputElement.innerHTML = "Success"; // JSON.stringify(result, null, 2);

			} catch (e) {
				let err = (e as CompilerError);
				let loc = err.location;
				let from = {line: loc.start.line - 1, ch: loc.start.column - 1 - (loc.start.line == loc.end.line && loc.start.column == loc.end.column ? 1 : 0)};
				let to = {line: loc.end.line - 1, ch: loc.end.column - 1};
				this.markers.push(this.editor.getDoc().markText(from, to, { className: "compiler-error", title: err.message}));
				this.outputElement.innerHTML = loc.start.line + ":" + loc.start.column + ": " + err.message;
			}
		}

		newBreakpointMarker () {
			let marker = $(`
			<svg height="15" width="15">
				<circle cx="7" cy="7" r="7" stroke-width="1" fill="#cc0000" />
			  </svg>
			`);
			return marker[0];
		}
	}

	export enum RobotAction {
		Forward,
		TurnLeft,
		TurnRight,
		None
	}

	export class Robot {
		static readonly FORWARD_DURATION = 1;
		static readonly TURN_DURATION = 1;
		x = 0;
		y = 15;
		dirX = 1;
		dirY = 0;
		angle = 0;
		action = RobotAction.None;

		actionTime = 0;
		startX = 0;
		startY = 0
		targetX = 0;
		targetY = 0;
		startAngle = 0;
		targetAngle = 0;

		constructor() { }

		turnLeft () {
			this.angle = this.angle - 90;
			let temp = this.dirX;
			this.dirX = -this.dirY;
			this.dirY = temp;
		}

		setAction(world: World, action: RobotAction) {
			if (this.action != RobotAction.None) {
				throw new Error("Can't set action while robot is executing previous action.");
			}
			this.action = action;
			switch (action) {
			case RobotAction.Forward:
				this.startX = this.x;
				this.startY = this.y;
				this.targetX = this.x + this.dirX;
				this.targetY = this.y + this.dirY;
				console.log(this.targetX + ", " + this.targetY);
				if (world.getTile(this.targetX, this.targetY).kind == "wall") {
					this.targetX = this.startX;
					this.targetY = this.startY;
				}
				break;
			case RobotAction.TurnLeft: {
				this.startAngle = this.angle;
				this.targetAngle = this.angle - 90;
				let temp = this.dirX;
				this.dirX = -this.dirY;
				this.dirY = temp;
				console.log(this.targetAngle);
				break;
			}
			case RobotAction.TurnRight: {
				this.startAngle = this.angle;
				this.targetAngle = this.angle + 90;
				let temp = this.dirX;
				this.dirX = this.dirY;
				this.dirY = -temp;
				console.log(this.targetAngle);
				break;
			}
			}
			this.actionTime = 0
		}

		update (delta: number): boolean {
			this.actionTime += delta;
			switch (this.action) {
				case RobotAction.Forward: {
					let percentage = this.actionTime / Robot.FORWARD_DURATION;
					if (percentage >= 1) {
						this.action = RobotAction.None;
						this.x = this.targetX;
						this.y = this.targetY;
					} else {
						this.x = this.startX + (this.targetX - this.startX) * percentage;
						this.y = this.startY + (this.targetY - this.startY) * percentage;
					}
					break;
				}
				case RobotAction.TurnLeft:
				case RobotAction.TurnRight: {
					let percentage = this.actionTime / Robot.TURN_DURATION;
					if (percentage >= 1) {
						this.action = RobotAction.None;
						this.angle = this.targetAngle;
					} else {
						this.angle = this.startAngle + (this.targetAngle - this.startAngle) * percentage;
					}
					break;
				}
			}
			return this.action == RobotAction.None;
		}
	}

	function assertNever(x: never): never {
		throw new Error("Unexpected object: " + x);
	}

	export interface Wall { kind: "wall" }
	export interface NumberTile { kind: "number"; value: number }
	export interface LetterTile { kind: "letter"; value: string }
	export type WorldObject = Wall | NumberTile | LetterTile;

	export class World {
		static WORLD_SIZE = 16;
		tiles = Array<WorldObject>(16 * 16);
		robot = new Robot();

		constructor () {
			for (var i = 0; i < 10; i++) {
				this.setTile(i, 2, World.newWall());
			}
			this.setTile(1, 0, World.newWall());
			this.setTile(2, 2, World.newNumber(12));

			let hello = "Hello world.";
			for (var i = 0; i < hello.length; i++) {
				this.setTile(4 + i, 4, World.newLetter(hello.charAt(i)));
			}
		}

		getTile (x: number, y: number): WorldObject {
			x = x | 0;
			y = y | 0;
			if (x < 0 || x >= World.WORLD_SIZE) return World.newWall();
			if (y < 0 || y >= World.WORLD_SIZE) return World.newWall();
			return this.tiles[x + y * World.WORLD_SIZE];
		}

		setTile (x: number, y: number, tile: WorldObject) {
			x = x | 0;
			y = y | 0;
			if (x < 0 || x >= World.WORLD_SIZE) return;
			if (y < 0 || y >= World.WORLD_SIZE) return;
			this.tiles[x + y * World.WORLD_SIZE] = tile;
		}

		update (delta: number) {
			this.robot.update(delta);
		}

		static newWall(): Wall { return {kind: "wall"}; }
		static newNumber(value: number): NumberTile { return {kind: "number", value: value}; }
		static newLetter(value: string): LetterTile { return {kind: "letter", value: value}; }
	}

	export class Canvas {
		private container: JQuery<HTMLElement>;
		private canvas: HTMLCanvasElement;
		private world = new World();
		private ctx: CanvasRenderingContext2D;
		private assets = new AssetManager();
		private selectedTool = "Robot";
		private input: Input;
		private lastWidth = 0;
		private cellSize = 0;
		private drawingSize = 0;
		private time = new TimeKeeper();
		private toolsHandler: InputListener;

		constructor(canvasContainer: HTMLElement) {
			this.container = $(canvasContainer);
			this.canvas = this.container.find("#pb-canvas")[0] as HTMLCanvasElement;
			this.ctx = this.canvas.getContext("2d");
			this.assets.loadImage("img/wall.png");
			this.assets.loadImage("img/floor.png");
			this.assets.loadImage("img/robot.png");
			requestAnimationFrame(() => { this.draw(); });

			let tools = this.container.find("#pb-canvas-tools input");
			for (var i = 0; i < tools.length; i++) {
				$(tools[i]).click((tool) => {
					let value = (tool.target as HTMLInputElement).value;
					tools.removeClass("selected");
					$(tool.target).addClass("selected");
					this.selectedTool = value;
				});
			}

			this.input = new Input(this.canvas);
			this.toolsHandler = {
				down: (x, y) => {
					let cellSize = this.cellSize;
					x = ((x / cellSize) | 0) - 1;
					y = ((this.drawingSize - y) / cellSize) | 0;

					if (this.selectedTool == "Wall") {
						this.world.setTile(x, y, World.newWall());
					} else if (this.selectedTool == "Floor") {
						this.world.setTile(x, y, null);
					}
				},
				up: (x, y) => {
					let cellSize = this.cellSize;
					x = ((x / cellSize) | 0) - 1;
					y = ((this.drawingSize - y) / cellSize) | 0;

					if (this.selectedTool == "Wall") {
						this.world.setTile(x, y, World.newWall());
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
						this.world.setTile(x, y, World.newNumber(number));
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
						this.world.setTile(x, y, World.newLetter(letter));
					} else if (this.selectedTool == "Robot") {
						if (this.world.robot.x != x || this.world.robot.y != y) {
							this.world.robot.x = Math.max(0, Math.min(World.WORLD_SIZE - 1, x));
							this.world.robot.y = Math.max(0, Math.min(World.WORLD_SIZE - 1, y));
						} else {
							this.world.robot.turnLeft();
						}
					}
				},
				moved: (x, y) => {
					let cellSize = this.cellSize;
					x = ((x / cellSize) | 0) - 1;
					y = ((this.drawingSize - y) / cellSize) | 0;
				},
				dragged: (x, y) => {
					let cellSize = this.cellSize;
					x = ((x / cellSize) | 0) - 1;
					y = ((this.drawingSize - y) / cellSize) | 0;

					if (this.selectedTool == "Wall") {
						this.world.setTile(x, y, World.newWall());
					} else if (this.selectedTool == "Floor") {
						this.world.setTile(x, y, null);
					} else if (this.selectedTool == "Robot") {
						this.world.robot.x = Math.max(0, Math.min(World.WORLD_SIZE - 1, x));
						this.world.robot.y = Math.max(0, Math.min(World.WORLD_SIZE - 1, y));
					}
				}
			};

			this.setToolsActive(true);
		}

		setToolsActive(active: boolean) {
			if (active) {
				this.input.addListener(this.toolsHandler);
				this.container.find("#pb-canvas-tools input").removeAttr("disabled");
			} else {
				this.input.removeListener(this.toolsHandler);
				this.container.find("#pb-canvas-tools input").attr("disabled", "true");
			}
		}

		setWorld(world: World) {
			this.world = world;
		}

		getWorld (): World {
			return this.world;
		}

		draw () {
			requestAnimationFrame(() => { this.draw(); });
			this.time.update();
			this.world.update(this.time.delta);

			let ctx = this.ctx;
			let canvas = this.canvas;
			if (this.lastWidth != canvas.clientWidth) {
				canvas.width = canvas.clientWidth;
				canvas.height = canvas.clientWidth;
				this.lastWidth = canvas.width;
				this.cellSize = canvas.width / (World.WORLD_SIZE + 1);
				this.drawingSize = this.cellSize * World.WORLD_SIZE;
			}

			ctx.fillStyle = "#eeeeee";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			this.drawGrid();
			if (!this.assets.hasMoreToLoad()) {
				this.drawWorld();
			}
		}

		drawImage (img: HTMLImageElement, x: number, y: number, w: number, h: number) {
			this.ctx.drawImage(img, x, this.drawingSize - y - h, w, h);
		}
		drawRotatedImage (img: HTMLImageElement, x: number, y: number, w: number, h: number, angle: number) {
			this.ctx.save();
			this.ctx.translate(x + w / 2, this.drawingSize - y - h + h / 2);
			this.ctx.rotate(Math.PI / 180 * angle);
			this.ctx.drawImage(img, -w/2, -h/2, w, h);
			this.ctx.restore();
		}

		drawText(text: string, x: number, y: number, color = "#000000") {
			let ctx = this.ctx;
			ctx.fillStyle = color;
			ctx.font = this.cellSize * 0.5 + "pt monospace";
			let metrics = ctx.measureText(text);
			ctx.fillText(text, x + this.cellSize / 2 - metrics.width / 2, this.drawingSize - y - this.cellSize / 4);
		}

		drawWorld () {
			let ctx = this.ctx;
			let canvas = this.canvas;
			let cellSize = this.cellSize;
			let drawingSize = this.drawingSize;

			ctx.save();
			ctx.translate(this.cellSize, 0);

			for (var y = 0; y < drawingSize; y += cellSize) {
					for (var x = 0; x < drawingSize; x += cellSize) {
					var img = null;
					let wx = (x / cellSize);
					let wy = (y / cellSize);
					let obj = this.world.getTile(wx, wy);
					if (!obj) continue;

					switch(obj.kind) {
						case "wall":
							img = this.assets.getImage("img/wall.png");
							break;
						case "number":
							this.drawText("" + obj.value, x, y);
							break;
						case "letter":
							this.drawText("" + obj.value, x, y);
							break;
						default: assertNever(obj);
					}

					if (img) this.drawRotatedImage(img, x, y, cellSize, cellSize, 0);
				}
			}

			let robot = this.world.robot;
			this.drawRotatedImage(this.assets.getImage("img/robot.png"), robot.x * cellSize + cellSize * 0.05, robot.y * cellSize + cellSize * 0.05, cellSize * 0.9, cellSize * 0.9, robot.angle);
			ctx.beginPath();
			ctx.strokeStyle = "#ff0000";
			ctx.moveTo((robot.x + 0.5) * cellSize, drawingSize - (robot.y + 0.5) * cellSize);
			ctx.lineTo((robot.x + 0.5 + robot.dirX) * cellSize, drawingSize - (robot.y + robot.dirY + 0.5) * cellSize);
			ctx.stroke();
			ctx.restore();
		}

		drawGrid () {
			let ctx = this.ctx;
			let canvas = this.canvas;

			for (var y = 0; y < World.WORLD_SIZE; y++) {
				this.drawText("" + y, 0, y * this.cellSize, "#aaaaaa");
			}

			for (var x = 0; x < World.WORLD_SIZE; x++) {
				this.drawText("" + x, x * this.cellSize + this.cellSize, -this.cellSize, "#aaaaaa");
			}

			ctx.save();
			ctx.translate(this.cellSize, 0);
			ctx.strokeStyle = "#7f7f7f";
			ctx.beginPath();
			ctx.setLineDash([2, 2]);
			for (var y = 0; y <= World.WORLD_SIZE; y++) {
				ctx.moveTo(0, y * this.cellSize);
				ctx.lineTo(this.drawingSize, y * this.cellSize);
			}
			for (var x = 0; x <= World.WORLD_SIZE; x++) {
				ctx.moveTo(x * this.cellSize, 0);
				ctx.lineTo(x * this.cellSize, this.drawingSize);
			}
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.restore()
		}
	}
}