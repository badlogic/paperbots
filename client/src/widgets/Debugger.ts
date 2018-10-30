import { Widget } from "./Widget"
import * as events from "./Events"
import { setElementEnabled } from "../Utils";
import * as compiler from "../language/Compiler";
import * as vm from "../language/VirtualMachine";

export enum DebuggerState {
	Stopped,
	Running,
	Paused,
}

export interface Breakpoint {
	getLine(): number;
}

export class Debugger extends Widget {
	private module: compiler.Module;
	private vm: vm.VirtualMachine;

	private run: JQuery;
	private debug: JQuery;
	private pause: JQuery;
	private resume: JQuery;
	private stop: JQuery;
	private stepOver: JQuery;
	private stepInto: JQuery;
	private stepOut: JQuery;

	private locals: JQuery;
	private callstack: JQuery;
	private vmState: JQuery;
	private advanceVm: () => void;

	private dom: JQuery;
	private lastModule: compiler.Module = null;
	private selectedFrame: vm.Frame = null;
	private state = DebuggerState.Stopped;
	private snapshot: vm.StepOverSnapshot = null;
	private breakpoints: Breakpoint[] = [];

	render (): HTMLElement {
		let dom = this.dom = $(/*html*/`
			<div id="pb-debugger" class="pb-collapsed">
				<div class="pb-label">DEBUGGER</div>
				<div id="pb-debugger-buttons">
					<div id="pb-debugger-run" class="pb-debugger-run-icon pb-debugger-button"></div>
					<div id="pb-debugger-debug" class="pb-debugger-debug-icon pb-debugger-button"></div>
					<div id="pb-debugger-pause" class="pb-debugger-pause-icon pb-debugger-button"></div>
					<div id="pb-debugger-continue" class="pb-debugger-continue-icon pb-debugger-button"></div>
					<div id="pb-debugger-stop" class="pb-debugger-stop-icon pb-debugger-button"></div>
					<div id="pb-debugger-step-over" class="pb-debugger-step-over-icon pb-debugger-button"></div>
					<div id="pb-debugger-step-into" class="pb-debugger-step-into-icon pb-debugger-button"></div>
					<div id="pb-debugger-step-out" class="pb-debugger-step-out-icon pb-debugger-button"></div>
				</div>
				<div id="pb-debugger-locals-callstack">
					<div id="pb-debugger-locals-label" class="pb-label">VARIABLES</div>
					<div id="pb-debugger-locals"></div>
					<div id="pb-debugger-callstack-label" class="pb-label">CALL STACK</div>
					<div id="pb-debugger-callstack"></div>
					<div id="pb-debugger-vm-label"  class="pb-label">VM</div>
					<div id="pb-debugger-vm"></div>
				</div>
			</div>
		`);

		this.run = dom.find("#pb-debugger-run");
		this.debug = dom.find("#pb-debugger-debug");
		this.pause = dom.find("#pb-debugger-pause");
		this.resume = dom.find("#pb-debugger-continue");
		this.stop = dom.find("#pb-debugger-stop");
		this.stepOver = dom.find("#pb-debugger-step-over");
		this.stepInto = dom.find("#pb-debugger-step-into");
		this.stepOut = dom.find("#pb-debugger-step-out");

		this.pause.hide();
		this.resume.hide();
		this.stop.hide();
		this.stepOver.hide();
		this.stepInto.hide();
		this.stepOut.hide();

		this.locals = dom.find("#pb-debugger-locals");
		this.callstack = dom.find("#pb-debugger-callstack");
		this.vmState = dom.find("#pb-debugger-vm");

		dom.find("#pb-debugger-vm-label").click(() => {
			this.vmState.toggle();
		});

		dom.find("#pb-debugger-callstack-label").click(() => {
			this.callstack.toggle();
		});

		dom.find("#pb-debugger-locals-label").click(() => {
			this.locals.toggle();
		});

		this.advanceVm = () => {
			if (this.state != DebuggerState.Running) return;
			this.vm.run(1000);
			this.checkVmStopped();
			requestAnimationFrame(this.advanceVm);
		};

		this.run.click(() => {
			this.runProject()
		});

		this.debug.click(() => {
			this.state = DebuggerState.Paused;
			this.snapshot = null;
			this.vm = new vm.VirtualMachine(this.lastModule.functions, this.lastModule.externalFunctions);
			this.bus.event(new events.Debug());
			this.bus.event(new events.Step(this.vm.getLineNumber()));
		});

		this.pause.click(() => {
			this.snapshot = null;
			this.state = DebuggerState.Paused;
			this.bus.event(new events.Pause());
			this.bus.event(new events.Step(this.vm.getLineNumber()));
		});

		this.resume.click(() => {
			this.state = DebuggerState.Running;
			this.bus.event(new events.Resume());
			requestAnimationFrame(this.advanceVm);
		});

		this.stop.click(() => {
			this.snapshot = null;
			this.state = DebuggerState.Stopped;
			this.bus.event(new events.Stop());
		});

		/*this.stepVm.click(() => {
			this.vm.run(1);
			this.bus.event(new Step(this.vm.getLineNumber()));
		});*/

		let stepOverAsync = () => {
			if (this.snapshot) {
				this.state = DebuggerState.Running;
				this.bus.event(new events.Resume());
				this.snapshot = this.vm.stepOver(this.snapshot);
				if (this.snapshot) {
					requestAnimationFrame(stepOverAsync);
				} else {
					if (this.vm.state == vm.VirtualMachineState.Completed) {
						alert("Program complete.");
						this.bus.event(new events.Stop())
						return;
					}
					this.state = DebuggerState.Paused;
					this.bus.event(new events.Pause());
					this.bus.event(new events.Step(this.vm.getLineNumber()));
				}
			}
		}
		this.stepOver.click(() => {
			this.state = DebuggerState.Paused;

			// If we got a snapshot, we need to switch
			// to async handling of the step over until
			// the async function has been completed.
			this.snapshot = this.vm.stepOver();
			if (this.snapshot) {
				stepOverAsync();
				return;
			}

			// Otherwise we had an step over with
			// having to wait for an async call to
			// complete.
			this.bus.event(new events.Step(this.vm.getLineNumber()));
			if (this.vm.state == vm.VirtualMachineState.Completed) {
				alert("Program complete.");
				this.bus.event(new events.Stop())
				return;
			}
		});

		this.stepInto.click(() => {
			this.vm.stepInto();
			this.bus.event(new events.Step(this.vm.getLineNumber()));
			if (this.vm.state == vm.VirtualMachineState.Completed) {
				alert("Program complete.");
				this.bus.event(new events.Stop())
				return;
			}
		});

		document.addEventListener("keydown", (e) => {
			if (e.keyCode == 69 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
				e.preventDefault();
				this.runProject();
			}
		}, false);

		dom.find("input").attr("disabled", "true");
		return dom[0];
	}

