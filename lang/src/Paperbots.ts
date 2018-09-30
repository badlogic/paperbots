import {SyntaxError, parse} from "./Parser";

export module paperbots {
	export class Compiler {
		parse(input: string) {
			return parse(input);
		}
	}
}