import { SyntaxError, IFileRange, parse } from "./Parser";
import { Map, assertNever } from "../Utils"
import { Instruction, JumpIns, FunctionCode, AsyncPromise, LineInfo, ScopeInfo } from "./VirtualMachine";
import { Breakpoint } from "../widgets/Debugger";

export class CompilerError {
	constructor (public message: string, public location: IFileRange) { }
}

export interface Identifier {
	value: string
	location: IFileRange;
}

export interface BaseNode {
	location: IFileRange;
}

export interface Expression extends BaseNode {
	type: Type
}

export interface StringLiteral extends Expression {
	kind: "string",
	value: string
}

export interface BooleanLiteral extends Expression {
	kind: "boolean",
	value: boolean
}

export interface NumberLiteral extends Expression {
	kind: "number",
	value: number
}

export interface VariableAccess extends Expression {
	kind: "variableAccess",
	name: Identifier
}

export interface FunctionCall extends Expression {
	kind: "functionCall",
	name: Identifier,
	args: Array<Expression>
}

export interface FieldAccess extends Expression {
	kind: "fieldAccess",
	record: AstNode,
	name: string
}

export interface ArrayAccess extends Expression {
	kind: "arrayAccess",
	array: Expression,
	index: Expression
}

export interface UnaryOp extends Expression {
	kind: "unaryOp",
	operator: string,
	value: Expression
}

export interface BinaryOp extends Expression {
	kind: "binaryOp",
	operator: string,
	left: Expression,
	right: Expression
}

export interface If extends BaseNode {
	kind: "if",
	condition: Expression
	trueBlock: Array<AstNode>,
	falseBlock: Array<AstNode>
}

export interface While extends BaseNode {
	kind: "while",
	condition: Expression,
	block: Array<AstNode>
}

export interface Repeat extends BaseNode {
	kind: "repeat",
	count: Expression,
	block: Array<AstNode>
}

export interface Assignment extends BaseNode {
	kind: "assignment",
	id: Identifier,
	value: Expression
}

export interface TypeName {
	id: Identifier
}

export interface VariableDecl extends BaseNode {
	kind: "variable",
	name: Identifier,
	typeName?: TypeName,
	type: Type,
	value: Expression,
	slotIndex: number,
	scope: ScopeInfo
}

export interface RecordFieldDecl {
	name: Identifier,
	typeName: TypeName,
	type: Type,
}

export interface RecordDecl extends BaseNode {
	kind: "record",
	name: Identifier,
	fields: Array<RecordFieldDecl>,
	type: Type,
}

export interface Return extends BaseNode {
	kind: "return",
	value?: Expression
}

export interface Break extends BaseNode {
	kind: "break",
}

export interface Continue extends BaseNode {
	kind: "continue",
}

export interface FunctionDecl extends BaseNode {
	kind: "function",
	name: Identifier,
	params: Array<ParameterDecl>,
	returnTypeName?: TypeName,
	returnType?: Type,
	block: Array<AstNode>,
	type?: Type
}

export interface ParameterDecl {
	name: Identifier,
	typeName: TypeName,
	type: Type,
	slotIndex: number,
	scope: ScopeInfo
}

export interface Comment extends BaseNode {
	kind: "comment",
	value: string
}

type AstNode =
	|	StringLiteral
	|	BooleanLiteral
	|	NumberLiteral
	|	VariableAccess
	|	FunctionCall
	|	FieldAccess
	|	ArrayAccess
	|	UnaryOp
	|	BinaryOp
	|	If
	|	While
	|	Repeat
	|	Assignment
	|	VariableDecl
	|	RecordDecl
	|	FunctionDecl
	|	Return
	|	Break
	|	Continue
	|	Comment
	;

export interface BaseType {
	kind: string
	signature: string
}

export interface PrimitiveType extends BaseType {
	kind: "primitive"
	signature: string
}

export interface FunctionType extends BaseType {
	kind: "function"
	signature: string
	parameters: Array<Parameter>
	returnType: Type

	declarationNode?: FunctionDecl
}

export interface Parameter {
	name: string
	type: Type
}

export interface RecordType extends BaseType {
	kind: "record"
	signature: string
	fields: Array<Field>

	declarationNode?: RecordDecl
}

export interface Field {
	name: string
	type: Type
}

export interface ArrayType extends BaseType {
	kind: "array"
	// TODO Implement
}

export const NothingType: PrimitiveType = {
	kind: "primitive",
	signature: "nothing"
}

export const BooleanType: PrimitiveType = {
	kind: "primitive",
	signature: "boolean"
}

export const NumberType: PrimitiveType = {
	kind: "primitive",
	signature: "number"
}

