import { VariableDecl, ParameterDecl, FunctionDecl, ExternalFunction, ExternalFunctions, NothingType } from "./Compiler";
import { assertNever } from "../Utils";
import { Breakpoint } from "../widgets/Debugger";

type Value = boolean | string | number;

export interface PushIns {
	kind: "push"
	value: Value
}

export interface PopIns {
	kind: "pop"
}

export interface StringConcatOpIns {
	kind: "stringConcat"
}

export interface BinaryOpIns {
	kind: "binaryOp"
	operator: string
}

export interface UnaryOpIns {
	kind: "unaryOp"
	operator: string
}

export interface LoadIns {
	kind: "load"
	slotIndex: number
}

export interface StoreIns {
	kind: "store"
	slotIndex: number
}

export interface LoadFieldIns {
	kind: "loadField"
	fieldIndex: number
}

export interface StoreFieldIns {
	kind: "storeField"
	fieldIndex: number
}

export interface CallIns {
	kind: "call"
	functionIndex: number
}

export interface CallExternalIns {
	kind: "callExt"
	functionIndex: number
}

export interface JumpIfTrueIns {
	kind: "jumpIfTrue"
	offset: number
}

export interface JumpIfFalseIns {
	kind: "jumpIfFalse"
	offset: number
}

export interface JumpIns {
	kind: "jump"
	offset: number
}

export interface ReturnIns {
	kind: "return"
}

export interface DupIns {
	kind: "dup"
}

export type Instruction =
		PushIns
	|	PopIns
	|	BinaryOpIns
	|	StringConcatOpIns
	|	UnaryOpIns
	|	LoadIns
	|	StoreIns
	|	LoadFieldIns
	|	StoreFieldIns
	| 	CallIns
	|	CallExternalIns
	|	JumpIfTrueIns
	|	JumpIfFalseIns
	|	JumpIns
	|	ReturnIns
	|	DupIns
	;

export class Slot {
	constructor(public symbol: VariableDecl | ParameterDecl, public scope: ScopeInfo, public value: Value) { }
}

export interface ScopeInfo {
	startPc: number;
	endPc: number;
}

export interface LineInfo {
	index: number;
	line: number;
}

export interface FunctionCode {
	ast: FunctionDecl,
	locals: Array<VariableDecl | ParameterDecl>,
	numParameters: number,
	instructions: Array<Instruction>,
	lineInfos: Array<LineInfo>,
	breakpoints: Array<Breakpoint>;
	index: number
}

export class Frame {
	constructor(
		public code: FunctionCode,
		public slots = new Array<Slot>(),
		public pc = 0) {

		code.locals.forEach(v => slots.push(new Slot(v, v.scope, null)));
	}
}

export interface AsyncPromise<T> {
	completed: boolean;
	value: T;
}

export enum VMState {
	Running,
	Completed
}

/**
 * Returned by VirtualMachine#stepOver in case
 * an async function is being called. The caller
 * needs to then give control back to the UI thread
 * and call stepOver again with this snapshot, until null is returned.
 */
export interface StepOverSnapshot {
	frameIndex: number,
	frame: Frame,
	lineInfoIndex: number
}

export class VirtualMachine {
	state = VMState.Running;
	frames = Array<Frame>();
	stack = Array<Value>();
	asyncFun: ExternalFunction;
	asyncPromise: AsyncPromise<any>;

	constructor(public functions: Array<FunctionCode>, public externalFunctions: ExternalFunctions) {
		this.restart();
	}

	restart () {
		this.frames.push(new Frame(this.functions[0]));
		this.state = VMState.Running;
	}

	run(numInstructions: number) {
		if (this.frames.length == 0) this.state = VMState.Completed;
		if (this.state == VMState.Completed) return;

		if (this.asyncPromise) {
			if (this.asyncPromise.completed) {
				if (this.asyncFun.returnType != NothingType) {
					this.stack.push(this.asyncPromise.value);
				}
				this.asyncPromise = null;
				this.asyncFun = null;
			}
		}

		while(!this.asyncPromise && numInstructions-- > 0) {
			this.step();
			if (this.hitBreakpoint()) break;
		}

		if (this.frames.length == 0) this.state = VMState.Completed;
	}

	hitBreakpoint() {
		if (this.frames.length == 0) return false;
		let frame = this.frames[this.frames.length - 1];
		let pc = frame.pc
		return frame.code.breakpoints[pc] != null;
	}


	stepOver (lastSnapshot: StepOverSnapshot = null): StepOverSnapshot {
		if (this.frames.length == 0) this.state = VMState.Completed;
		if (this.state == VMState.Completed) return null;

		if (this.asyncPromise) {
			if (this.asyncPromise.completed) {
				if (this.asyncFun.returnType != NothingType) {
					this.stack.push(this.asyncPromise.value);
				}
				this.asyncPromise = null;
				this.asyncFun = null;
			}
		}

		let frameIndex = lastSnapshot ? lastSnapshot.frameIndex : this.frames.length - 1;
		let frame = lastSnapshot ? lastSnapshot.frame : this.frames[frameIndex];
		let lineInfoIndex = lastSnapshot ? lastSnapshot.lineInfoIndex : frame.code.lineInfos[frame.pc].index;
		let snapshot: StepOverSnapshot = {
			frameIndex: frameIndex,
			frame: frame,
			lineInfoIndex: lineInfoIndex
		}
		var executed = 0;
		while(true) {
			if (this.asyncPromise)
				return snapshot;
			if (this.frames.length == 0) {
				this.state = VMState.Completed;
				return null;
			}
			if (executed++ > 1000)
				return snapshot;

			let currFrameIndex = this.frames.length - 1;
			let currFrame = this.frames[currFrameIndex];
			let currLineInfoIndex = currFrame.code.lineInfos[currFrame.pc].index;

			if (currFrameIndex == frameIndex)
				if (lineInfoIndex != currLineInfoIndex)
					return null;

			if (currFrameIndex < frameIndex)
				return null;

			this.step();
			if (this.hitBreakpoint()) break;
		}
	}

