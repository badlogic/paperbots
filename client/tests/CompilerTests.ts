import * as compiler from "../src/language/Compiler"
import * as assert from "assert"

describe("Compiler", () => {
	it("Should parse empty sources.", () => {
		let module = compiler.compile("  ", new compiler.ExternalFunctions());
		assert.equal(module.code.length, 1, "Expected $main().");
		assert.equal(module.code[0].instructions.length, 1);
	});
	it("Should parse numbers", () => {
		let module = compiler.compile("123 34.56", new compiler.ExternalFunctions());
		assert.equal(module.code.length, 1)
	});
});