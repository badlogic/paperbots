import {TextMarker} from "../node_modules/@types/codemirror/index";
import {AssetManager, Input, TimeKeeper, InputListener} from "./Utils";
import * as compiler from "./Compiler";

export namespace paperbots {
	export enum EditorMode {
		Editing,
		Running
	}

	export class Paperbots {
		private canvas: Canvas;
		private codeEditor: CodeEditor;
		private debugger: Debugger;
		private mode = EditorMode.Editing;

		constructor(canvasElement: HTMLCanvasElement, editorElement: HTMLElement, outputElement: HTMLElement, debuggerElement: HTMLElement) {
			this.canvas = new Canvas(this, canvasElement);
			this.codeEditor = new CodeEditor(this, editorElement, outputElement);
			this.debugger = new Debugger(this, this.codeEditor, debuggerElement);
			this.setMode(EditorMode.Editing);
		}

		setMode(mode: EditorMode) {
			this.mode = mode;
			this.canvas.setMode(mode);
			this.codeEditor.setMode(mode);
		}

		getMode (): EditorMode {
			return this.mode;
		}
	}

	export class Debugger {
		vm?: compiler.VirtualMachine;

		constructor(private paperbots: Paperbots, editor: CodeEditor, debuggerElement: HTMLElement) {
			$("#pb-debug-run").click(() => {
				let module = editor.compile();
				let vm = this.vm = new compiler.VirtualMachine(module.code);
				$("#pb-debugger-callstack")[0].innerHTML = "";
			});

			$("#pb-debug-step").click(() => {
				if (this.vm.frames.length > 0) {
					let frame = this.vm.frames[this.vm.frames.length - 1];
					$("#pb-debugger-callstack")[0].innerHTML = JSON.stringify(frame.code.code[frame.pc]);
				}
				this.vm.run(1);
				var output = "";
				this.vm.frames.slice(0).reverse().forEach(frame => {
					output += frame.code.index == 0 ? "$main()" : compiler.functionSignature(frame.code.ast as compiler.FunctionDecl);
					output += "<br>"
					frame.slots.forEach(slot => {
						output += slot.symbol.name.value + ": " + slot.value + "<br>";
					});
				});
				output += $("#pb-debugger-callstack")[0].innerHTML;
				$("#pb-debugger-callstack")[0].innerHTML = output;

				$("#pb-debugger-valuestack")[0].innerHTML = JSON.stringify(this.vm.stack);
			});
		}
	}

	export class CodeEditor {
		private editor: CodeMirror.Editor;
		private markers = Array<TextMarker>();

