import { compile, ExternalFunctions, CompilerError, Module, Types, FunctionDecl, moduleToString } from "./language/Compiler";
import { VirtualMachine, VirtualMachineState } from "./language/VirtualMachine";

declare function CodeMirror(host: HTMLElement, options?: CodeMirror.EditorConfiguration): CodeMirror.Editor;

export class BenchmarkPage {
	editor: CodeMirror.Editor;

	constructor (parent: JQuery) {
		this.addBenchmark(parent, "Fibonacci", `
fun fib (n: number): number
	if n < 2 then return n end
	return fib(n - 2) + fib(n - 1)
end
fib(30)
`);
	}

	addBenchmark(parent: JQuery, title: string, source: string) {
		source = source.trim();
		let dom = $(/*html*/`
			<div class="pb-benchmark">
				<h1>${title}</h1>
				<div class="pb-benchmark-code"></div>
				<div class="pb-benchmark-vm-code"></div>
				<div class="pb-benchmark-result">No benchmark results yet.</div>
				<button id="pb-benchmark-run">Run</button>
				</div>
			</div>
		`);
		setTimeout(() => {
			let editor = this.editor = (CodeMirror as any)(dom.find(".pb-benchmark-code")[0], {
				tabSize: 3,
				indentUnit: 3,
				indentWithTabs: true,
				lineNumbers: true,
				gutters: ["gutter-breakpoints", "CodeMirror-linenumbers"],
				fixedGutter: true,
				extraKeys: {
					"Tab": "indentAuto"
				},
				theme: "monokai"
			});
			editor.on("change", () => {
				var module: Module = null;
				try {
					module = compile(editor.getValue(), new ExternalFunctions());
				} catch (e) {
					alert("Error in " + title + ": " + (e as CompilerError).message);
					return;
				}
				dom.find(".pb-benchmark-vm-code").text(moduleToString(module));
			});
			editor.setValue(source);
		}, 400);

		dom.find("#pb-benchmark-run").click(() => {
			var module: Module = null;
			try {
				module = compile(this.editor.getValue(), new ExternalFunctions());
			} catch (e) {
				alert("Error in " + title + ": " + (e as CompilerError).message);
				return;
			}

			let result = dom.find(".pb-benchmark-result");
			result.text("Benchmark running...");
			let vm = new VirtualMachine(module.functions, module.externalFunctions);
			let start = performance.now();
			for (var runs = 0; runs < 5; runs++) {
				while (vm.state != VirtualMachineState.Completed) {
					vm.run(10000);
				}
				vm.restart();
			}
			let total = (performance.now() - start) / 1000;
			let perRun = total / 5;
			result.text("Total: " + total + " secs, " + perRun + " secs/run");
		})

		parent.append(dom);
	}
}