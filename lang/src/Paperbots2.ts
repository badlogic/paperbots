import {TextMarker} from "../node_modules/@types/codemirror/index";
import {AssetManager, Input, TimeKeeper, InputListener} from "./Utils";
import * as compiler from "./Compiler";
import {World, Robot, RobotAction, RobotData, WorldData, WorldObject} from "./World";

declare function CodeMirror(host: HTMLElement, options?: CodeMirror.EditorConfiguration): CodeMirror.Editor;

export class SourceChanged { constructor(public source: string, public module: compiler.Module | null) {}}
export class Run { }
export class Debug { }
export class Step { constructor(public line: number) {} }
export class Stop { }
export class LineChange { constructor(public line: number) {} }
export class Select { constructor(public startLine: number, public startColumn: number, public endLine: number, public endColumn: number) {} }
export class AnnounceExternalFunctions { constructor(public functions: compiler.ExternalFunctions) {} }
export type Event = SourceChanged | Run | Debug | Step | Stop | LineChange | Selection;

// const DEFAULT_SOURCE = `
// while true do
// 	forward()
// end
// `

const DEFAULT_SOURCE = `
while true do
	forward()
	forward()
	turnLeft()
end
`

export interface EventListener {
	onEvent(event: Event);
}

export class EventBus {
	private listeners = new Array<EventListener>()

	addListener(listener: EventListener) {
		this.listeners.push(listener);
	}

	event(event: Event) {
		this.listeners.forEach(listener => listener.onEvent(event));
	}
}

export abstract class Widget implements EventListener {
	constructor(protected bus: EventBus) { }
	abstract render (): HTMLElement;
	abstract onEvent(event: Event);
}

export class Paperbots2 implements EventListener {
	private eventBus = new EventBus();
	private editor = new Editor(this.eventBus);
	private debugger = new Debugger(this.eventBus);
	private playground = new Playground(this.eventBus);

	constructor(parent: HTMLElement) {
		// register all components with the bus
		this.eventBus.addListener(this);
		this.eventBus.addListener(this.editor);
		this.eventBus.addListener(this.debugger);
		this.eventBus.addListener(this.playground);

		// Render the components
		let dom = $(/*html*/ `
			<div id="pb-main">
			</div>
		`);
		dom.append(this.playground.render());

		let editorAndDebugger = $(/*html */`
			<div id ="pb-editor-and-debugger">
			</div>
		`);
		editorAndDebugger.append(this.editor.render());
		editorAndDebugger.append(this.debugger.render());
		dom.append(editorAndDebugger);
		$(parent).append(dom);
	}

	onEvent(event: Event) {
	}
}

export class Debugger extends Widget {
	private module: compiler.Module;
	private vm: compiler.VirtualMachine;
	private run: JQuery;
	private debug: JQuery;
	private stepOver: JQuery;
	private stepInto: JQuery;
	private locals: JQuery;
	private callstack: JQuery;
	private vmState: JQuery;
	private dom: JQuery;
	private lastModule: compiler.Module = null;
	private selectedFrame: compiler.Frame = null;

	render (): HTMLElement {
		let dom = this.dom = $(/*html*/`
			<div id="pb-debugger">
				<div id="pb-debugger-locals-callstack">
					<div>
						<input id="pb-debugger-run" type="button" value="Run">
						<input id="pb-debugger-debug" type="button" value="Debug">
						<input id="pb-debugger-step-over" type="button" value="Step over">
						<input id="pb-debugger-step-into" type="button" value="Step into">
					</div>
					<div class="pb-debugger-label">Parameters & Variables</div>
					<div id="pb-debugger-locals"></div>
					<div class="pb-debugger-label">Callstack</div>
					<div id="pb-debugger-callstack"></div>
				</div>
				<div id="pb-debugger-vm"></div>
			</div>
		`);

		this.run = dom.find("#pb-debugger-run");
		this.debug = dom.find("#pb-debugger-debug");
		this.stepOver = dom.find("#pb-debugger-step-over");
		this.stepInto = dom.find("#pb-debugger-step-into");
		this.locals = dom.find("#pb-debugger-locals");
		this.callstack = dom.find("#pb-debugger-callstack");
		this.vmState = dom.find("#pb-debugger-vm");

		this.run.click(() => {
			if (this.run.val() == "Run") {
				this.vm = new compiler.VirtualMachine(this.lastModule.code, this.lastModule.externalFunctions);										;
				this.run.val("Stop");
				setEnabled(this.debug, false);
				this.bus.event(new Run())

				let advance = () => {
					if (!this.vm) return;
					this.vm.run(1000);
					if (this.vm.state == compiler.VMState.Completed) {
						this.bus.event(new Stop())
						return;
					}
					requestAnimationFrame(advance);
				};
				requestAnimationFrame(advance);
			} else {
				this.bus.event(new Stop())
			}
		});

		this.debug.click(() => {
			if (this.debug.val() == "Debug") {
				this.vm = new compiler.VirtualMachine(this.lastModule.code, this.lastModule.externalFunctions);
				this.debug.val("Stop");
				setEnabled(this.run, false);
				setEnabled(this.stepOver, true);
				setEnabled(this.stepInto, true);
				this.bus.event(new Debug())
				this.bus.event(new Step(this.vm.getLineNumber()));
			} else {
				this.bus.event(new Stop())
			}
		});

		/*this.stepVm.click(() => {
			this.vm.run(1);
			this.bus.event(new Step(this.vm.getLineNumber()));
		});*/

		this.stepOver.click(() => {
			this.vm.stepOver();
			this.bus.event(new Step(this.vm.getLineNumber()));
			if (this.vm.state == compiler.VMState.Completed) {
				this.bus.event(new Stop())
				return;
			}
		});

		this.stepInto.click(() => {
			this.vm.stepInto();
			this.bus.event(new Step(this.vm.getLineNumber()));
			if (this.vm.state == compiler.VMState.Completed) {
				this.bus.event(new Stop())
				return;
			}
		});

		dom.find("input").attr("disabled", "true");
		return dom[0];
	}

