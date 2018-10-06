import {SyntaxError, IFileRange, parse} from "./Parser";

export class CompilerError {
	constructor (public message: string, public location: IFileRange) { }
}

function assertNever(x: never): never {
	throw new Error("This should never happen");
}

export interface Identifier {
	value: string
	location: IFileRange;
}

export interface BaseNode {
	location: IFileRange;
}

export interface Expression extends BaseNode {
	type: Type;
}

export interface Statement extends BaseNode {}

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

export interface If extends Statement {
	kind: "if",
	condition: Expression
	trueBlock: Array<Statement>,
	falseBlock: Array<Statement>
}

export interface While extends Statement {
	kind: "while",
	condition: Expression,
	block: Array<Statement>
}

export interface Repeat extends Statement {
	kind: "repeat",
	count: Expression,
	block: Array<Statement>
}

export interface Assignment extends Statement {
	kind: "assignment",
	id: Identifier,
	value: Expression
}

export interface TypeName {
	id: Identifier
}

export interface VariableDecl extends Statement {
	kind: "variable",
	name: Identifier,
	typeName?: TypeName,
	type?: Type,
	value: Expression
}

export interface RecordField {
	name: Identifier,
	typeName: TypeName,
	type?: Type,
}

export interface RecordDecl extends Statement {
	kind: "record",
	name: Identifier,
	fields: Array<RecordField>,
	type?: Type,
}

export interface Parameter {
	name: Identifier,
	typeName: TypeName,
	type?: Type,
}

export interface FunctionDecl extends Statement {
	kind: "function",
	name: Identifier,
	params: Array<Parameter>,
	returnTypeName?: TypeName,
	returnType?: Type,
	block: Array<Statement>
}

type AstNode =
	|	StringLiteral
	|	BooleanLiteral
	|	NumberLiteral
	|	VariableAccess
	|	FunctionCall
	|	UnaryOp
	|	BinaryOp
	|	If
	|	While
	|	Repeat
	|	Assignment
	|	VariableDecl
	|	RecordDecl
	|	FunctionDecl
	;

export interface Type {
	declarationNode?: RecordDecl | FunctionDecl
	name: string
}

export const NothingType: Type = {
	declarationNode: null,
	name: "nothing"
}

export const BooleanType: Type = {
	declarationNode: null,
	name: "boolean"
}

export const NumberType: Type = {
	declarationNode: null,
	name: "number"
}

export const StringType: Type = {
	declarationNode: null,
	name: "string"
};

export interface Map<T> {
	[name: string] : T;
}

export interface Types {
	all: Map<Type>,
	functions: Map<Type>,
	records: Map<Type>;
}

export interface Module {
	// types: Types
	ast: Array<AstNode>,
}

export function compile(input: string): Module {
	try {
		// parse source to an AST
		let ast = (parse(input) as Array<AstNode>);

		// separate the main program statements from
		// function and record declarations
		let functions = ast.filter(element => { return element.kind == "function" }) as Array<FunctionDecl>;
		let records = ast.filter(element => { return element.kind == "record" }) as Array<RecordDecl>;
		let mainProgram = ast.filter(element => { return element.kind != "function" && element.kind != "record" });

		let types = typeCheck(functions, records, mainProgram);
		return {
			ast: ast
		}
	} catch (e) {
		var error = (e as SyntaxError);
		throw new CompilerError(error.message, error.location);
	}
}

function debug(msg: string) {
	throw new CompilerError(msg, null);
}

function functionSignature(fun: FunctionDecl): string {
	return fun.name.value + "(" + fun.params.map(param => param.typeName.id.value).join(",") + ")";
}

function typeCheck(functions: Array<FunctionDecl>, records: Array<RecordDecl>, main: Array<AstNode>): Types {
	let types: Types = {
		all: {},
		functions: {},
		records: {}
	}

	// register built-in types
	types.all[NothingType.name] = NothingType;
	types.all[BooleanType.name] = BooleanType;
	types.all[NumberType.name] = NumberType;
	types.all[StringType.name] = StringType;

	// gather all record and function types first and do some basic duplicate checking
	functions.forEach(fun => {
		let type: Type = {
			declarationNode: fun,
			name: functionSignature(fun)
		}

		let other = types.all[type.name];
		if (other) {
			let otherLoc = other.declarationNode.location.start;
			throw new CompilerError(`Function '${other.name}' already defined in line ${otherLoc.line}.`, fun.name.location);
		}

		types.all[type.name] = type;
		types.functions[type.name] = type;
	});
	records.forEach(rec => {
		let type: Type = {
			declarationNode: rec,
			name: rec.name.value
		}

		let other = types.all[type.name];
		if (other) {
			let otherLoc = other.declarationNode.location.start;
			throw new CompilerError(`Record '${other.name}' already defined in line ${otherLoc.line}.`, rec.name.location);
		}

		types.all[type.name] = type;
		types.records[type.name] = type;
	});


	for(let typeName in types.all) {
		let type = types.all[typeName];

		// Assign function parameter types and return types, bail if a type is unknown
		// Also check duplicate parameter names
		if (type.declarationNode && type.declarationNode.kind == "function") {
			let decl = type.declarationNode;

			// Check and assign parameter types
			let paramNames: Map<Parameter> = {};
			decl.params.forEach(param => {
				let otherParam = paramNames[param.name.value];
				if (otherParam) {
					let otherLoc = otherParam.name.location.start;
					throw new CompilerError(`Duplicate parameter name '${param.name.value}' in function '${type.name}, see line ${otherLoc.line}, column ${otherLoc.column}.`, param.name.location);
				}

				let paramType = types.all[param.typeName.id.value];
				if (!paramType) {
					throw new CompilerError(`Unknown type '${param.typeName.id.value}' for parameter '${param.name.value}' of function '${type.name}.`, param.typeName.id.location);
				}
				param.type = paramType;
				paramNames[param.name.value] = param;
			});

			// Check and assign return type
			let returnTypeName = decl.returnTypeName ? decl.returnTypeName.id.value : null;
			let returnType =  returnTypeName ? types.all[returnTypeName] : NothingType;
			if (!returnType) {
				throw new CompilerError(`Unknown return type '${returnTypeName}`, decl.returnTypeName.id.location);
			}
			// decl.returnType = returnType;
		}

		// Assign field types, bail if a type is unknown
		// Also check duplicate field names
		// TODO check for recursive types
		else if (type.declarationNode && type.declarationNode.kind == "record") {
			let decl = type.declarationNode;

			// Check and assign field types
			let fieldNames: Map<RecordField> = {};
			decl.fields.forEach(field => {
				let otherField = fieldNames[field.name.value];
				if (otherField) {
					let otherLoc = otherField.name.location.start;
					throw new CompilerError(`Duplicate field name '${field.name.value}' in record '${type.name}', see line ${otherLoc.line}, column ${otherLoc.column}.`, field.name.location);
				}

				let fieldType = types.all[field.typeName.id.value];
				if (!fieldType) {
					throw new CompilerError(`Unknown type '${field.typeName.id.value}' for field '${field.name.value}' of record '${type.name}'.`, field.typeName.id.location);
				}
				// field.type = type;
				fieldNames[field.name.value] = field;
			});
		}
	}

	// We now have all function and record types figured out
	// time to traverse all main program and function statement blocks
	// TODO implement this :D
	main.forEach(node => typeCheckRec(node));

	return types;
}