export const StringType: PrimitiveType = {
	kind: "primitive",
	signature: "string"
};

export type Type = PrimitiveType | FunctionType | RecordType | ArrayType;

export interface Types {
	all: Map<Type>,
	functions: Map<FunctionType>,
	externalFunctions: Map<ExternalFunction>,
	records: Map<RecordType>;
}

export interface Module {
	types: Types,
	ast: Array<AstNode>,
	code: Array<FunctionCode>,
	externalFunctions: ExternalFunctions
}

class Scopes {
	scopes = new Array<Map<VariableDecl | ParameterDecl>>();
	nextSlotIndex = 0;

	constructor() { this.push(); }

	push() {
		this.scopes.push({});
	}

	pop() {
		this.scopes.pop();
	}

	findSymbol(id: Identifier): VariableDecl | ParameterDecl | null {
		let scopes = this.scopes;
		for (var i = scopes.length - 1; i >= 0; i--) {
			let scope = scopes[i]
			let symbol = scope[id.value];
			if (symbol) {
				return symbol;
			}
		}
		return null;
	}

	addSymbol(node: VariableDecl | ParameterDecl) {
		let scopes = this.scopes;
		for (var i = scopes.length - 1; i >= 0; i--) {
			let scope = scopes[i]
			let other = scope[node.name.value];
			if (other) {
				throw new CompilerError(`Variable ${node.name.value} already defined in line ${other.name.location.start.line}, column ${other.name.location.start.column}.`, node.name.location);
			}
		}
		node.slotIndex = this.nextSlotIndex++;
		scopes[scopes.length - 1][node.name.value] = node;
	}
}

export function moduleToJson(module: Module): string {
	return JSON.stringify(module, (key, value) => {
		if (key == "declarationNode") return undefined;
		if (key == "location") {
			let loc = value as IFileRange;
			return `${loc.start.line}:${loc.start.column} - ${loc.end.line}:${loc.end.column}`;
		}
		return value;
	}, 2);
}

export class ExternalFunctions {
	functions = new Array<ExternalFunction>();
	lookup: Map<ExternalFunction> = {};

	constructor() {
		let externals = this;
		externals.addFunction(
			"alert",
			[{name: "message", type: StringType}],
			NothingType,
			false,
			(message: string) => { alert(message); }
		)
		externals.addFunction(
			"alert",
			[{name: "value", type: NumberType}],
			NothingType,
			false,
			(value: string) => { alert(value); }
		)
		externals.addFunction(
			"alert",
			[{name: "value", type: BooleanType}],
			NothingType,
			false,
			(value: string) => { alert(value); }
		)
		externals.addFunction(
			"toString",
			[{name: "value", type: NumberType}],
			StringType,
			false,
			(value: string) => { return "" + value; }
		)
		externals.addFunction(
			"toString",
			[{name: "value", type: BooleanType}],
			StringType,
			false,
			(value: string) => { return "" + value; }
		)
		externals.addFunction(
			"length",
			[{name: "value", type: StringType}],
			NumberType,
			false,
			(value: string) => { return value.length; }
		)
		externals.addFunction(
			"charAt",
			[
				{name: "value", type: StringType},
				{name: "index", type: NumberType}
			],
			StringType,
			false,
			(value: string, index: number) => { return value.charAt(index); }
		)

		externals.addFunction(
			"pause",
			[{name: "milliSeconds", type: NumberType}],
			NumberType,
			true,
			(milliSeconds: number) => {
				let promise: AsyncPromise<number> = {
					completed: false,
					value: 0
				}
				setTimeout(() => {
					promise.value = milliSeconds;
					promise.completed = true;
				}, milliSeconds);
				return promise;
			}
		)
	}

	addFunction(name: string, args: Array<Parameter>, returnType: Type, async: boolean, fun: (...args: any[]) => any) {
		let index = this.functions.length;
		let extFun = new ExternalFunction(name, args, returnType, async, fun, index)
		this.functions.push(extFun);
		this.lookup[extFun.signature] = extFun;
	}
}

export class ExternalFunction {
	public readonly signature: string;

	constructor(public name: string, public args: Array<Parameter>, public returnType: Type, public async: boolean, public fun: (...args: any[]) => any, public index: number) {
		this.signature = name + "(" + args.map(arg => arg.type.signature).join(",") + ")";
	}
}