	runProject () {
		this.state = DebuggerState.Running;
		this.snapshot = null;
		this.vm = new vm.VirtualMachine(this.lastModule.functions, this.lastModule.externalFunctions);
		this.bus.event(new events.Run())
		requestAnimationFrame(this.advanceVm);
	}

	checkVmStopped () {
		if (this.vm.state == vm.VirtualMachineState.Completed) {
			this.state = DebuggerState.Stopped;
			alert("Program complete.");
			this.bus.event(new events.Stop())
			return;
		} else {
			if (this.vm.hitBreakpoint()) {
				this.state = DebuggerState.Paused;
				this.bus.event(new events.Pause());
				this.bus.event(new events.Step(this.vm.getLineNumber()));
			}
		}
	}

	setBreakpoints () {
		if (this.vm) {
			let functions = this.vm.functions;
			for (var i = 0; i < functions.length; i++) {
				let func = functions[i];
				func.breakpoints.length = 0;
				func.breakpoints.length = func.instructions.length;
			}
			this.breakpoints.forEach(bp => {
				let line = bp.getLine();

				let functions = this.vm.functions;
				for (var i = 0; i < functions.length; i++) {
					let func = functions[i];
					if (func.ast.name.value == "$main" || (line >= func.ast.location.start.line && line <= func.ast.location.end.line)) {
						let lineInfos = func.lineInfos;
						for (var j = 0; j < lineInfos.length; j++) {
							if (lineInfos[j].line == bp.getLine()) {
								func.breakpoints[j] = bp;
								return;
							}
						}
					}
				}
				console.log("Couldn't find instruction for breakpoint at line " + bp.getLine());
			});
		}
	}

