import {AssetManager, Input, TimeKeeper, InputListener} from "./Utils";

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