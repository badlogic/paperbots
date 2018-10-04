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

export interface Expression extends BaseNode {}

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
	value: Expression
}

export interface RecordField {
	name: Identifier,
	typeName: TypeName,
}

export interface RecordDecl extends Statement {
	kind: "record",
	name: Identifier,
	fields: Array<RecordField>
}

export interface Parameter {
	name: Identifier,
	typeName: TypeName
}

export interface FunctionDecl extends Statement {
	kind: "function",
	name: Identifier,
	params: Array<Parameter>,
	returnTypeName?: TypeName,
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

export const StringType: Type = {
	declarationNode: null,
	name: "string"
};

export const BooleanType: Type = {
	declarationNode: null,
	name: "boolean"
}

export const NumberType: Type = {
	declarationNode: null,
	name: "number"
}

export class Compiler {
	parse(input: string) {
		try {
			let ast = (parse(input) as Array<AstNode>);
			return ast;
		} catch (e) {
			var error = (e as SyntaxError);
			throw new CompilerError(error.message, error.location);
		}
	}
}