		constructor (private paperbots: Paperbots, private editorElement: HTMLElement, private outputElement: HTMLElement) {
			this.editor = CodeMirror(editorElement, {
				tabSize: 3,
				indentUnit: 3,
				indentWithTabs: true,
				styleActiveLine: true,
				styleActiveSelected: true,
				lineNumbers: true,
				gutters: ["gutter-breakpoints", "CodeMirror-linenumbers"],
				fixedGutter: true,
				extraKeys: {
					// "Tab": "indentAuto"
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

			$("#pb-run").click(function () {
				paperbots.setMode(EditorMode.Running);
			});
			$("#pb-stop").click(function () {
				paperbots.setMode(EditorMode.Editing);
			});

			this.editor.getDoc().setValue(window.localStorage.getItem("editor-content") || "");
			this.compile();
		}

		compile () {
			this.markers.forEach(marker => marker.clear());
			this.markers.length = 0;

			try {
				let result = compiler.compile(this.editor.getDoc().getValue());
				this.outputElement.innerHTML = compiler.moduleToJson(result);
				return result;
			} catch (e) {
				if (e["location"]) {
					let err = (e as compiler.CompilerError);
					let loc = err.location;
					let from = {line: loc.start.line - 1, ch: loc.start.column - 1 - (loc.start.line == loc.end.line && loc.start.column == loc.end.column ? 1 : 0)};
					let to = {line: loc.end.line - 1, ch: loc.end.column - 1};
					this.markers.push(this.editor.getDoc().markText(from, to, { className: "compiler-error", title: err.message}));
					this.outputElement.innerHTML = loc.start.line + ":" + loc.start.column + ": " + err.message;
				} else {
					let err = e as Error;
					this.outputElement.innerHTML = err.message + (err.stack ? err.stack : "");
				}
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

		setMode(mode: EditorMode) {
			if (mode == EditorMode.Editing) {
				this.editor.setOption("readOnly", false);
				$("#pb-editor-tools-editing").show();
				$("#pb-editor-tools-running").hide();
			} else {
				this.editor.setOption("readOnly", true);
				$("#pb-editor-tools-editing").hide();
				$("#pb-editor-tools-running").show();
			}
		}
	}

	export enum RobotAction {
		Forward,
		TurnLeft,
		TurnRight,
		None
	}

	export class RobotData {
		constructor(
		public x = 0,
		public y = 15,
		public dirX = 1,
		public dirY = 0,
		public angle = 0) {}
	}

	export class Robot {
		static readonly FORWARD_DURATION = 0.25;
		static readonly TURN_DURATION = 0.25;

		action = RobotAction.None;
		actionTime = 0;
		startX = 0;
		startY = 0
		targetX = 0;
		targetY = 0;
		startAngle = 0;
		targetAngle = 0;

		constructor(public data: RobotData) { }

		turnLeft () {
			this.data.angle = this.data.angle - 90;
			let temp = this.data.dirX;
			this.data.dirX = -this.data.dirY;
			this.data.dirY = temp;
		}

		setAction(world: World, action: RobotAction) {
			if (this.action != RobotAction.None) {
				throw new Error("Can't set action while robot is executing previous action.");
			}
			this.action = action;
			switch (action) {
			case RobotAction.Forward:
				this.startX = this.data.x;
				this.startY = this.data.y;
				this.targetX = this.data.x + this.data.dirX;
				this.targetY = this.data.y + this.data.dirY;
				console.log(this.targetX + ", " + this.targetY);
				let tile = world.getTile(this.targetX, this.targetY);
				if (tile && tile.kind == "wall") {
					this.targetX = this.startX;
					this.targetY = this.startY;
				}
				break;
			case RobotAction.TurnLeft: {
				this.startAngle = this.data.angle;
				this.targetAngle = this.data.angle - 90;
				let temp = this.data.dirX;
				this.data.dirX = -this.data.dirY;
				this.data.dirY = temp;
				console.log(this.targetAngle);
				break;
			}
			case RobotAction.TurnRight: {
				this.startAngle = this.data.angle;
				this.targetAngle = this.data.angle + 90;
				let temp = this.data.dirX;
				this.data.dirX = this.data.dirY;
				this.data.dirY = -temp;
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
						this.data.x = this.targetX;
						this.data.y = this.targetY;
					} else {
						this.data.x = this.startX + (this.targetX - this.startX) * percentage;
						this.data.y = this.startY + (this.targetY - this.startY) * percentage;
					}
					break;
				}
				case RobotAction.TurnLeft:
				case RobotAction.TurnRight: {
					let percentage = this.actionTime / Robot.TURN_DURATION;
					if (percentage >= 1) {
						this.action = RobotAction.None;
						this.data.angle = this.targetAngle;
					} else {
						this.data.angle = this.startAngle + (this.targetAngle - this.startAngle) * percentage;
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

	export class WorldData {
		constructor (public tiles = Array<WorldObject>(16 * 16), public robot = new RobotData()) {}
	}

	export class World {
		static WORLD_SIZE = 16;
		data: WorldData;
		robot: Robot;

		constructor (data: WorldData) {
			this.data = data;
			this.robot = new Robot(data.robot);
		}

		getTile (x: number, y: number): WorldObject {
			x = x | 0;
			y = y | 0;
			if (x < 0 || x >= World.WORLD_SIZE) return World.newWall();
			if (y < 0 || y >= World.WORLD_SIZE) return World.newWall();
			return this.data.tiles[x + y * World.WORLD_SIZE];
		}

		setTile (x: number, y: number, tile: WorldObject) {
			x = x | 0;
			y = y | 0;
			if (x < 0 || x >= World.WORLD_SIZE) return;
			if (y < 0 || y >= World.WORLD_SIZE) return;
			this.data.tiles[x + y * World.WORLD_SIZE] = tile;
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
		private world: World;
		private worldData; WorldData;
		private ctx: CanvasRenderingContext2D;
		private assets = new AssetManager();
		private selectedTool = "Robot";
		private input: Input;
		private lastWidth = 0;
		private cellSize = 0;
		private drawingSize = 0;
		private time = new TimeKeeper();
		private toolsHandler: InputListener;

		constructor(private paperbots: Paperbots, canvasContainer: HTMLElement) {
			this.container = $(canvasContainer);
			this.canvas = this.container.find("#pb-canvas")[0] as HTMLCanvasElement;
			this.ctx = this.canvas.getContext("2d");
			this.assets.loadImage("img/wall.png");
			this.assets.loadImage("img/floor.png");
			this.assets.loadImage("img/robot.png");
			requestAnimationFrame(() => { this.draw(); });

			let worldJson = window.localStorage.getItem("world-content");
			if (worldJson) {
				this.worldData = JSON.parse(worldJson);
			} else {
				this.worldData = new WorldData();
			}

			let tools = this.container.find("#pb-canvas-tools-editing input");
			for (var i = 0; i < tools.length; i++) {
				$(tools[i]).click((tool) => {
					let value = (tool.target as HTMLInputElement).value;
					tools.removeClass("selected");
					$(tool.target).addClass("selected");
					this.selectedTool = value;
				});
			}

			let functions = this.container.find("#pb-canvas-tools-running input");
			for (var i = 0; i < functions.length; i++) {
				$(functions[i]).click((fun) => {
					let value = (fun.target as HTMLInputElement).value;
					if (value == "forward()") {
						this.world.robot.setAction(this.world, RobotAction.Forward);
						this.container.find("#pb-canvas-tools-running input").prop("disabled", true);
					}
					if (value == "turnLeft()") {
						this.world.robot.setAction(this.world, RobotAction.TurnLeft);
						this.container.find("#pb-canvas-tools-running input").prop("disabled", true);
					}
					if (value == "turnRight()") {
						this.world.robot.setAction(this.world, RobotAction.TurnRight);
						this.container.find("#pb-canvas-tools-running input").prop("disabled", true);
					}
					if (value == "print()") {
						var number = null;
						while (number == null) {
							number = prompt("Please enter a number between 0-99.", "0");
							if (!number) return;
							try {
								number = parseInt(number, 10);
								if (number < 0 || number > 99 || isNaN(number)) {
									alert("The number must be between 0-99.");
									number = null;
								}
							} catch (e) {
								alert("The number must be between 0-99.");
								number = null;
							}
						}
						let x = this.world.robot.data.x + this.world.robot.data.dirX;
						let y = this.world.robot.data.y + this.world.robot.data.dirY;
						let tile = this.world.getTile(x, y);
						if (!tile || tile.kind != "wall") {
							this.world.setTile(x, y, World.newNumber(number));
						}
					}
					if (value == "scan()") {
						let x = this.world.robot.data.x + this.world.robot.data.dirX;
						let y = this.world.robot.data.y + this.world.robot.data.dirY;
						let tile = this.world.getTile(x, y);
						if (!tile || tile.kind != "number") {
							alert("There is no number on the cell in front of the robot.\n\nAssume value of 0.")
						} else {
							alert("Number in cell in front of the robot: " + tile.value)
						}
					}
				});
			}

			this.input = new Input(this.canvas);
			this.toolsHandler = {
				down: (x, y) => {
					let cellSize = this.canvas.clientWidth / (World.WORLD_SIZE + 1);
					x = ((x / cellSize) | 0) - 1;
					y = (((this.canvas.clientHeight - y) / cellSize) | 0) - 1;

					if (this.selectedTool == "Wall") {
						this.world.setTile(x, y, World.newWall());
					} else if (this.selectedTool == "Floor") {
						this.world.setTile(x, y, null);
					}
					window.localStorage.setItem("world-content", JSON.stringify(this.world.data));
				},
				up: (x, y) => {
					let cellSize = this.canvas.clientWidth / (World.WORLD_SIZE + 1);
					x = ((x / cellSize) | 0) - 1;
					y = (((this.canvas.clientHeight - y) / cellSize) | 0) - 1;

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
								if (number < 0 || number > 99 || isNaN(number)) {
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
						if (this.world.robot.data.x != x || this.world.robot.data.y != y) {
							this.world.robot.data.x = Math.max(0, Math.min(World.WORLD_SIZE - 1, x));
							this.world.robot.data.y = Math.max(0, Math.min(World.WORLD_SIZE - 1, y));
						} else {
							this.world.robot.turnLeft();
						}
					}
					window.localStorage.setItem("world-content", JSON.stringify(this.world.data));
				},
				moved: (x, y) => {
				},
				dragged: (x, y) => {
					let cellSize = this.canvas.clientWidth / (World.WORLD_SIZE + 1);
					x = ((x / cellSize) | 0) - 1;
					y = (((this.canvas.clientHeight - y) / cellSize) | 0) - 1;

					if (this.selectedTool == "Wall") {
						this.world.setTile(x, y, World.newWall());
					} else if (this.selectedTool == "Floor") {
						this.world.setTile(x, y, null);
					} else if (this.selectedTool == "Robot") {
						this.world.robot.data.x = Math.max(0, Math.min(World.WORLD_SIZE - 1, x));
						this.world.robot.data.y = Math.max(0, Math.min(World.WORLD_SIZE - 1, y));
					}
					window.localStorage.setItem("world-content", JSON.stringify(this.world.data));
				}
			};
		}

		setMode(mode: EditorMode) {
			if (mode == EditorMode.Editing) {
				this.input.addListener(this.toolsHandler);
				$("#pb-canvas-tools-editing").show();
				$("#pb-canvas-tools-running").hide();
				this.world = new World(this.worldData);
			} else {
				this.input.removeListener(this.toolsHandler);
				$("#pb-canvas-tools-editing").hide();
				$("#pb-canvas-tools-running").show();
				this.worldData = JSON.parse(JSON.stringify(this.world.data));
				this.container.find("#pb-canvas-tools-running input").prop("disabled", false);
			}
		}

		setWorld(world: World) {
			this.world = world;
		}

		getWorld (): World {
			return this.world;
		}

		resize () {
			let canvas = this.canvas;
			let realToCSSPixels = window.devicePixelRatio;
			let displayWidth  = Math.floor(canvas.clientWidth  * realToCSSPixels);

			if (canvas.width  !== displayWidth) {
				canvas.width  = displayWidth;
				canvas.height  = displayWidth;
			}
			this.cellSize = canvas.width / (World.WORLD_SIZE + 1);
			this.drawingSize = this.cellSize * World.WORLD_SIZE;
		}

		draw () {
			requestAnimationFrame(() => { this.draw(); });
			this.time.update();

			if (this.paperbots.getMode() == EditorMode.Running) {
				this.world.update(this.time.delta);
				if (this.world.robot.action == RobotAction.None) {
					this.container.find("#pb-canvas-tools-running input").prop("disabled", false);
				}
			}

			let ctx = this.ctx;
			let canvas = this.canvas;
			this.resize();


			ctx.fillStyle = "#eeeeee";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			this.drawGrid();
			if (!this.assets.hasMoreToLoad()) {
				this.drawWorld();
			}
		}

		drawImage (img: HTMLImageElement, x: number, y: number, w: number, h: number) {
			x |= 0;
			y |= 0;
			w |= 0;
			h |= 0;
			this.ctx.drawImage(img, x, this.drawingSize - y - h, w, h);
		}
		drawRotatedImage (img: HTMLImageElement, x: number, y: number, w: number, h: number, angle: number) {
			x |= 0;
			y |= 0;
			w |= 0;
			h |= 0;
			this.ctx.save();
			this.ctx.translate(x + w / 2, this.drawingSize - y - h + h / 2);
			this.ctx.rotate(Math.PI / 180 * angle);
			this.ctx.drawImage(img, -w/2, -h/2, w, h);
			this.ctx.restore();
		}

		drawText(text: string, x: number, y: number, color = "#000000") {
			x |= 0;
			y |= 0;
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
			this.drawRotatedImage(this.assets.getImage("img/robot.png"), robot.data.x * cellSize + cellSize * 0.05, robot.data.y * cellSize + cellSize * 0.05, cellSize * 0.9, cellSize * 0.9, robot.data.angle);

			/*ctx.beginPath();
			ctx.strokeStyle = "#ff0000";
			ctx.moveTo((robot.data.x + 0.5) * cellSize, drawingSize - (robot.data.y + 0.5) * cellSize);
			ctx.lineTo((robot.data.x + 0.5 + robot.data.dirX) * cellSize, drawingSize - (robot.data.y + robot.data.dirY + 0.5) * cellSize);
			ctx.stroke();*/

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