	renderState () {
		if (!this.locals) return;
		this.locals.empty();
		this.callstack.empty();
		this.vmState.empty();
		if (this.vm && this.vm.frames.length > 0) {
			this.vm.frames.slice(0).reverse().forEach(frame => {
				let signature = compiler.functionSignature(frame.code.ast as compiler.FunctionDecl);
				let lineInfo = frame.code.lineInfos[frame.pc];
				let dom = $(/*html*/`
					<div class="pb-debugger-callstack-frame">
					</div>
				`);
				dom.text(signature + " line " + lineInfo.line);

				if (frame == this.selectedFrame) dom.addClass("selected");

				dom.click(() => {
					this.selectedFrame = frame;
					this.bus.event(new LineChange(lineInfo.line));
					this.renderState();
				})

				this.callstack.append(dom);
			});

			if (this.selectedFrame) {
				this.selectedFrame.slots.forEach(slot => {
					let dom = $(/*html*/`
						<div class="pb-debugger-local">
						</div>
					`);
					dom.text(slot.symbol.name.value + ": " + JSON.stringify(slot.value));
					dom.click(() => {
						let location = slot.symbol.name.location;
						this.bus.event(new Select(
							location.start.line,
							location.start.column,
							location.end.line,
							location.end.column
						));
					})
					this.locals.append(dom);
				});
			}
			this.renderVmState(this.vm);
		}
	}

	renderVmState(vm: compiler.VirtualMachine) {
		var output = "";
		this.vm.frames.slice(0).reverse().forEach(frame => {
			output += compiler.functionSignature(frame.code.ast as compiler.FunctionDecl);
			output += "\nlocals:\n"
			frame.slots.forEach((slot, index) => {
				output += `   [${index}] ` + slot.symbol.name.value + ": " + slot.value + "\n";
			});

			output += "\ninstructions:\n"
			var lastLineInfoIndex = -1;
			frame.code.instructions.forEach((ins, index) => {
				let line = frame.code.lineInfos[index];
				if (lastLineInfoIndex != line.index) {
					output += "\n";
					lastLineInfoIndex = line.index;
				}
				output += (index == frame.pc ? " -> " : "    ") + JSON.stringify(ins) + " " + line.index + ":" + line.line + "\n";
			});
			output += "\n";
		});
		this.vmState.html(output);

		/*let valueStack = $("#pb-debugger-valuestack")[0];
		output = "stack:\n"
		this.vm.stack.slice(0).reverse().forEach((value, index) => {
			output += `   [${index}] = `+ JSON.stringify(value) + "\n";
		})
		valueStack.innerHTML = output;*/
	}

	onEvent(event: Event) {
		let {run, debug, stepOver, stepInto, dom} = this;

		if (event instanceof SourceChanged) {
			if (event.module) {
				this.lastModule = event.module;
				setEnabled(this.run, true);
				setEnabled(this.debug, true);
			} else {
				this.lastModule = null;
				this.vm = null;
				dom.find("input").attr("disabled", "true");
				// TODO hide debugger view
			}
		} else if (event instanceof Stop) {
			this.run.val("Run")
			this.debug.val("Debug");
			setEnabled(this.run, true);
			setEnabled(this.debug, true);
			setEnabled(this.stepOver, false);
			setEnabled(this.stepInto, false);
			this.vm = null;
		} else if (event instanceof Step) {
			if (this.vm && this.vm.frames.length > 0) {
				this.selectedFrame = this.vm.frames[this.vm.frames.length - 1];
			}
		}

		this.renderState();
	}
}

function setEnabled(el: JQuery, enabled: boolean) {
	if (enabled)
		el.removeAttr("disabled");
	else
		el.attr("disabled", "true");
}

export class Editor extends Widget {
	private editor: CodeMirror.Editor;
	private error: JQuery;
	private markers = Array<TextMarker>();
	private ext = new compiler.ExternalFunctions();

