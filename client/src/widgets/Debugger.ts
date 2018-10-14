import { Widget, Run, Stop, Step, LineChange, Select, SourceChanged, Debug } from "../Paperbots";
import { setElementEnabled } from "../Utils";
import * as compiler from "../Compiler";

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
				setElementEnabled(this.debug, false);
				this.bus.event(new Run())

				let advance = () => {
					if (!this.vm) return;
					this.vm.run(1000);
					if (this.vm.state == compiler.VMState.Completed) {
						alert("Program complete.");
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
				setElementEnabled(this.run, false);
				setElementEnabled(this.stepOver, true);
				setElementEnabled(this.stepInto, true);
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
				alert("Program complete.");
				this.bus.event(new Stop())
				return;
			}
		});

		this.stepInto.click(() => {
			this.vm.stepInto();
			this.bus.event(new Step(this.vm.getLineNumber()));
			if (this.vm.state == compiler.VMState.Completed) {
				alert("Program complete.");
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
					if (slot.value == null) return;
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
				setElementEnabled(this.run, true);
				setElementEnabled(this.debug, true);
			} else {
				this.lastModule = null;
				this.vm = null;
				dom.find("input").attr("disabled", "true");
				// TODO hide debugger view
			}
		} else if (event instanceof Stop) {
			this.run.val("Run")
			this.debug.val("Debug");
			setElementEnabled(this.run, true);
			setElementEnabled(this.debug, true);
			setElementEnabled(this.stepOver, false);
			setElementEnabled(this.stepInto, false);
			this.vm = null;
		} else if (event instanceof Step) {
			if (this.vm && this.vm.frames.length > 0) {
				this.selectedFrame = this.vm.frames[this.vm.frames.length - 1];
			}
		}

		this.renderState();
	}
}