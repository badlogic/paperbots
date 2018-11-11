import * as events from "./Events"
import { Widget } from "./Widget"
import { AssetManager, Input, InputListener, TimeKeeper, setElementEnabled } from "../Utils"
import * as compiler from "../language/Compiler"
import * as vm from "../language/VirtualMachine"
import { BooleanType, StringType, NumberType, NothingType } from "../language/Compiler";
import { DocCategory } from "./Docs";
import { Dialog } from "./Dialog";

function assertNever(x: never): never {
	throw new Error("Unexpected object: " + x);
}

export class RobotWorld extends Widget {
	private container: JQuery<HTMLElement>;
	private canvas: HTMLCanvasElement;
	private world: World;
	private worldData: WorldData;
	private ctx: CanvasRenderingContext2D;
	private assets = new AssetManager();
	private selectedTool = "Robot";
	private input: Input;
	private lastWidth = 0;
	private cellSize = 0;
	private drawingSize = 0;
	private time = new TimeKeeper();
	private toolsHandler: InputListener;
	private isRunning = false;
	private noTools = false;
	private lastFrameTime = -1;

	constructor(bus: events.EventBus, noTools: boolean = false) {
		super(bus);

		this.worldData = new WorldData();
		this.world = new World(this.worldData);
		this.noTools = noTools;
	}

	setWorldData(worldData: WorldData) {
		this.worldData = worldData;
		this.world = new World(this.worldData);
	}

	render (): HTMLElement {
		this.container = $(/*html*/`
			<div id="pb-robot-world">
				<div id="pb-robot-world-tools">
					<input type="button" value="Robot" class="selected">
					<input type="button" value="Floor">
					<input type="button" value="Wall">
					<input type="button" value="Number">
					<input type="button" value="Letter">
				</div>
				<canvas id="pb-robot-world-canvas"></canvas>
			</div>
		`);
		if (this.noTools) this.container.find("#pb-robot-world-tools").hide();
		this.canvas = this.container.find("#pb-robot-world-canvas")[0] as HTMLCanvasElement;
		this.ctx = this.canvas.getContext("2d");
		this.assets.loadImage("img/wall.png");
		this.assets.loadImage("img/floor.png");
		this.assets.loadImage("img/robot.png");

		let tools = this.container.find("#pb-robot-world-tools input");
		for (var i = 0; i < tools.length; i++) {
			$(tools[i]).click((tool) => {
				let value = (tool.target as HTMLInputElement).value;
				tools.removeClass("selected");
				$(tool.target).addClass("selected");
				this.selectedTool = value;
			});
		}

		this.input = new Input(this.canvas);
		var dragged = false;
		this.toolsHandler = {
			down: (x, y) => {
				requestAnimationFrame(() => {this.draw(0)});
				let cellSize = this.canvas.clientWidth / (World.WORLD_SIZE + 1);
				x = ((x / cellSize) | 0) - 1;
				y = (((this.canvas.clientHeight - y) / cellSize) | 0) - 1;

				if (this.selectedTool == "Wall") {
					this.world.setTile(x, y, World.newWall());
					this.bus.event(new events.ProjectChanged());
				} else if (this.selectedTool == "Floor") {
					this.world.setTile(x, y, null);
					this.bus.event(new events.ProjectChanged());
				}
				dragged = false;
			},
			up: (x, y) => {
				requestAnimationFrame(() => {this.draw(0)});
				let cellSize = this.canvas.clientWidth / (World.WORLD_SIZE + 1);
				x = ((x / cellSize) | 0) - 1;
				y = (((this.canvas.clientHeight - y) / cellSize) | 0) - 1;
				if (this.selectedTool == "Wall") {
					this.world.setTile(x, y, World.newWall());
					this.bus.event(new events.ProjectChanged());
				} else if (this.selectedTool == "Floor") {
					this.world.setTile(x, y, null);
					this.bus.event(new events.ProjectChanged());
				} else if (this.selectedTool == "Number") {
					Dialog.prompt("Prompt", "Please enter a number between 0-99", (number: any) => {
						try {
							number = parseInt(number, 10);
							if (number < 0 || number > 99 || isNaN(number)) {
								Dialog.alert("Error", $("<p>The number must be between 0-99.</p>")).show();
							} else {
								this.world.setTile(x, y, World.newNumber(number));
								this.bus.event(new events.ProjectChanged());
								requestAnimationFrame(() => {this.draw(0)});
							}
						} catch (e) {
							Dialog.alert("Error", $("<p>The number must be between 0-99.</p>")).show();
						}
					}, () => {
					});
				} else if (this.selectedTool == "Letter") {
					Dialog.prompt("Prompt", "Please enter a letter", (letter) => {
						letter = letter.trim();
						if (letter.length != 1) {
							Dialog.alert("Error", $("<p>Only a single letter is allowed.</p>")).show();
						} else {
							this.world.setTile(x, y, World.newLetter(letter));
							this.bus.event(new events.ProjectChanged());
							requestAnimationFrame(() => {this.draw(0)});
						}
					}, () => {
					});
				} else if (this.selectedTool == "Robot") {
					if (this.world.robot.data.x != x || this.world.robot.data.y != y) {
						this.world.robot.data.x = Math.max(0, Math.min(World.WORLD_SIZE - 1, x));
						this.world.robot.data.y = Math.max(0, Math.min(World.WORLD_SIZE - 1, y));
					} else {
						if (dragged) return;
						this.world.robot.turnLeft();
					}
					this.bus.event(new events.ProjectChanged());
				}
			},
			moved: (x, y) => {
			},
			dragged: (x, y) => {
				requestAnimationFrame(() => {this.draw(0)});
				let cellSize = this.canvas.clientWidth / (World.WORLD_SIZE + 1);
				x = ((x / cellSize) | 0) - 1;
				y = (((this.canvas.clientHeight - y) / cellSize) | 0) - 1;

				if (this.selectedTool == "Wall") {
					this.world.setTile(x, y, World.newWall());
					this.bus.event(new events.ProjectChanged());
				} else if (this.selectedTool == "Floor") {
					this.world.setTile(x, y, null);
					this.bus.event(new events.ProjectChanged());
				} else if (this.selectedTool == "Robot") {
					this.world.robot.data.x = Math.max(0, Math.min(World.WORLD_SIZE - 1, x));
					this.world.robot.data.y = Math.max(0, Math.min(World.WORLD_SIZE - 1, y));
					this.bus.event(new events.ProjectChanged());
				}
				dragged = true;
			}
		};
		if (!this.noTools) this.input.addListener(this.toolsHandler);
		this.announceExternals();
		this.announceDocs()
		requestAnimationFrame(() => { this.draw(0); });
		return this.container[0];
	}