export function compile(input: string, externalFunctions: ExternalFunctions): Module {
	try {
		// parse source to an AST
		let ast = (parse(input));

		// separate the main program statements from
		// function and record declarations
		let functions = ast.filter(element => { return element.kind == "function" }) as Array<FunctionDecl>;
		let records = ast.filter(element => { return element.kind == "record" }) as Array<RecordDecl>;
		let mainStatements = ast.filter(element => { return element.kind != "function" && element.kind != "record" });
		let mainFunction:  FunctionDecl = {
			kind: "function",
			name: {
				location: {
					start: { line: 0, column: 0, offset: 0 },
					end: { line: 0, column: 0, offset: 0 }
				},
				value: "$main"
			},
			block: mainStatements,
			params: new Array(),
			returnType: NothingType,
			returnTypeName: null,
			location: {
				start: { line: 0, column: 0, offset: 0 },
				end: { line: 0, column: 0, offset: 0 }
			},
			type: null
		}
		functions.unshift(mainFunction);

		let types = typeCheck(functions, records, externalFunctions);
		let codes = emitProgram(functions, externalFunctions);

		return {
			code: codes,
			ast: ast,
			types: types,
			externalFunctions: externalFunctions
		}
	} catch (e) {
		var error = (e as SyntaxError);
		throw new CompilerError(error.message, error.location);
	}
}

function debug(msg: string) {
	throw new CompilerError(msg, nullLocation());
}

function nullLocation(): IFileRange {
	return {
		start: {
			line: 1,
			column: 1,
			offset: 0
		},
		end: {
			line: 1,
			column: 1,
			offset: 0
		}
	}
}

export function functionSignature(fun: FunctionDecl | FunctionCall): string {
	switch(fun.kind) {
		case "function":
			return fun.name.value + "(" + fun.params.map(param => param.typeName.id.value).join(",") + ")";
		case "functionCall":
			return fun.name.value + "(" + fun.args.map(arg => arg.type.signature).join(",") + ")";
	}
}

function typeCheck(functions: Array<FunctionDecl>, records: Array<RecordDecl>, externalFunctions: ExternalFunctions): Types {
	let types: Types = {
		all: {},
		functions: {},
		externalFunctions: {},
		records: {}
	}

	// register built-in types
	types.all[NothingType.signature] = NothingType;
	types.all[BooleanType.signature] = BooleanType;
	types.all[NumberType.signature] = NumberType;
	types.all[StringType.signature] = StringType;

	// gather all record and function types first and do some basic duplicate checking
	functions.forEach(fun => {
		let type: FunctionType = {
			kind: "function",
			signature: functionSignature(fun),
			parameters: [],
			returnType: NothingType,
			declarationNode: fun,
		}

		let other = types.functions[type.signature];
		if (other) {
			let otherLoc = other.declarationNode.location.start;
			throw new CompilerError(`Function '${other.signature}' already defined in line ${otherLoc.line}.`, fun.name.location);
		}

		if (externalFunctions.lookup[type.signature]) throw new CompilerError(`Function '${other.signature}' already defined externally.`, fun.name.location);

		fun.type = type;
		types.all[type.signature] = type;
		types.functions[type.signature] = type;
	});
	records.forEach(rec => {
		let type: Type = {
			kind: "record",
			fields: [],
			declarationNode: rec,
			signature: rec.name.value
		}

		let other = types.records[type.signature];
		if (other) {
			let otherLoc = other.declarationNode.location.start;
			throw new CompilerError(`Record '${other.signature}' already defined in line ${otherLoc.line}.`, rec.name.location);
		}

		rec.type = type;
		types.all[type.signature] = type;
		types.records[type.signature] = type;

		// create constructor function
		// TODO
	});

	externalFunctions.functions.forEach(fun => {
		types.externalFunctions[fun.signature] = fun;
	});

	for(let typeName in types.all) {
		let type = types.all[typeName];

		switch (type.kind) {
			// Assign function parameter types and return types, bail if a type is unknown
			// Also check duplicate parameter names
			case "function": {
				let decl = type.declarationNode;
				let func = type;
				if (decl == null) continue;

				// Check and assign parameter types
				let params: Map<ParameterDecl> = {};
				decl.params.forEach(param => {
					let otherParam = params[param.name.value];
					if (otherParam) {
						let otherLoc = otherParam.name.location.start;
						throw new CompilerError(`Duplicate parameter name '${param.name.value}' in function '${type.signature}, see line ${otherLoc.line}, column ${otherLoc.column}.`, param.name.location);
					}

					let paramType = types.all[param.typeName.id.value];
					if (!paramType) {
						throw new CompilerError(`Unknown type '${param.typeName.id.value}' for parameter '${param.name.value}' of function '${type.signature}.`, param.typeName.id.location);
					}
					func.parameters.push({name: param.name.value, type: paramType});
					param.type = paramType;
					params[param.name.value] = param;
				});

				// Check and assign return type
				let returnTypeName = decl.returnTypeName ? decl.returnTypeName.id.value : null;
				let returnType =  returnTypeName ? types.all[returnTypeName] : NothingType;
				if (!returnType) {
					throw new CompilerError(`Unknown return type '${returnTypeName}`, decl.returnTypeName.id.location);
				}
				func.returnType = returnType;
				decl.returnType = returnType;
				break;
			}
			case "record": {
				// Assign field types, bail if a type is unknown
				// Also check duplicate field names
				// TODO check for recursive types
				let decl = type.declarationNode;
				let rec = type;

				// Check and assign field types
				let fieldNames: Map<RecordFieldDecl> = {};
				decl.fields.forEach(field => {
					let otherField = fieldNames[field.name.value];
					if (otherField) {
						let otherLoc = otherField.name.location.start;
						throw new CompilerError(`Duplicate field name '${field.name.value}' in record '${type.signature}', see line ${otherLoc.line}, column ${otherLoc.column}.`, field.name.location);
					}

					let fieldType = types.all[field.typeName.id.value];
					if (!fieldType) {
						throw new CompilerError(`Unknown type '${field.typeName.id.value}' for field '${field.name.value}' of record '${type.signature}'.`, field.typeName.id.location);
					}
					rec.fields.push({name: field.name.value, type: type});
					field.type = type;
					fieldNames[field.name.value] = field;
				});
				break;
			}
		}
	}

	// We now have all function and record types figured out
	// time to traverse all main program and function statement blocks
	functions.forEach(node => typeCheckRec(node, types, new Scopes(), node, null));

	return types;
}