	onEvent(event: Event) {
		let {run, debug, pause, resume, stop, stepOver, stepInto, dom} = this;

		if (event instanceof events.SourceChanged) {
			if (event.module) {
				this.lastModule = event.module;
				setElementEnabled(this.run, true);
				setElementEnabled(this.debug, true);
			} else {
				this.lastModule = null;
				setElementEnabled(this.run, false);
				setElementEnabled(this.debug, false);
				// TODO hide debugger view
			}
		} else if (event instanceof events.Run) {
			this.run.hide();
			this.debug.hide();
			this.pause.show();
			this.stop.show();
			this.stepOver.show()
			setElementEnabled(this.stepOver, false);
			this.stepInto.show();
			setElementEnabled(this.stepInto, false);
			this.stepOut.show();
			setElementEnabled(this.stepOut, false);
			this.setBreakpoints();
		} else if (event instanceof events.Debug) {
			this.run.hide();
			this.debug.hide();
			this.resume.show();
			this.stop.show();
			this.stepOver.show()
			this.stepInto.show();
			this.stepOut.show();
			setElementEnabled(this.stepOver, true);
			setElementEnabled(this.stepInto, true);
			setElementEnabled(this.stepOut, true);
			this.setBreakpoints();
			this.dom.removeClass("pb-collapsed");
		} else if (event instanceof events.Pause) {
			this.resume.show();
			this.pause.hide();
			setElementEnabled(this.stepOver, true);
			setElementEnabled(this.stepInto, true);
			setElementEnabled(this.stepOut, true);
			this.dom.removeClass("pb-collapsed");
		} else if (event instanceof events.Resume) {
			this.pause.show();
			this.resume.hide();
			setElementEnabled(this.stepOver, false);
			setElementEnabled(this.stepInto, false);
			setElementEnabled(this.stepOut, false);
			this.setBreakpoints();
		} else if (event instanceof events.Stop) {
			this.run.show();
			this.debug.show();
			this.pause.hide();
			this.resume.hide();
			this.stop.hide();
			this.stepOver.hide();
			this.stepInto.hide();
			this.stepOut.hide();
			setElementEnabled(this.stepOver, false);
			setElementEnabled(this.stepInto, false);
			setElementEnabled(this.stepOut, false);
			this.locals.empty();
			this.callstack.empty();
			this.vmState.empty();
			this.dom.addClass("pb-collapsed");
		} else if (event instanceof events.Step) {
			if (this.vm && this.vm.frames.length > 0) {
				this.selectedFrame = this.vm.frames[this.vm.frames.length - 1];
			}
			this.setBreakpoints();
		} else if (event instanceof events.BreakpointAdded) {
			this.breakpoints.push(event.breakpoint);
			this.setBreakpoints();
		} else if (event instanceof events.BreakpointRemoved) {
			let idx = -1;
			this.breakpoints.forEach((bp, index) => {
				if (bp === event.breakpoint) {
					idx = index;
				}
			});
			this.breakpoints.splice(idx, 1);
			this.setBreakpoints();
		}
		this.renderState();
	}

	renderState () {
		if (!this.locals) return;
		this.locals.empty();
		this.callstack.empty();
		this.vmState.empty();
		if (this.state == DebuggerState.Paused && this.vm && this.vm.frames.length > 0) {
			this.vm.frames.slice(0).reverse().forEach((frame, index) => {
				let signature = (frame.code.ast as compiler.FunctionDecl).type.signature;
				let lineInfo = frame.code.lineInfos[index == 0 ? frame.pc : frame.pc - 1];
				let dom = $(/*html*/`
					<div class="pb-debugger-callstack-frame">
					</div>
				`);
				dom.text(signature + " line " + lineInfo.line);

				if (frame == this.selectedFrame) dom.addClass("selected");

				dom.click(() => {
					this.selectedFrame = frame;
					this.bus.event(new events.LineChange(lineInfo.line));
					this.renderState();
				})

				this.callstack.append(dom);
			});

			if (this.selectedFrame) {
				let pc = this.selectedFrame.pc;
				this.selectedFrame.slots.forEach(slot => {
					if (slot.value == null) return;
					if (pc < slot.scope.startPc || pc > slot.scope.endPc) return;
					let dom = $(/*html*/`
						<div class="pb-debugger-local">
						</div>
					`);
					dom.text(slot.symbol.name.value + ": " + JSON.stringify(slot.value));
					dom.click(() => {
						let location = slot.symbol.name.location;
						this.bus.event(new events.Select(
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

	renderVmState(vm: vm.VirtualMachine) {
		var output = "";
		this.vm.frames.slice(0).reverse().forEach(frame => {
			output += (frame.code.ast as compiler.FunctionDecl).type.signature;
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
		this.vmState.text(output);

		/*let valueStack = $("#pb-debugger-valuestack")[0];
		output = "stack:\n"
		this.vm.stack.slice(0).reverse().forEach((value, index) => {
			output += `   [${index}] = `+ JSON.stringify(value) + "\n";
		})
		valueStack.innerHTML = output;*/
	}
}