	announceExternals() {
		let ext = new compiler.ExternalFunctionsTypesConstants();

		ext.addFunction("forward", [], NothingType, true, () => {
			this.world.robot.setAction(this.world, RobotAction.Forward);
			let asyncResult: vm.AsyncPromise<void> = {
				completed: false,
				value: null,
				stopVirtualMachine: false
			}
			let check = () => {
				if (this.world.robot.action == RobotAction.None) {
					asyncResult.completed = true;
					return;
				}
				requestAnimationFrame(check);
			}
			requestAnimationFrame(check);
			return asyncResult;
		});
		ext.addFunction("backward", [], NothingType, true, () => {
			this.world.robot.setAction(this.world, RobotAction.Backward);
			let asyncResult: vm.AsyncPromise<void> = {
				completed: false,
				value: null,
				stopVirtualMachine: false
			}
			let check = () => {
				if (this.world.robot.action == RobotAction.None) {
					asyncResult.completed = true;
					return;
				}
				requestAnimationFrame(check);
			}
			requestAnimationFrame(check);
			return asyncResult;
		});

		ext.addFunction("turnLeft", [], NothingType, true, () => {
			this.world.robot.setAction(this.world, RobotAction.TurnLeft);
			let asyncResult: vm.AsyncPromise<void> = {
				completed: false,
				value: null,
				stopVirtualMachine: false
			}
			let check = () => {
				if (this.world.robot.action == RobotAction.None) {
					requestAnimationFrame(() => asyncResult.completed = true);
					return;
				}
				requestAnimationFrame(check);
			}
			requestAnimationFrame(check);
			return asyncResult;
		});

		ext.addFunction("turnRight", [], NothingType, true, () => {
			this.world.robot.setAction(this.world, RobotAction.TurnRight);
			let asyncResult: vm.AsyncPromise<void> = {
				completed: false,
				value: null,
				stopVirtualMachine: false
			}
			let check = () => {
				if (this.world.robot.action == RobotAction.None) {
					requestAnimationFrame(() => asyncResult.completed = true);
					return;
				}
				requestAnimationFrame(check);
			}
			requestAnimationFrame(check);
			return asyncResult;
		});

		ext.addFunction("print", [{name: "value", type: NumberType}], NothingType, true, (number) => {
			if (number < 0 || number > 99 || isNaN(number)) {
				return {
					completed: true,
					value: null
				}
			}
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			if (!tile || tile.kind != "wall") {
				this.world.setTile(x, y, World.newNumber(number | 0));
			}
			let asyncResult: vm.AsyncPromise<void> = {
				completed: false,
				value: null,
				stopVirtualMachine: false
			}
			var num = 1;
			let check = () => {
				if (num-- > 0) {
					requestAnimationFrame(check);
					return;
				}
				asyncResult.completed = true;
			}
			requestAnimationFrame(check);
			return asyncResult;
		});

		ext.addFunction("print", [{name: "letter", type: StringType}], NothingType, true, (letter) => {
			if (letter.trim().length == 0) {
				return {
					completed: true,
					value: null
				}
			};

			if (letter.trim().length != 1) {
				return {
					completed: true,
					value: null
				}
			}
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			if (!tile || tile.kind != "wall") {
				this.world.setTile(x, y, World.newLetter(letter));
			}
			let asyncResult: vm.AsyncPromise<void> = {
				completed: false,
				value: null,
				stopVirtualMachine: false
			}
			var num = 1;
			let check = () => {
				if (num-- > 0) {
					requestAnimationFrame(check);
					return;
				}
				asyncResult.completed = true;
			}
			requestAnimationFrame(check);
			return asyncResult;
		});

		ext.addFunction("scanNumber", [], NumberType, false, () => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			if (!tile || tile.kind != "number") {
				return -1;
			} else {
				return tile.value;
			}
		});

