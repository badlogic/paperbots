import * as compiler from "../src/language/Compiler"
import * as assert from "assert"
import { PopIns, PushIns } from "../src/language/VirtualMachine";

describe("Compiler", () => {
	it("Should parse empty sources and create $main():nothing.", () => {
		let module = compiler.compile("  \n \n\n", new compiler.ExternalFunctionsTypesConstants());
		console.log(compiler.moduleToString(module));
		assert.equal(module.functions.length, 1, "Expected $main().");
		assert.equal(module.functions[0].instructions.length, 1, "Expected one instruction, return.");
		assert.equal(module.functions[0].instructions[0].kind, "return", "Expected return instruction.");
	});
	it("Should parse numbers and push/pop them to/from the stack.", () => {
		let module = compiler.compile("123 34.56 0.004", new compiler.ExternalFunctionsTypesConstants());
		console.log(compiler.moduleToString(module));
		assert.equal(module.functions.length, 1)
		assert.equal(module.functions[0].instructions.length, 7, "Expected 7 instructions.");

		let instructions = module.functions[0].instructions;
		[123, 34.56, 0.004].forEach((n, index) => {
			let push = instructions[index * 2] as PushIns;
			let pop = instructions[index * 2 + 1] as PopIns;
			assert.equal(push.value, n, "Pushed value incorrect.");
			assert.equal(pop.kind, "pop", "No pop found.");
		});

		assert.equal(instructions[instructions.length - 1].kind, "return", "Expected a return instruction.");
	});
	it("Should parse booleans and push/pop them to/from the stack.", () => {
		let module = compiler.compile("true false", new compiler.ExternalFunctionsTypesConstants());
		console.log(compiler.moduleToString(module));
		assert.equal(module.functions.length, 1)
		assert.equal(module.functions[0].instructions.length, 5, "Expected 5 instructions.");

		let instructions = module.functions[0].instructions;
		[true, false].forEach((n, index) => {
			let push = instructions[index * 2] as PushIns;
			let pop = instructions[index * 2 + 1] as PopIns;
			assert.equal(push.value, n, "Pushed value incorrect.");
			assert.equal(pop.kind, "pop", "No pop found.");
		});

		assert.equal(instructions[instructions.length - 1].kind, "return", "Expected a return instruction.");
	});
	it("Should parse strings, handles escape sequences, and push/pop them to/from the stack.", () => {
		let module = compiler.compile(`"Hello world" "🔥 💕 🎁 💯 🌹" "\\n\\t\\\"" 'test'`, new compiler.ExternalFunctionsTypesConstants());
		console.log(compiler.moduleToString(module));
		assert.equal(module.functions.length, 1)
		assert.equal(module.functions[0].instructions.length, 9, "Expected 9 instructions.");

		let instructions = module.functions[0].instructions;
		["Hello world", "🔥 💕 🎁 💯 🌹", `\n\t\"`, "test"].forEach((n, index) => {
			let push = instructions[index * 2] as PushIns;
			let pop = instructions[index * 2 + 1] as PopIns;
			assert.equal(push.value, n, "Pushed value incorrect.");
			assert.equal(pop.kind, "pop", "No pop found.");
		});

		assert.equal(instructions[instructions.length - 1].kind, "return", "Expected a return instruction.");
	});
	it("Should add, subtract, multiply and divide numbers.", () => {
		["+", "-", "*", "/"].forEach(op => {
			let module = compiler.compile(`1 ${op} 2`, new compiler.ExternalFunctionsTypesConstants());
			console.log(compiler.moduleToString(module));
			assert.equal(module.functions.length, 1)
			assert.equal(module.functions[0].instructions.length, 5, "Expected 5 instructions.");

			let instructions = module.functions[0].instructions;
			assert.deepEqual(instructions[0], {kind: "push", value: 1});
			assert.deepEqual(instructions[1], {kind: "push", value: 2});
			assert.deepEqual(instructions[2], {kind: "binaryOp", operator: op});
			assert.deepEqual(instructions[3], {kind: "pop"});

			assert.equal(instructions[instructions.length - 1].kind, "return", "Expected a return instruction.");
		});
	});
	it("Should negate numbers.", () => {
		["-"].forEach(op => {
			let module = compiler.compile(`${op}1`, new compiler.ExternalFunctionsTypesConstants());
			console.log(compiler.moduleToString(module));
			assert.equal(module.functions.length, 1)
			assert.equal(module.functions[0].instructions.length, 4, "Expected 4 instructions.");

			let instructions = module.functions[0].instructions;
			assert.deepEqual(instructions[0], {kind: "push", value: 1});
			assert.deepEqual(instructions[1], {kind: "unaryOp", operator: op});
			assert.deepEqual(instructions[2], {kind: "pop"});

			assert.equal(instructions[instructions.length - 1].kind, "return", "Expected a return instruction.");
		});
	});
	it("Should compare numbers.", () => {
		["<", "<=", ">", ">=", "==", "!="].forEach(op => {
			let module = compiler.compile(`1 ${op} 2`, new compiler.ExternalFunctionsTypesConstants());
			console.log(compiler.moduleToString(module));
			assert.equal(module.functions.length, 1)
			assert.equal(module.functions[0].instructions.length, 5, "Expected 5 instructions.");

			let instructions = module.functions[0].instructions;
			assert.deepEqual(instructions[0], {kind: "push", value: 1});
			assert.deepEqual(instructions[1], {kind: "push", value: 2});
			assert.deepEqual(instructions[2], {kind: "binaryOp", operator: op});
			assert.deepEqual(instructions[3], {kind: "pop"});

			assert.equal(instructions[instructions.length - 1].kind, "return", "Expected a return instruction.");
		});
	});
	it("Should and, or booleans.", () => {
		["and", "or", "xor"].forEach(op => {
			let module = compiler.compile(`true ${op} false`, new compiler.ExternalFunctionsTypesConstants());
			console.log(compiler.moduleToString(module));
			assert.equal(module.functions.length, 1)
			assert.equal(module.functions[0].instructions.length, 5, "Expected 5 instructions.");

			let instructions = module.functions[0].instructions;
			assert.deepEqual(instructions[0], {kind: "push", value: true});
			assert.deepEqual(instructions[1], {kind: "push", value: false});
			assert.deepEqual(instructions[2], {kind: "binaryOp", operator: op});
			assert.deepEqual(instructions[3], {kind: "pop"});

			assert.equal(instructions[instructions.length - 1].kind, "return", "Expected a return instruction.");
		});
	});
	it("Should invert booleans.", () => {
		["not"].forEach(op => {
			let module = compiler.compile(`${op} true`, new compiler.ExternalFunctionsTypesConstants());
			console.log(compiler.moduleToString(module));
			assert.equal(module.functions.length, 1)
			assert.equal(module.functions[0].instructions.length, 4, "Expected 4 instructions.");

			let instructions = module.functions[0].instructions;
			assert.deepEqual(instructions[0], {kind: "push", value: true});
			assert.deepEqual(instructions[1], {kind: "unaryOp", operator: op});
			assert.deepEqual(instructions[2], {kind: "pop"});

			assert.equal(instructions[instructions.length - 1].kind, "return", "Expected a return instruction.");
		});
	});
	it("Should concatenate strings.", () => {
		[".."].forEach(op => {
			let module = compiler.compile(`"Hello " .. "world"`, new compiler.ExternalFunctionsTypesConstants());
			console.log(compiler.moduleToString(module));
			assert.equal(module.functions.length, 1)
			assert.equal(module.functions[0].instructions.length, 5, "Expected 5 instructions.");

			let instructions = module.functions[0].instructions;
			assert.deepEqual(instructions[0], {kind: "push", value: "Hello "});
			assert.deepEqual(instructions[1], {kind: "push", value: "world"});
			assert.deepEqual(instructions[2], {kind: "stringConcat"});
			assert.deepEqual(instructions[3], {kind: "pop"});

			assert.equal(instructions[instructions.length - 1].kind, "return", "Expected a return instruction.");
		});
	});
	it("Should not allow arithmetic and relational operators on non-numbers.", () => {
		[["true", "false"], [`"Hello"`, `"world"`]].forEach(values => {
			["+", "-", "*", "/", "<", "<=", ">", ">="].forEach(op => {
				try {
					compiler.compile(`${values[0]} ${op} ${values[1]}`, new compiler.ExternalFunctionsTypesConstants());
				} catch (e) {
					return
				}
				assert.fail(`Operator ${op} should not be allowed on ${values}.`);
			});
		});
	});
	it("Should not allow unary minus on non-numbers.", () => {
		["true", `"Hello"`].forEach(value => {
			["-"].forEach(op => {
				try {
					compiler.compile(`${op}${value}`, new compiler.ExternalFunctionsTypesConstants());
				} catch (e) {
					return
				}
				assert.fail(`Operator ${op} should not be allowed on ${value}.`);
			});
		});
	});
	it("Should not allow unary not on non-booleans.", () => {
		["123", `"Hello"`].forEach(value => {
			["not"].forEach(op => {
				try {
					compiler.compile(`${op} ${value}`, new compiler.ExternalFunctionsTypesConstants());
				} catch (e) {
					return
				}
				assert.fail(`Operator ${op} should not be allowed on ${value}.`);
			});
		});
	});
	it("Should allow equality/inequality test of values of same type.", () => {
		[["0", "123.2"], ["true", "false"], ["\"world\"", "\"hello\""]].forEach(values => {
			["==", "!="].forEach(op => {
				try {
					let module = compiler.compile(`${values[0]} ${op} ${values[1]}`, new compiler.ExternalFunctionsTypesConstants());
				} catch (e) {
					assert.fail(`Operator ${op} should be allowed on ${values}.`);
				}
			});
		});
	});
	it("Should not allow equality/inequality of values of different type.", () => {
		[["true", "\"hello\""]].forEach(values => {
			["==", "!="].forEach(op => {
				try {
					let module = compiler.compile(`${values[0]} ${op} ${values[1]}`, new compiler.ExternalFunctionsTypesConstants());
					console.log(compiler.moduleToString(module));
				} catch (e) {
					return
				}
				assert.fail(`Operator ${op} should not be allowed on ${values}.`);
			});
		});
	});
	it("Should not allow non-booleans in if conditions.", () => {
		try {
			let module = compiler.compile("if 123 then end", new compiler.ExternalFunctionsTypesConstants());
		} catch (e) {
			return;
		}
		assert.fail(`Non-boolean conditions in ifs should not be allowed.`);
	});
	it("Should not allow non-booleans in while conditions.", () => {
		try {
			let module = compiler.compile("while 123 do end", new compiler.ExternalFunctionsTypesConstants());
		} catch (e) {
			return;
		}
		assert.fail(`Non-boolean conditions in while should not be allowed.`);
	});
	it("Should not allow non-numbers in repeat conditions.", () => {
		try {
			let module = compiler.compile("repeat true times end", new compiler.ExternalFunctionsTypesConstants());
		} catch (e) {
			return;
		}
		assert.fail(`Non-number conditions in repeat should not be allowed.`);
	});
	it("Should not allow unknown variable types.", () => {
		try {
			let module = compiler.compile("var a: point = 0", new compiler.ExternalFunctionsTypesConstants());
		} catch (e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow assigning a value of different type to a variable in initializer.", () => {
		try {
			let module = compiler.compile("var a:boolean = 0", new compiler.ExternalFunctionsTypesConstants());
		} catch (e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow assigning a value of different type to a variable in re-binding.", () => {
		try {
			let module = compiler.compile("var a:boolean = false a = 0", new compiler.ExternalFunctionsTypesConstants());
		} catch (e) {
			return;
		}
		assert.fail();
	});
	it("Should infer the type of a variable from the initializer.", () => {
		let module = compiler.compile("var a = 0", new compiler.ExternalFunctionsTypesConstants());
		let varDecl = (module.functions[0].ast.block[0] as compiler.VariableDecl);
		assert.equal(varDecl.type.signature, "number");
	});
	it("Should not allow assignment to an undefined variable.", () => {
		try {
			let module = compiler.compile("a = 0", new compiler.ExternalFunctionsTypesConstants());
		} catch (e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow access to an undefined variable.", () => {
		try {
			let module = compiler.compile("a", new compiler.ExternalFunctionsTypesConstants());
		} catch (e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow calling an undefined function.", () => {
		try {
			let module = compiler.compile("a()", new compiler.ExternalFunctionsTypesConstants());
		} catch (e) {
			return;
		}
		assert.fail();
	});
	it("Should resolve a call to a user defined function.", () => {
		let module = compiler.compile("fun foo():number return 0 end foo()", new compiler.ExternalFunctionsTypesConstants());
		let call = module.functions[0].ast.block[0] as compiler.FunctionCall;
		assert.equal(call.resolvedFunction.signature, "foo():number");
		assert.equal(call.type.signature, "number");
	});
	it("Should resolve a call to an external function.", () => {
		let extFuncs = new compiler.ExternalFunctionsTypesConstants();
		extFuncs.addFunction("foo", [], compiler.NumberType, false, () => {});
		let module = compiler.compile("foo()", extFuncs);
		let call = module.functions[0].ast.block[0] as compiler.FunctionCall;
		assert.equal(call.resolvedFunction.signature, "foo():number");
		assert.equal(call.type.signature, "number");
	});
	it("Should resolve a call to an external function.", () => {
		let extFuncs = new compiler.ExternalFunctionsTypesConstants();
		extFuncs.addFunction("foo", [], compiler.NumberType, false, () => {});
		let module = compiler.compile("foo()", extFuncs);
		let call = module.functions[0].ast.block[0] as compiler.FunctionCall;
		assert.equal(call.resolvedFunction.signature, "foo():number");
		assert.equal(call.type.signature, "number");
	});
	it("Should not allow returning a value from the $main() function.", () => {
		try {
			let module = compiler.compile("return 0", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow returning a value when the function does return nothing.", () => {
		try {
			let module = compiler.compile("fun foo() return 0 end", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});
	// TODO make sure all code paths return a value
	it("Should not allow not returning a value when the function has a return type != nothing.", () => {
		try {
			let module = compiler.compile("fun foo():number return end", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow returning a value of the wrong type from a function.", () => {
		try {
			let module = compiler.compile("fun foo():number return true end", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow continue outside an enclosing loop.", () => {
		try {
			let module = compiler.compile("continue", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow break outside an enclosing loop.", () => {
		try {
			let module = compiler.compile("break", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow field access on non-records.", () => {
		try {
			let module = compiler.compile("var a = 0 a.x", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow access of unknown fields.", () => {
		try {
			let module = compiler.compile("record r x: number end var p = r(0) p.y", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow duplicate record types.", () => {
		try {
			let module = compiler.compile("record r end record r end", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow duplicate record fields.", () => {
		try {
			let module = compiler.compile("record r x: number x: boolean end", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow unknown record field types.", () => {
		try {
			let module = compiler.compile("record r x: s end", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow duplicate named functions.", () => {
		try {
			let module = compiler.compile("fun foo() end fun foo() end", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow unknown parameter.", () => {
		try {
			let module = compiler.compile("fun foo(a: quark) end", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});
	it("Should not allow unknown return types.", () => {
		try {
			let module = compiler.compile("fun foo(a: number): quark end", new compiler.ExternalFunctionsTypesConstants());
		} catch(e) {
			return;
		}
		assert.fail();
	});

	// TODO check emitter output, including debug info
});