function typeCheckRec(node: AstNode) {
	if(node.kind == "number") {
		node.type = NumberType;
	} else if (node.kind == "boolean") {
		node.type = BooleanType;
	} else if (node.kind == "string") {
		node.type = StringType;
	} else if (node.kind == "unaryOp") {
		typeCheckRec((node.value as AstNode));
		switch(node.operator) {
			case "not":
				if (node.value.type != BooleanType) throw new CompilerError(`Operand of ${node.operator} operator is not a 'boolean', but a '${node.value.type.name}'.`, node.value.location);
				node.type = BooleanType;
				break;
			case "-":
				if (node.value.type != NumberType) throw new CompilerError(`Operand of ${node.operator} operator is not a 'number', but a '${node.value.type.name}'.`, node.value.location);
				node.type = NumberType;
				break;
			default:
				throw new CompilerError(`Unknown operator ${node.operator}.`, node.location);
		}
	} else if (node.kind == "binaryOp") {
		typeCheckRec((node.left as AstNode));
		typeCheckRec((node.right as AstNode));
		switch (node.operator) {
			case "+":
			case "-":
			case "*":
			case "/":
			if (node.left.type != NumberType) throw new CompilerError(`Left operand of ${node.operator} operator is not a 'number', but a '${node.left.type.name}'.`, node.left.location);
			if (node.right.type != NumberType) throw new CompilerError(`Right operand of ${node.operator} operator is not a 'number', but a '${node.right.type.name}'.`, node.right.location);
				node.type = NumberType;
				break;
			case "<":
			case "<=":
			case ">":
			case ">=":
				if (node.left.type != NumberType) throw new CompilerError(`Left operand of ${node.operator} operator is not a 'number', but a '${node.left.type.name}'.`, node.left.location);
				if (node.right.type != NumberType) throw new CompilerError(`Right operand of ${node.operator} operator is not a 'number', but a '${node.right.type.name}'.`, node.right.location);
				node.type = BooleanType;
				break;
			case "==":
			case "!=":
				if (node.left.type != node.right.type) throw new CompilerError(`Can not compare a '${node.left.type.name}' to a '${node.right.type.name}'.`, node.location);
				break;
			case "and":
			case "or":
			case "xor":
				if (node.left.type != BooleanType) throw new CompilerError(`Left operand of ${node.operator} operator is not a 'boolean', but a '${node.left.type.name}'.`, node.left.location);
				if (node.right.type != BooleanType) throw new CompilerError(`Right operand of ${node.operator} operator is not a 'boolean', but a '${node.right.type.name}'.`, node.right.location);
				node.type = BooleanType;
				break;
			default:
				throw new CompilerError(`Unknown operator ${node.operator}.`, node.location);
		}
	} else if (node.kind == "variableAccess") {
		throw new CompilerError(`Variable access type checking has not been implemented yet.`, node.location);
	} else if (node.kind == "functionCall") {
		throw new CompilerError(`Function call type checking has not been implemented yet.`, node.location);
	} else if (node.kind == "if") {
		typeCheckRec(node.condition as AstNode);
		if (node.condition.type != BooleanType) throw new CompilerError(`Condition of if statement must be a 'boolean', but is a '${node.condition.type.name}`, node.condition.location);
		node.trueBlock.forEach(child => typeCheckRec(child as AstNode));
		node.falseBlock.forEach(child => typeCheckRec(child as AstNode));
	} else if (node.kind == "while") {
		typeCheckRec(node.condition as AstNode);
		if (node.condition.type != BooleanType) throw new CompilerError(`Condition of while statement must be a 'boolean', but is a '${node.condition.type.name}`, node.condition.location);
		node.block.forEach(child => typeCheckRec(child as AstNode));
	} else if (node.kind == "repeat") {
		typeCheckRec(node.count as AstNode);
		if (node.count.type != NumberType) throw new CompilerError(`Condition of repeat statement must be a 'number', but is a '${node.count.type.name}`, node.count.location);
		node.block.forEach(child => typeCheckRec(child as AstNode));
	}
}