	stepInto () {
		if (this.frames.length == 0) this.state = VMState.Completed;
		if (this.state == VMState.Completed) return;

		if (this.asyncPromise) {
			if (this.asyncPromise.completed) {
				if (this.asyncFun.returnType != NothingType) {
					this.stack.push(this.asyncPromise.value);
				}
				this.asyncPromise = null;
				this.asyncFun = null;
			}
		}

		let frameIndex = this.frames.length - 1;
		let frame = this.frames[frameIndex];
		let lineInfoIndex = frame.code.lineInfos[frame.pc].index;
		while(true) {
			if (this.asyncPromise) return;
			if (this.frames.length == 0) return;

			let currFrameIndex = this.frames.length - 1;
			let currFrame = this.frames[currFrameIndex];
			let currLineInfoIndex = currFrame.code.lineInfos[currFrame.pc].index;

			if (lineInfoIndex != currLineInfoIndex) return;
			if (currFrameIndex != frameIndex) return;

			this.step();
			if (this.hitBreakpoint()) break;
		}

		if (this.frames.length == 0) this.state = VMState.Completed;
		if (this.state == VMState.Completed) return;
	}

	getLineNumber() {
		if (this.frames.length == 0) this.state = VMState.Completed;
		if (this.state == VMState.Completed) return -1;

		let frameIndex = this.frames.length - 1;
		let frame = this.frames[frameIndex];
		return frame.code.lineInfos[frame.pc].line;
	}

	private step() {
		let {frames, stack, functions, externalFunctions} = this;

		if (frames.length == 0) {
			this.state = VMState.Completed;
			return;
		}

		let frame = frames[frames.length - 1];
		let ins = frame.code.instructions[frame.pc];
		frame.pc++;
		switch(ins.kind) {
			case "pop":
				stack.pop();
				break;
			case "push":
				stack.push(ins.value);
				break;
			case "dup":
				let value = stack.pop();
				stack.push(value);
				stack.push(value);
				break;
			case "store":
				frame.slots[ins.slotIndex].value = stack.pop();
				break;
			case "load":
				stack.push(frame.slots[ins.slotIndex].value);
				break;
			case "storeField": {
				let rec = stack.pop();
				rec[ins.fieldIndex] = stack.pop()
				break;
			}
			case "loadField": {
				let rec = stack.pop()
				stack.push(rec[ins.fieldIndex]);
				break;
			}
			case "jump":
				frame.pc = ins.offset;
				break;
			case "jumpIfTrue":
				if(stack.pop()) frame.pc = ins.offset;
				break;
			case "jumpIfFalse":
				if(!stack.pop()) frame.pc = ins.offset;
				break;
			case "call": {
				let fun = functions[ins.functionIndex];
				let newFrame = new Frame(fun);
				newFrame.slots.length = fun.locals.length;
				for (var i = fun.numParameters - 1; i >= 0 ; i--) {
					newFrame.slots[i].value = stack.pop();
				}
				frames.push(newFrame);
				break;
			}
			case "callExt": {
				let fun = externalFunctions.functions[ins.functionIndex];
				let extArgs = new Array(fun.parameters.length);
				for (var i = extArgs.length - 1; i >= 0 ; i--) {
					extArgs[i] = stack.pop();
				}
				let result = fun.fun.apply(fun.fun, extArgs);
				if (fun.async) {
					this.asyncFun = fun;
					this.asyncPromise = result as AsyncPromise<any>;
				} else {
					if (fun.returnType != NothingType) {
						stack.push(result);
					}
				}
				break;
			}
			case "return":
				frames.pop();
				break
			case "unaryOp": {
				let value = stack.pop() as boolean;
				switch(ins.operator) {
					case "not":
						stack.push(!value);
						break;
					case "-":
						stack.push(-value);
						break;
					default:
						// TODO: throw a nice error for this impossible case
						throw new Error(`Unknown unary operator ${ins.operator}`, )
				}
				break;
			}
			case "stringConcat": {
				let right = stack.pop();
				let left = stack.pop();
				stack.push((left as string) + (right as string));
				break;
			}
			case "binaryOp": {
				let right = stack.pop();
				let left = stack.pop();

				switch(ins.operator) {
					case "+":
						stack.push((left as number) + (right as number));
						break;
					case "-":
						stack.push((left as number) - (right as number));
						break;
					case "*":
						stack.push((left as number) * (right as number));
						break;
					case "/":
						stack.push((left as number) / (right as number));
						break;
					case "<=":
						stack.push((left as number) <= (right as number));
						break;
					case ">=":
						stack.push((left as number) >= (right as number));
						break;
					case "<":
						stack.push((left as number) < (right as number));
						break;
					case ">":
						stack.push((left as number) > (right as number));
						break;
					case "==":
						stack.push(left === right);
						break;
					case "!=":
						stack.push(left !== right);
						break;
					case "and":
						stack.push(left as boolean && right as boolean);
						break;
					case "or":
						stack.push(left as boolean || right as boolean);
						break;
					case "xor":
						stack.push(!(left as boolean && right as boolean));
						break;
				}

				break;
			}
			default:
				assertNever(ins);
		}
	}
}