		ext.addFunction("scanLetter", [], StringType, false, () => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			if (!tile || tile.kind != "letter") {
				return "";
			} else {
				return tile.value;
			}
		});

		ext.addFunction("isWallAhead", [], BooleanType, false, () => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			return tile != null && tile.kind == "wall";
		});

		ext.addFunction("isNumberAhead", [], BooleanType, false, () => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			return tile != null && tile.kind == "number";
		});
		ext.addFunction("isLetterAhead", [], BooleanType, false, () => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			return tile != null && tile.kind == "letter";
		});
		ext.addFunction("distanceToWall", [], NumberType, false, () => {
			let dirX = this.world.robot.data.dirX;
			let dirY = this.world.robot.data.dirY;
			let x = this.world.robot.data.x + dirX;
			let y = this.world.robot.data.y + dirY;
			var distance = 0;
			var tile = this.world.getTile(x, y);
			while(true) {
				if (tile && tile.kind == "wall") break;
				distance++;
				x += dirX;
				y += dirY;
				tile = this.world.getTile(x, y);
			}
			return distance;
		});
		ext.addFunction("getDirection", [], NumberType, false, () => {
			let dirX = this.world.robot.data.dirX;
			let dirY = this.world.robot.data.dirY;
			if (dirX == 1 && dirY == 0) return 0;
			if (dirX == 0 && dirY == 1) return 1;
			if (dirX == -1 && dirY == 0) return 2;
			if (dirX == 0 && dirY == -1) return 3;
			return 0;
		});
		ext.addFunction("getX", [], NumberType, false, () => {
			return this.world.robot.data.x;
		});
		ext.addFunction("getY", [], NumberType, false, () => {
			return this.world.robot.data.y;
		});
		ext.addFunction("getSpeed", [], NumberType, false, () => {
			return 1 / this.world.robot.moveDuration;
		});
		ext.addFunction("setSpeed", [{name: "speed", type: NumberType}], NothingType, false, (speed) => {
			if (speed < 0) {
				return;
			}
			this.world.robot.moveDuration = 1 / speed;
		});
		ext.addFunction("getTurningSpeed", [], NumberType, false, () => {
			return 90 / this.world.robot.turnDuration;
		});
		ext.addFunction("setTurningSpeed", [{name: "degrees", type: NumberType}], NothingType, false, (degrees) => {
			if (degrees < 0) {
				return;
			}
			this.world.robot.turnDuration = 1 / degrees * 90;
		});
		ext.addFunction("buildWall", [], NothingType, true, (speed) => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			this.world.setTile(x, y, World.newWall());

			let asyncResult: vm.AsyncPromise<void> = {
				completed: false,
				value: null,
				stopVirtualMachine: false
			}
			var num = 1;
			let check = () => {
				if (num-- > 0) {
					requestAnimationFrame(check);
					return;
				}
				asyncResult.completed = true;
			}
			requestAnimationFrame(check);
			return asyncResult;
		});
		ext.addFunction("destroyWall", [], NothingType, true, (speed) => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			if (tile && tile.kind == "wall") this.world.setTile(x, y, null);

			let asyncResult: vm.AsyncPromise<void> = {
				completed: false,
				value: null,
				stopVirtualMachine: false
			}
			var num = 1;
			let check = () => {
				if (num-- > 0) {
					requestAnimationFrame(check);
					return;
				}
				asyncResult.completed = true;
			}
			requestAnimationFrame(check);
			return asyncResult;
		});

		this.bus.event(new events.AnnounceExternalFunctions(ext));
	}

	announceDocs () {
		let docs: DocCategory = {
			name: "Robot program functions",
			desc: "Use the below functions to create the program for your robot.",
			entries: [],
			subCategories: [
				{
					name: "Robot movement",
					desc: "Make the robot move with these functions.",
					entries: [
						{
							name: "<code>forward()</code>",
							anchor: "robot-forward",
							desc: "Moves the robot forward by one cell in the direction it is facing. If the grid cell is blocked by a wall, the robot does not move."
						},
						{
							name: "<code>backward()</code>",
							anchor: "robot-backward",
							desc: "Moves the robot backward by one cell in the oposite direction it is facing. If the grid cell is blocked by a wall, the robot does not move."
						},
						{
							name: "<code>turnLeft()</code>",
							anchor: "robot-turn-left",
							desc: "Rotates the robot in-place to the left by 90 degrees (counter-clock-wise)."
						},
						{
							name: "<code>turnRight()</code>",
							anchor: "robot-turn-right",
							desc: "Rotates the robot in-place to the right by 90 degrees (clock-wise)."
						}
					],
					subCategories: []
				},
				{
					name: "Robot input",
					desc: "Let the robot read information from its environment.",
					entries: [
						{
							name: "<code>scanNumber(): number</code>",
							anchor: "robot-scan-number",
							desc: "Scans the number in the cell in front of the robot and returns it. If there is no number, <code>-1</code> is returned."
						},
						{
							name: "<code>scanLetter(): string</code>",
							anchor: "robot-scan-letter",
							desc: `Scans the letter in the cell in front of the robot and returns it. If there is no letter, and empty string <code>""</code> is returned.`
						},
						{
							name: "<code>isWallAhead(): boolean</code>",
							anchor: "robot-is-wall-ahead",
							desc: "Returns <code>true</code> if there is a wall in the cell ahead of the robot. Returns <code>false</code> otherwise."
						},
						{
							name: "<code>isNumberAhead(): boolean</code>",
							anchor: "robot-is-number-ahead",
							desc: "Returns <code>true</code> if there is a number in the cell ahead of the robot. Returns <code>false</code> otherwise."
						},
						{
							name: "<code>isLetterAhead(): boolean</code>",
							anchor: "robot-is-letter-ahead",
							desc: "Returns <code>true</code> if there is a letter in the cell ahead of the robot. Returns <code>false</code> otherwise."
						},
						{
							name: "<code>distanceToWall(): number</code>",
							anchor: "robot-distance-to-wall",
							desc: "Returns the number of cells between the robot and the next wall in the direction the robot is facing."
						}
					],
					subCategories: []
				},
				{
					name: "Robot output",
					desc: "Have the robot build and print stuff on the grid.",
					entries: [
						{
							name: "<code>print(value: number)</code>",
							anchor: "robot-print-number",
							desc: "Prints the number given in <code>value</code> to the cell in front of the robot. The number must be between <code>0</code> and <code>99</code>. If the number is outside that range, or there is a wall in the cell, nothing is printed. If the number has decimal places, they will be truncated."
						},
						{
							name: "<code>print(letter: string)</code>",
							anchor: "robot-print-letter",
							desc: "Prints the letter given in <code>value</code> to the cell in front of the robot. The <code>string</code> must be exactly 1 letter long. If there is a wall in the cell, nothing is printed."
						},
						{
							name: "<code>buildWall()</code>",
							anchor: "robot-build-wall",
							desc: "Builds a wall in the cell in front of the robot. Does nothing if there is a wall already."
						},
						{
							name: "<code>destroyWall()</code>",
							anchor: "robot-destroy-wall",
							desc: "Destroys a wall in the cell in front of the robot. Does nothing if there is no wall."
						}
					],
					subCategories: []
				},
				{
					name: "Robot status",
					desc: "Check the status of the robot.",
					entries: [
						{
							name: "<code>getDirection(): number</code>",
							anchor: "robot-get-direction",
							desc: "Returns the direction the robot is facing in as a number. <code>0</code> is east, <code>1</code> is north, <code>2</code> is west, and <code>3</code> is south."
						},
						{
							name: "<code>getX(): number</code>",
							anchor: "robot-get-x",
							desc: "Returns the robot's x coordinate on the grid."
						},
						{
							name: "<code>getY(): number</code>",
							anchor: "robot-get-y",
							desc: "Returns the robot's y coordinate on the grid."
						},
						{
							name: "<code>getSpeed(): number</code>",
							anchor: "robot-get-speed",
							desc: "Returns the movement speed of the robot which is measured in number of cells per second. The speed can be a decimal number. E.g. <code>1.5</code> means the robot crosses one and a half cells when moving forward."
						},
						{
							name: "<code>setSpeed(cellsPerSecond: number)</code>",
							anchor: "robot-set-speed",
							desc: "Sets the movement speed of the robot which is measured in number of cells per second. The speed must be a number >= <code>0</code>. The <code>speed</code> can be a decimal number. E.g. <code>1.5</code> means the robot crosses one and a half cells when moving forward."
						},
						{
							name: "<code>getTurningSpeed(): number</code>",
							anchor: "robot-get-turning-speed",
							desc: "Returns the turning speed of the robot which is measured in number of degrees per second."
						},
						{
							name: "<code>setTurningSpeed(degreesPerSecond: number)</code>",
							anchor: "robot-set-turning-speed",
							desc: "Set the turning speed of the robot which is measured in number of degrees per second. The number must be >= <code>0</code>. The <code>degreesPerSecond</code> can be a decimal number. E.g. <code>40.5</code> means the robot turns by 40.5 degrees per second."
						}
					],
					subCategories: []
				}
			]
		}
		this.bus.event(new events.AnnounceDocumentation(docs));
	}

	onEvent(event: Event) {
		if (event instanceof events.Stop) {
			this.input.addListener(this.toolsHandler);
			this.container.find("#pb-robot-world-tools input").each((index, element) => {
				setElementEnabled($(element), true);
			});
			this.world = new World(this.worldData);
			this.isRunning = false;
			requestAnimationFrame(() => {this.draw(0)});
		} else if(event instanceof events.Run || event instanceof events.Debug) {
			this.input.removeListener(this.toolsHandler);
			this.container.find("#pb-robot-world-tools input").each((index, element) => {
				setElementEnabled($(element), false);
			});
			this.worldData = JSON.parse(JSON.stringify(this.world.data));
			this.isRunning = true;
			this.lastFrameTime = -1;
			requestAnimationFrame(() => {this.draw(0)});
		} else if (event instanceof events.ProjectLoaded) {
			this.world = new World(event.project.contentObject.world);
			requestAnimationFrame(() => {this.draw(0)});
		} else if (event instanceof events.BeforeSaveProject) {
			event.project.type = "robot";
			event.project.contentObject.type = "robot";
			event.project.contentObject.world = this.world.data;
			requestAnimationFrame(() => {this.draw(0)});
		}
	}

	getWorld (): World {
		return this.world;
	}

	resize () {
		let canvas = this.canvas;
		let realToCSSPixels = window.devicePixelRatio;
		let displayWidth  = Math.floor(canvas.clientWidth * realToCSSPixels);
		let displayHeight  = displayWidth;

		if (canvas.width  !== displayWidth || canvas.height != displayHeight) {
			console.log(`Resize: canvas ${canvas.width}x${canvas.height}, display ${displayWidth}x${displayHeight}, ratio ${realToCSSPixels}`)
			canvas.width  = displayWidth;
			canvas.height  = displayHeight;
		}
		this.cellSize = canvas.width / (World.WORLD_SIZE + 1);
		this.drawingSize = this.cellSize * World.WORLD_SIZE;
	}

	draw (frameTime: number) {
		this.time.update();

		if (this.isRunning) {
			if (frameTime != this.lastFrameTime) {
				this.lastFrameTime = frameTime;
				requestAnimationFrame((time) => this.draw(time));
			}
			this.world.update(this.time.delta);
		}

		let ctx = this.ctx;
		let canvas = this.canvas;
		this.resize();


		ctx.fillStyle = "#252526";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		this.drawGrid();
		if (!this.assets.hasMoreToLoad()) {
			this.drawWorld();
		} else {
			requestAnimationFrame((time) => {this.draw(time)});
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

	drawText(text: string, x: number, y: number, color = "#000000", scale = 1) {
		x |= 0;
		y |= 0;
		let ctx = this.ctx;
		ctx.fillStyle = color;
		ctx.font = this.cellSize * 0.5 * scale + "pt monospace";
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

		for (var y = 0; y < World.WORLD_SIZE; y++) {
			for (var x = 0; x < World.WORLD_SIZE; x ++) {
				var img = null;
				let obj = this.world.getTile(x, y);
				if (!obj) continue;

				let wx = x * cellSize;
				let wy = y * cellSize;

				switch(obj.kind) {
					case "wall":
						img = this.assets.getImage("img/wall.png");
						break;
					case "number":
						this.drawText("" + obj.value, wx, wy, "#97b757");
						break;
					case "letter":
						this.drawText("" + obj.value, wx, wy, "#CA8D73");
						break;
					default: assertNever(obj);
				}

				if (img) this.drawRotatedImage(img, wx, wy, cellSize, cellSize, 0);
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
			this.drawText("" + y, 0, y * this.cellSize, "#828282", 0.8);
		}

		for (var x = 0; x < World.WORLD_SIZE; x++) {
			this.drawText("" + x, x * this.cellSize + this.cellSize, -this.cellSize, "#828282", 0.8);
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

export enum RobotAction {
	Forward,
	Backward,
	TurnLeft,
	TurnRight,
	None
}

export class RobotData {
	constructor(
	public x = 0,
	public y = 0,
	public dirX = 1,
	public dirY = 0,
	public angle = 0) {}
}

export class Robot {
	static readonly MOVE_DURATION = 0.25;
	static readonly TURN_DURATION = 0.25;

	moveDuration = Robot.MOVE_DURATION;
	turnDuration = Robot.TURN_DURATION;
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
			let tile = world.getTile(this.targetX, this.targetY);
			if (tile && tile.kind == "wall") {
				this.targetX = this.startX;
				this.targetY = this.startY;
			}
			break;
		case RobotAction.Backward: {
			this.startX = this.data.x;
			this.startY = this.data.y;
			this.targetX = this.data.x - this.data.dirX;
			this.targetY = this.data.y - this.data.dirY;
			let tile = world.getTile(this.targetX, this.targetY);
			if (tile && tile.kind == "wall") {
				this.targetX = this.startX;
				this.targetY = this.startY;
			}
			break;
		}
		case RobotAction.TurnLeft: {
			this.startAngle = this.data.angle;
			this.targetAngle = this.data.angle - 90;
			let temp = this.data.dirX;
			this.data.dirX = -this.data.dirY;
			this.data.dirY = temp;
			break;
		}
		case RobotAction.TurnRight: {
			this.startAngle = this.data.angle;
			this.targetAngle = this.data.angle + 90;
			let temp = this.data.dirX;
			this.data.dirX = this.data.dirY;
			this.data.dirY = -temp;
			break;
		}
		}
		this.actionTime = 0
	}

	update (delta: number): boolean {
		this.actionTime += delta;
		switch (this.action) {
			case RobotAction.Forward: {
				let percentage = this.actionTime / this.moveDuration;
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
			case RobotAction.Backward: {
				let percentage = this.actionTime / this.moveDuration;
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
				let percentage = this.actionTime / this.turnDuration;
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