	render (): HTMLElement {
		let dom = $(/* html */`
			<div id="pb-code-editor">
				<div id="pb-code-editor-code-mirror"></div>
				<div id="pb-code-editor-error"></div>
			</div>
		`);
		requestAnimationFrame(() => {
			this.editor = (CodeMirror as any)(dom.find("#pb-code-editor-code-mirror")[0], {
				tabSize: 3,
				indentUnit: 3,
				indentWithTabs: true,
				styleActiveLine: true,
				styleActiveSelected: true,
				lineNumbers: true,
				gutters: ["gutter-breakpoints", "CodeMirror-linenumbers"],
				fixedGutter: true,
				extraKeys: {
					"Tab": "indentAuto"
				}
			});

			this.editor.on("change", (instance, change) => {
				let module = this.compile();
				this.bus.event(new SourceChanged(this.editor.getDoc().getValue(), module));
			});

			this.editor.getDoc().setValue(DEFAULT_SOURCE.trim());

			let module = this.compile();
			this.bus.event(new SourceChanged(this.editor.getDoc().getValue(), module));
		});
		this.error = dom.find("#pb-code-editor-error");
		this.error.hide();
		return dom[0];
	}

	compile () {
		this.markers.forEach(marker => marker.clear());
		this.markers.length = 0;

		try {
			let result = compiler.compile(this.editor.getDoc().getValue(), this.ext);
			this.error.hide();
			return result;
		} catch (e) {
			this.error.show();
			if (e["location"]) {
				let err = (e as compiler.CompilerError);
				let loc = err.location;
				let from = {line: loc.start.line - 1, ch: loc.start.column - 1 - (loc.start.line == loc.end.line && loc.start.column == loc.end.column ? 1 : 0)};
				let to = {line: loc.end.line - 1, ch: loc.end.column - 1};
				this.markers.push(this.editor.getDoc().markText(from, to, { className: "compiler-error", title: err.message}));
				this.error.html("Error in line " + loc.start.line + ", column " + loc.start.column + ": " + err.message);
			} else {
				let err = e as Error;
				this.error.html(err.message + (err.stack ? err.stack : ""));
			}
			return null;
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

	setLine(line: number) {
		this.editor.getDoc().setCursor(line, 1);
	}

	onEvent(event: Event) {
		if (event instanceof Run || event instanceof Debug) {
			this.editor.setOption("readOnly", true);
		} else if (event instanceof Stop) {
			this.editor.setOption("readOnly", false);
			this.editor.focus();
		} else if (event instanceof Step || event instanceof LineChange) {
			this.setLine(event.line - 1);
		} else if (event instanceof Select) {
			this.editor.getDoc().setSelection(
				{line: event.startLine - 1, ch: event.startColumn - 1},
				{line: event.endLine - 1, ch: event.endColumn - 1}
			);
		} else if (event instanceof AnnounceExternalFunctions) {
			this.ext = event.functions;
		}
	}
}

function assertNever(x: never): never {
	throw new Error("Unexpected object: " + x);
}

export class Playground extends Widget {
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

	constructor(bus: EventBus) {
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
					<div id="pb-canvas-tools-running" style="display:none;">
						<input type="button" value="forward()">
						<input type="button" value="turnLeft()">
						<input type="button" value="turnRight()">
						<input type="button" value="print()">
						<input type="button" value="scan()">
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
		this.toolsHandler = {
			down: (x, y) => {
				let cellSize = this.canvas.width / (World.WORLD_SIZE + 1);
				x = ((x / cellSize) | 0) - 1;
				y = (((this.canvas.height - y) / cellSize) | 0) - 1;

				if (this.selectedTool == "Wall") {
					this.world.setTile(x, y, World.newWall());
				} else if (this.selectedTool == "Floor") {
					this.world.setTile(x, y, null);
				}
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

		this.bus.event(new AnnounceExternalFunctions(ext));
	}

	onEvent(event: Event) {
		if (event instanceof Stop) {
			this.input.addListener(this.toolsHandler);
			this.container.find("#pb-canvas-tools-editing input").each((index, element) => {
				setEnabled($(element), true);
			});
			this.world = new World(this.worldData);
			this.isRunning = false;
		} else if(event instanceof Run || event instanceof Debug) {
			this.input.removeListener(this.toolsHandler);
			this.container.find("#pb-canvas-tools-editing input").each((index, element) => {
				setEnabled($(element), false);
			});
			this.worldData = JSON.parse(JSON.stringify(this.world.data));
			this.isRunning = true;
		}
	}

	getWorld (): World {
		return this.world;
	}

	resize () {
		let canvas = this.canvas;
		let realToCSSPixels = window.devicePixelRatio;
		let displayWidth  = Math.floor(canvas.clientWidth * realToCSSPixels);
		let displayHeight  = Math.floor(canvas.clientHeight * realToCSSPixels);

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

		for (var y = 0; y < World.WORLD_SIZE; y++) {
			for (var x = 0; x < World.WORLD_SIZE; x ++) {
				var img = null;
				let obj = this.world.getTile(x, y);
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

				let wx = x * cellSize;
				let wy = y * cellSize;
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