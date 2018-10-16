import { Widget } from "./Widget"
import * as events from "./Events"
import { setElementEnabled } from "../Utils";
import * as compiler from "../Compiler";

export enum DebuggerState {
	Stopped,
	Running,
	Paused,
}

export class Debugger extends Widget {
	private module: compiler.Module;
	private vm: compiler.VirtualMachine;

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
	private selectedFrame: compiler.Frame = null;
	private state = DebuggerState.Stopped;

	render (): HTMLElement {
		let dom = this.dom = $(/*html*/`
			<div id="pb-debugger">
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
					<div class="pb-debugger-label">VARIABLES</div>
					<div id="pb-debugger-locals"></div>
					<div class="pb-debugger-label">CALL STACK</div>
					<div id="pb-debugger-callstack"></div>
				</div>
				<div id="pb-debugger-vm"></div>
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

		this.advanceVm = () => {
			if (this.state != DebuggerState.Running) return;
			this.vm.run(1000);
			this.checkVmStopped();
			requestAnimationFrame(this.advanceVm);
		};

		this.run.click(() => {
			this.state = DebuggerState.Running;
			this.vm = new compiler.VirtualMachine(this.lastModule.code, this.lastModule.externalFunctions);
			this.bus.event(new events.Run())
			requestAnimationFrame(this.advanceVm);
		});

		this.debug.click(() => {
			this.state = DebuggerState.Paused;
			this.vm = new compiler.VirtualMachine(this.lastModule.code, this.lastModule.externalFunctions);
			this.bus.event(new events.Debug());
			this.bus.event(new events.Step(this.vm.getLineNumber()));
		});

		this.pause.click(() => {
			this.state = DebuggerState.Paused;
			this.bus.event(new events.Pause());
			this.bus.event(new events.Step(this.vm.getLineNumber()));
		});

		this.resume.click(() => {
			this.state = DebuggerState.Running;
			this.bus.event(new events.Resume());
			this.bus.event(new events.Step(this.vm.getLineNumber()));
			requestAnimationFrame(this.advanceVm);
		});

		this.stop.click(() => {
			this.state = DebuggerState.Stopped;
			this.bus.event(new events.Stop());
		});

		/*this.stepVm.click(() => {
			this.vm.run(1);
			this.bus.event(new Step(this.vm.getLineNumber()));
		});*/

		this.stepOver.click(() => {
			this.vm.stepOver();
			this.bus.event(new events.Step(this.vm.getLineNumber()));
			if (this.vm.state == compiler.VMState.Completed) {
				alert("Program complete.");
				this.bus.event(new events.Stop())
				return;
			}
		});

		this.stepInto.click(() => {
			this.vm.stepInto();
			this.bus.event(new events.Step(this.vm.getLineNumber()));
			if (this.vm.state == compiler.VMState.Completed) {
				alert("Program complete.");
				this.bus.event(new events.Stop())
				return;
			}
		});

		dom.find("input").attr("disabled", "true");
		return dom[0];
	}

	checkVmStopped () {
		if (this.vm.state == compiler.VMState.Completed) {
			this.state = DebuggerState.Stopped;
			alert("Program complete.");
			this.bus.event(new events.Stop())
			return;
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

		} else if (event instanceof events.Debug) {
			this.run.hide();
			this.debug.hide();

			this.resume.show();
			this.stop.show();
			this.stepOver.show()
			this.stepInto.show();
			this.stepOut.show();

			this.state = DebuggerState.Paused;
		} else if (event instanceof events.Pause) {
			this.state == DebuggerState.Paused;
		} else if (event instanceof events.Resume) {
			this.state == DebuggerState.Running;
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
			this.state = DebuggerState.Stopped;
		} else if (event instanceof events.Step) {
			if (this.vm && this.vm.frames.length > 0) {
				this.selectedFrame = this.vm.frames[this.vm.frames.length - 1];
			}
		}
		this.renderState();
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
					this.bus.event(new events.LineChange(lineInfo.line));
					this.renderState();
				})

				this.callstack.append(dom);
			});

			if (this.selectedFrame) {
				this.selectedFrame.slots.forEach(slot => {
					if (slot.value == null) return;
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
}