function typeCheckRec(node: AstNode, types: Types, scopes: Scopes, enclosingFun: FunctionDecl, enclosingLoop: While | Repeat) {
	switch(node.kind) {
		case "number":
			node.type = NumberType;
			break;

		case "boolean":
			node.type = BooleanType;
			break;

		case "string":
			node.type = StringType;
			break;

		case "unaryOp":
			typeCheckRec((node.value as AstNode), types, scopes, enclosingFun, enclosingLoop);
			switch(node.operator) {
				case "not":
					if (node.value.type != BooleanType) throw new CompilerError(`Operand of ${node.operator} operator is not a 'boolean', but a '${node.value.type.signature}'.`, node.value.location);
					node.type = BooleanType;
					break;
				case "-":
					if (node.value.type != NumberType) throw new CompilerError(`Operand of ${node.operator} operator is not a 'number', but a '${node.value.type.signature}'.`, node.value.location);
					node.type = NumberType;
					break;
				default:
					throw new CompilerError(`Unknown operator ${node.operator}.`, node.location);
			}
			break;

		case "binaryOp":
			typeCheckRec((node.left as AstNode), types, scopes, enclosingFun, enclosingLoop);
			typeCheckRec((node.right as AstNode), types, scopes, enclosingFun, enclosingLoop);
			switch (node.operator) {
				case "+":
				case "-":
				case "*":
				case "/":
					if (node.left.type != NumberType) throw new CompilerError(`Left operand of ${node.operator} operator is not a 'number', but a '${node.left.type.signature}'.`, node.left.location);
					if (node.right.type != NumberType) throw new CompilerError(`Right operand of ${node.operator} operator is not a 'number', but a '${node.right.type.signature}'.`, node.right.location);
					node.type = NumberType;
					break;
				case "..":
					if (node.left.type != StringType) throw new CompilerError(`Left operand of ${node.operator} operator is not a 'string', but a '${node.left.type.signature}'.`, node.left.location);
					if (node.right.type != StringType) throw new CompilerError(`Right operand of ${node.operator} operator is not a 'string', but a '${node.right.type.signature}'.`, node.right.location);
					node.type = StringType;
					break;
				case "<":
				case "<=":
				case ">":
				case ">=":
					if (node.left.type != NumberType) throw new CompilerError(`Left operand of ${node.operator} operator is not a 'number', but a '${node.left.type.signature}'.`, node.left.location);
					if (node.right.type != NumberType) throw new CompilerError(`Right operand of ${node.operator} operator is not a 'number', but a '${node.right.type.signature}'.`, node.right.location);
					node.type = BooleanType;
					break;
				case "==":
				case "!=":
					if (node.left.type != node.right.type) throw new CompilerError(`Can not compare a '${node.left.type.signature}' to a '${node.right.type.signature}'.`, node.location);
					node.type = BooleanType;
					break;
				case "and":
				case "or":
				case "xor":
					if (node.left.type != BooleanType) throw new CompilerError(`Left operand of ${node.operator} operator is not a 'boolean', but a '${node.left.type.signature}'.`, node.left.location);
					if (node.right.type != BooleanType) throw new CompilerError(`Right operand of ${node.operator} operator is not a 'boolean', but a '${node.right.type.signature}'.`, node.right.location);
					node.type = BooleanType;
					break;
				default:
					throw new CompilerError(`Unknown operator ${node.operator}.`, node.location);
			}
			break;

		case "if":
			typeCheckRec(node.condition as AstNode, types, scopes, enclosingFun, enclosingLoop);
			if (node.condition.type != BooleanType) throw new CompilerError(`Condition of if statement must be a 'boolean', but is a '${node.condition.type.signature}`, node.condition.location);
			scopes.push();
			node.trueBlock.forEach(child => typeCheckRec(child as AstNode, types, scopes, enclosingFun, enclosingLoop));
			scopes.pop();
			scopes.push();
			node.falseBlock.forEach(child => typeCheckRec(child as AstNode, types, scopes, enclosingFun, enclosingLoop));
			scopes.pop();
			break;

		case "while":
			typeCheckRec(node.condition as AstNode, types, scopes, enclosingFun, enclosingLoop);
			if (node.condition.type != BooleanType) throw new CompilerError(`Condition of while statement must be a 'boolean', but is a '${node.condition.type.signature}`, node.condition.location);
			scopes.push();
			node.block.forEach(child => typeCheckRec(child as AstNode, types, scopes, enclosingFun, node));
			scopes.pop();
			break;

		case "repeat":
			typeCheckRec(node.count as AstNode, types, scopes, enclosingFun, enclosingLoop);
			if (node.count.type != NumberType) throw new CompilerError(`Condition of repeat statement must be a 'number', but is a '${node.count.type.signature}`, node.count.location);
			scopes.push();
			node.block.forEach(child => typeCheckRec(child as AstNode, types, scopes, enclosingFun, node));
			scopes.pop();
			break;

		case "variable":
			typeCheckRec(node.value as AstNode, types, scopes, enclosingFun, enclosingLoop);
			if (node.typeName) {
				let type = types.all[node.typeName.id.value];
				if (!type) throw new CompilerError(`Unknown type '${node.typeName.id.value}' for variable '${node.name.value}'.`, node.typeName.id.location);
				if (type != node.value.type) throw new CompilerError(`Can't assign a value of type '${node.value.type.signature}' to variable '${node.name.value}' with type '${type.signature}.`, node.value.location);
				node.type = type;
			} else {
				node.type = node.value.type;
			}
			scopes.addSymbol(node);
			break;

		case "function":
			scopes.push();
			node.params.forEach(param => {
				scopes.addSymbol(param)
			});
			node.block.forEach(child => typeCheckRec(child as AstNode, types, scopes, enclosingFun, enclosingLoop));
			scopes.pop();
			break;
		case "assignment": {
			typeCheckRec(node.value as AstNode, types, scopes, enclosingFun, enclosingLoop);
			let symbol = scopes.findSymbol(node.id);
			if (!symbol) throw new CompilerError(`Can not find variable or parameter with name '${node.id.value}'.`, node.id.location);
			if (symbol.type != node.value.type) throw new CompilerError(`Can not assign a value of type '${node.value.type.signature}' to a variable of type '${symbol.type.signature}.`, node.location);
			break;
		}
		case "variableAccess": {
			let symbol = scopes.findSymbol(node.name);
			if (!symbol) throw new CompilerError(`Can not find variable or parameter with name '${node.name.value}'.`, node.name.location);
			node.type = symbol.type;
			break;
		}
		case "functionCall": {
			node.args.forEach(arg => typeCheckRec(arg as AstNode, types, scopes, enclosingFun, enclosingLoop));
			let signature = functionSignature(node);
			let funType = types.functions[signature];
			var returnType: Type;
			if (!funType) {
				let externalFun = types.externalFunctions[signature];
				if(!externalFun) throw new CompilerError(`Can not find function '${signature}'.`, node.location);
				returnType = externalFun.returnType;
			} else {
				returnType = (funType.declarationNode as FunctionDecl).returnType;
			}
			node.type = returnType;
			break;
		}
		case "record":
			throw new CompilerError(`Type checking of node type ${node.kind} implemented`, node.location);
		case "return":
			if (enclosingFun == null) {
				if (node.value) throw new CompilerError("Can not return a value from the main program.", node.location);
			} else {
				if (node.value) typeCheckRec(node.value as AstNode, types, scopes, enclosingFun, enclosingLoop);
				// function returns a value, but no value given
				if (enclosingFun.returnType != NothingType && !node.value) throw new CompilerError(`Function '${functionSignature(enclosingFun)}' must return a value of type '${enclosingFun.returnType.signature}'.`, node.location);
				// function returns no value, but value given
				if (enclosingFun.returnType == NothingType && node.value) throw new CompilerError(`Function '${functionSignature(enclosingFun)}' must not return a value.`, node.location);
				// function returns a value, value given, but type don't match
				if (enclosingFun.returnType != NothingType && node.value && enclosingFun.returnType != node.value.type) throw new CompilerError(`Function '${functionSignature(enclosingFun)}' must return a value of type '${enclosingFun.returnType.signature}', but a value of type '${node.value.type.signature}' is returned.`, node.location);
			}
			break;
		case "break":
		case "continue":
			if (!enclosingLoop) throw new CompilerError(`'${node.kind}' can only be used inside a 'while' or 'repeat' loop.`, node.location);
			break;
		case "comment":
			break;
		case "fieldAccess":
		case "arrayAccess":
			// TODO implement
			throw new CompilerError(`Field an array access not implemented yet.`, node.location);
		default:
			assertNever(node);
	}
}

