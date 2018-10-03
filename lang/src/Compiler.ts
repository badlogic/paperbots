import {SyntaxError, IFileRange, parse} from "./Parser";

export class CompilerError {
	constructor (public message: string, public location: IFileRange) { }
}

export class Compiler {
	parse(input: string) {
		try {
			return parse(input);
		} catch (e) {
			var error = (e as SyntaxError);
			throw new CompilerError(error.message, error.location);
		}
	}
}