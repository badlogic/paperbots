import * as events from "./Events"
import { Widget } from "./Widget"
import { AssetManager, Input, InputListener, TimeKeeper, setElementEnabled } from "../Utils"
import * as compiler from "../language/Compiler"

function assertNever(x: never): never {
	throw new Error("Unexpected object: " + x);
}

export class RobotWorld extends Widget {
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
	private isRunning = false;

	constructor(bus: events.EventBus) {
		super(bus);

		this.worldData = new WorldData();
		this.world = new World(this.worldData);
	}

	render (): HTMLElement {
		this.container = $(/*html*/`
			<div id="pb-canvas-container">
				<div id="pb-canvas-tools">
					<div id="pb-canvas-tools-editing">
						<input type="button" value="Robot" class="selected">
						<input type="button" value="Floor">
						<input type="button" value="Wall">
						<input type="button" value="Number">
						<input type="button" value="Letter">
					</div>
				</div>
				<canvas id="pb-canvas"></canvas>
			</div>
		`);
		this.canvas = this.container.find("#pb-canvas")[0] as HTMLCanvasElement;
		this.ctx = this.canvas.getContext("2d");
		this.assets.loadImage("img/wall.png");
		this.assets.loadImage("img/floor.png");
		this.assets.loadImage("img/robot.png");
		requestAnimationFrame(() => { this.draw(); });

		let tools = this.container.find("#pb-canvas-tools-editing input");
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
					this.bus.event(new events.ProjectChanged());
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
					this.bus.event(new events.ProjectChanged());
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
		this.input.addListener(this.toolsHandler);
		this.announceExternals();
		return this.container[0];
	}

	announceExternals() {
		let ext = new compiler.ExternalFunctions();

		ext.addFunction("forward", [], "nothing", true, () => {
			this.world.robot.setAction(this.world, RobotAction.Forward);
			let asyncResult: compiler.AsyncPromise<void> = {
				completed: false,
				value: null
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
		ext.addFunction("backward", [], "nothing", true, () => {
			this.world.robot.setAction(this.world, RobotAction.Backward);
			let asyncResult: compiler.AsyncPromise<void> = {
				completed: false,
				value: null
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

		ext.addFunction("turnLeft", [], "nothing", true, () => {
			this.world.robot.setAction(this.world, RobotAction.TurnLeft);
			let asyncResult: compiler.AsyncPromise<void> = {
				completed: false,
				value: null
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

		ext.addFunction("turnRight", [], "nothing", true, () => {
			this.world.robot.setAction(this.world, RobotAction.TurnRight);
			let asyncResult: compiler.AsyncPromise<void> = {
				completed: false,
				value: null
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

		ext.addFunction("print", [new compiler.ExternalFunctionParameter("value", "number")], "nothing", true, (number) => {
			if (number < 0 || number > 99 || isNaN(number)) {
				alert("The number must be between 0-99.");
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
			let asyncResult: compiler.AsyncPromise<void> = {
				completed: false,
				value: null
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

		ext.addFunction("print", [new compiler.ExternalFunctionParameter("letter", "string")], "nothing", true, (letter) => {
			if (letter.trim().length == 0) {
				return {
					completed: true,
					value: null
				}
			};

			if (letter.trim().length != 1) {
				alert("The string must consist of exactly 1 letter, got '" + letter + "' instead.");
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
			let asyncResult: compiler.AsyncPromise<void> = {
				completed: false,
				value: null
			}
			var num = 3;
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

		ext.addFunction("scanNumber", [], "number", false, () => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			if (!tile || tile.kind != "number") {
				return -1;
			} else {
				return tile.value;
			}
		});

		ext.addFunction("scanLetter", [], "string", false, () => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			if (!tile || tile.kind != "letter") {
				return "";
			} else {
				return tile.value;
			}
		});

		ext.addFunction("isWallAhead", [], "boolean", false, () => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			return tile && tile.kind == "wall";
		});

		ext.addFunction("isNumberAhead", [], "boolean", false, () => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			return tile && tile.kind == "number";
		});
		ext.addFunction("isLetterAhead", [], "boolean", false, () => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			return tile && tile.kind == "letter";
		});
		ext.addFunction("distanceToWall", [], "number", false, () => {
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
		ext.addFunction("getDirection", [], "number", false, () => {
			let dirX = this.world.robot.data.dirX;
			let dirY = this.world.robot.data.dirY;
			if (dirX == 1 && dirY == 0) return 0;
			if (dirX == 0 && dirY == 1) return 1;
			if (dirX == -1 && dirY == 0) return 2;
			if (dirX == 0 && dirY == -1) return 3;
			return 0;
		});
		ext.addFunction("getX", [], "number", false, () => {
			return this.world.robot.data.x;
		});
		ext.addFunction("getY", [], "number", false, () => {
			return this.world.robot.data.y;
		});
		ext.addFunction("getSpeed", [], "number", false, () => {
			return 1 / this.world.robot.moveDuration;
		});
		ext.addFunction("setSpeed", [new compiler.ExternalFunctionParameter("speed", "number")], "nothing", false, (speed) => {
			if (speed < 0) {
				alert("The robot's speed must be >= 0.");
				return;
			}
			this.world.robot.moveDuration = 1 / speed;
		});
		ext.addFunction("getTurningSpeed", [], "number", false, () => {
			return this.world.robot.turnDuration;
		});
		ext.addFunction("setTurningSpeed", [new compiler.ExternalFunctionParameter("seconds", "number")], "nothing", false, (speed) => {
			if (speed < 0) {
				alert("The robot's turning speed must be >= 0.");
				return;
			}
			this.world.robot.turnDuration = speed;
		});
		ext.addFunction("buildWall", [], "nothing", true, (speed) => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			this.world.setTile(x, y, World.newWall());

			let asyncResult: compiler.AsyncPromise<void> = {
				completed: false,
				value: null
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
		ext.addFunction("destroyWall", [], "nothing", true, (speed) => {
			let x = this.world.robot.data.x + this.world.robot.data.dirX;
			let y = this.world.robot.data.y + this.world.robot.data.dirY;
			let tile = this.world.getTile(x, y);
			if (tile && tile.kind == "wall") this.world.setTile(x, y, null);

			let asyncResult: compiler.AsyncPromise<void> = {
				completed: false,
				value: null
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

	onEvent(event: Event) {
		if (event instanceof events.Stop) {
			this.input.addListener(this.toolsHandler);
			this.container.find("#pb-canvas-tools-editing input").each((index, element) => {
				setElementEnabled($(element), true);
			});
			this.world = new World(this.worldData);
			this.isRunning = false;
		} else if(event instanceof events.Run || event instanceof events.Debug) {
			this.input.removeListener(this.toolsHandler);
			this.container.find("#pb-canvas-tools-editing input").each((index, element) => {
				setElementEnabled($(element), false);
			});
			this.worldData = JSON.parse(JSON.stringify(this.world.data));
			this.isRunning = true;
		} else if (event instanceof events.ProjectLoaded) {
			this.world = new World(event.project.contentObject.world);
		} else if (event instanceof events.BeforeSaveProject) {
			event.project.contentObject.type = "robot";
			event.project.contentObject.world = this.world.data;
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

	draw () {
		requestAnimationFrame(() => { this.draw(); });
		this.time.update();

		if (this.isRunning) {
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
			console.log(this.targetX + ", " + this.targetY);
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
			console.log(this.targetX + ", " + this.targetY);
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