class EmitterContext {
	scopes = new Scopes()
	continues = new Array<JumpIns>()
	breaks = new Array<JumpIns>()
	lineInfoIndex = 0

	constructor(public fun: FunctionCode, public functionLookup: Map<FunctionCode>, public externalFunctionLookup: Map<ExternalFunction>) { }
}

function emitProgram (functions: Array<FunctionDecl>, externalFunctions: ExternalFunctions): Array<FunctionCode> {
	let functionCodes = Array<FunctionCode>()
	let functionLookup: Map<FunctionCode> = {};

	functions.forEach(fun => {
		let funCode: FunctionCode = {
			ast: fun,
			instructions: new Array<Instruction>(),
			lineInfos: new Array<LineInfo>(),
			breakpoints: new Array<Breakpoint>(),
			locals: new Array<VariableDecl | ParameterDecl>(),
			numParameters: fun.params.length,
			index: functionCodes.length
		}
		functionCodes.push(funCode);
		functionLookup[functionSignature(fun as FunctionDecl)] = funCode;
	});

	functionCodes.forEach(fun => emitFunction(new EmitterContext(fun, functionLookup, externalFunctions.lookup)));
	return functionCodes;
}

function emitFunction(context: EmitterContext) {
	let fun = context.fun;
	let statements = fun.ast.block;
	let funDecl = fun.ast as FunctionDecl;
	funDecl.params.forEach(param => {
		context.scopes.addSymbol(param)
		fun.locals.push(param)
	});
	emitStatementList(statements, context);

	// if there's no return instruction at the end of the function, add one.
	if (fun.instructions.length == 0 || fun.instructions[fun.instructions.length - 1].kind != "return") {
		let lineInfo = fun.instructions.length > 0 ? context.fun.lineInfos[context.fun.instructions.length - 1] : null;
		context.fun.instructions.push({kind: "return"});
		if (lineInfo) context.fun.lineInfos.push(lineInfo);
		else emitLineInfo(context.fun.lineInfos, 0, context.fun.ast.location.start.line, 1);
	}

	// All parameters have scope from the beginning of the function to the end.
	funDecl.params.forEach(param => {
		param.scope = { startPc: 0, endPc: fun.instructions.length - 1 };
	})

	// All variable statements in the function's statement list also have scope
	// from after their initialization (set in emitAstNode) to the end of the function.
	assignScopeInfoEndPc(statements, fun.instructions.length - 1);

	// size the breakpoints array, filled with nulls
	fun.breakpoints.length = fun.instructions.length;
}

// Assign the endPc to the ScopeInfo of each Variable AST node in the
// list of statements.
function assignScopeInfoEndPc(statements: Array<AstNode>, endPc: number) {
	statements.forEach(stmt => {
		if (stmt.kind == "variable") {
			stmt.scope.endPc = endPc;
		}
	});
}

// Some "statements" like 12 * 23 may leave a value on the stack which
// we need to pop, while others like assignments or if/while/... do
// not. We thus need to know the statement boundaries to insert
// pop instructions when necessary
function emitStatementList (statements: Array<AstNode>, context: EmitterContext) {
	statements.forEach(stmt => {
		emitAstNode(stmt as AstNode, context, true);

		// Check if this is a node that leaves a value on the stack
		// so we can insert a pop
		switch(stmt.kind) {
			case "number":
			case "boolean":
			case "string":
			case "unaryOp":
			case "binaryOp":
			case "variableAccess":
			case "fieldAccess":
			case "arrayAccess":
				// all of the above leave a value on the stack
				// when used as a statement, so we insert a pop()
				let lineInfo = context.fun.lineInfos[context.fun.instructions.length - 1];
				emitLineInfo(context.fun.lineInfos, lineInfo.index, lineInfo.line, 1);
				context.fun.instructions.push({kind: "pop"});
				break;
			case "functionCall": {
				// function calls may leave a value on the stack if
				// they return a value.
				if (context.functionLookup[functionSignature(stmt)]) {
					let calledFun = context.functionLookup[functionSignature(stmt)].ast;
					if (calledFun.returnType && calledFun.returnType != NothingType) {
						let lineInfo = context.fun.lineInfos[context.fun.instructions.length - 1];
						emitLineInfo(context.fun.lineInfos, lineInfo.index, lineInfo.line, 1);
						context.fun.instructions.push({kind: "pop"});
					}
					break;
				} else {
					let calledFun = context.externalFunctionLookup[functionSignature(stmt)];
					if (calledFun.returnType && calledFun.returnType != NothingType) {
						let lineInfo = context.fun.lineInfos[context.fun.instructions.length - 1];
						emitLineInfo(context.fun.lineInfos, lineInfo.index, lineInfo.line, 1);
						context.fun.instructions.push({kind: "pop"});
					}
					break;
				}
			}
			case "if":
			case "while":
			case "repeat":
			case "variable":
			case "function":
			case "assignment":
			case "record":
			case "return":
			case "break":
			case "continue":
			case "comment":
				// none of these leave a value on the stack
				break;
			default:
				assertNever(stmt);
		}
	});
}

function emitAstNode(node: AstNode, context: EmitterContext, isStatement: boolean) {
	let fun = context.fun;
	let instructions = fun.instructions;
	let {functionLookup, scopes, externalFunctionLookup} = context;

	let lastInsIndex = instructions.length;
	let lineInfos = fun.lineInfos;

	switch(node.kind) {
		case "number":
		case "boolean":
		case "string":
			instructions.push({kind: "push", value: node.value});
			if(isStatement) emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
			break;
		case "binaryOp":
			emitAstNode(node.left as AstNode, context, false);
			emitAstNode(node.right as AstNode, context, false);
			if (node.operator == "..") instructions.push({kind: "stringConcat" });
			else instructions.push({kind: "binaryOp", operator: node.operator});
			if(isStatement) emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
			break;
		case "unaryOp":
			emitAstNode(node.value as AstNode, context, false);
			instructions.push({kind: "unaryOp", operator: node.operator});
			if(isStatement) emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
			break;
		case "variableAccess":
			instructions.push({kind: "load", slotIndex: context.scopes.findSymbol(node.name).slotIndex});
			if(isStatement) emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
			break;
		case "variable":
			fun.locals.push(node);
			scopes.addSymbol(node);
			emitAstNode(node.value as AstNode, context, false);
			instructions.push({kind: "store", slotIndex: node.slotIndex});
			node.scope = { startPc: instructions.length, endPc: 0 };
			emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
			break;
		case "assignment":
			emitAstNode(node.value as AstNode, context, false);
			instructions.push({kind: "store", slotIndex: context.scopes.findSymbol(node.id).slotIndex});
			emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
			break;
		case "functionCall":
			// push all arguments onto the stack, left to right
			node.args.forEach(arg => emitAstNode(arg as AstNode, context, false));

			// Either the function is a function inside the program, or an external function
			if (functionLookup[functionSignature(node)]) {
				instructions.push({kind: "call", functionIndex: functionLookup[functionSignature(node)].index});
			} else {
				let externalFun = externalFunctionLookup[functionSignature(node)];
				instructions.push({kind: "callExt", functionIndex: externalFun.index });
			}
			if(isStatement) emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
			break;
		case "if":
			emitAstNode(node.condition as AstNode, context, false);

			// Setup jumps. There's a boolean value on the top of the stack
			// for the conditional which will be consumed by jumpIfFalse
			let jumpToFalse: Instruction = { kind: "jumpIfFalse", offset: 0 };
			let jumpPastFalse: Instruction = { kind: "jump", offset: 0 };
			instructions.push(jumpToFalse);
			emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
			context.lineInfoIndex++;

			// Emit the true block and a jump to after the false block
			scopes.push();
			emitStatementList(node.trueBlock, context);
			scopes.pop()
			assignScopeInfoEndPc(node.trueBlock, instructions.length - 1);
			instructions.push(jumpPastFalse);
			lineInfos.push(lineInfos[lineInfos.length - 1]);
			context.lineInfoIndex++;

			// Patch in the address of the first instruction of the false block
			jumpToFalse.offset = instructions.length;

			// Emit the false block
			scopes.push();
			emitStatementList(node.falseBlock, context);
			scopes.pop()
			assignScopeInfoEndPc(node.falseBlock, instructions.length - 1);

			// Patch in the address of the first instruction after the false block
			jumpPastFalse.offset = instructions.length;
			break;
		case "while":
			// save the index of the start of the condition code
			let conditionIndex = instructions.length;

			// emit the condition and setup a jump to after
			// the while block.
			emitAstNode(node.condition as AstNode, context, false);
			let jumpPastBlock: Instruction = { kind: "jumpIfFalse", offset: 0 };
			instructions.push(jumpPastBlock);
			emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
			context.lineInfoIndex++;

			scopes.push();
			emitStatementList(node.block, context);
			scopes.pop();
			assignScopeInfoEndPc(node.block, instructions.length - 1);

			// Patch up all continues to jump to the loop header
			context.continues.forEach(cont => cont.offset = conditionIndex);
			context.continues.length = 0

			// Emit jump to the loop header
			instructions.push({ kind: "jump", offset: conditionIndex });
			lineInfos.push(lineInfos[conditionIndex]);

			// Patch in the address of the first instruction after the loop body
			jumpPastBlock.offset = instructions.length;

			// Patch up all continues to go to the first instruction after the loop body
			context.breaks.forEach(br => br.offset = instructions.length);
			context.breaks.length = 0;
			break;
		case "repeat": {
			// Emit the count, which leaves a value on the stack
			emitAstNode(node.count as AstNode, context, false);

			// Emit check for count >= 0: duplicate count,
			// push 0, compare, jump past block if false.
			let conditionIndex = instructions.length;
			instructions.push({ kind: "dup"})
			instructions.push({ kind: "push", value: 0 });
			instructions.push({ kind: "binaryOp", operator: ">" });
			let jumpPastBlock: Instruction = { kind: "jumpIfFalse", offset: 0};
			instructions.push(jumpPastBlock);

			emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
			let headerLineInfo = lineInfos[lineInfos.length - 1];
			context.lineInfoIndex++;

			scopes.push();
			emitStatementList(node.block, context);
			scopes.pop();
			assignScopeInfoEndPc(node.block, instructions.length - 1);

			// Patch up all continues to go to the next jump instruction, and
			// thus to the loop header.
			context.continues.forEach(cont => cont.offset = instructions.length);
			context.continues.length = 0

			// decrease the count and jump to the loop header
			lineInfos.push(lineInfos[conditionIndex]);
			lineInfos.push(lineInfos[conditionIndex]);
			lineInfos.push(lineInfos[conditionIndex]);
			instructions.push({ kind: "push", value: 1});
			instructions.push({ kind: "binaryOp", operator: "-" });
			instructions.push({ kind: "jump", offset: conditionIndex });

			// Patch in the address of the first instruction after the loop body
			jumpPastBlock.offset = instructions.length;

			// Patch up all continues to go to the first instruction after the loop body
			context.breaks.forEach(br => br.offset = instructions.length);
			context.breaks.length = 0;

			// Remove the count from the
			instructions.push({ kind: "pop" });
			lineInfos.push(headerLineInfo);
			break;
		}
		case "return":
			if (node.value) emitAstNode(node.value as AstNode, context, false);
			instructions.push({ kind: "return" });
			emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
			break;
		case "break":
			// this is patched in the emission of while and repeat
			let breakIns: Instruction = { kind: "jump", offset: 0 };
			instructions.push(breakIns);
			context.breaks.push(breakIns);
			emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
			break;
		case "continue":
			// this is patched in the emission of while and repeat
			let continueIns: Instruction = { kind: "jump", offset: 0 };
			instructions.push(continueIns);
			context.continues.push(continueIns);
			emitLineInfo(lineInfos, context.lineInfoIndex, node.location.start.line, instructions.length - lastInsIndex);
			break;
		case "record":
		case "function":
			// No code emission for function and type declarations
			// this path should never be hit.
			throw new CompilerError("Hit emission for record or function. This should never happen.", node.location);
		case "comment":
			break;
		case "fieldAccess":
		case "arrayAccess":
			// TODO implement
			throw new CompilerError(`Field an array access not implemented yet.`, node.location);
		default:
			assertNever(node);
	}

	if(isStatement) context.lineInfoIndex++;
}

function emitLineInfo(lineInfos: Array<LineInfo>, lineInfoIndex: number, sourceLine: number, numIns: number) {
	let lineInfo: LineInfo = { index: lineInfoIndex, line: sourceLine };
	while(numIns-- > 0) {
		lineInfos.push(lineInfo);
	}
}