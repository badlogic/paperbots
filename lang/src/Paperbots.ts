import {SyntaxError, parse} from "./Parser";
import { TextMarker } from "../node_modules/@types/codemirror/index";

export module paperbots {
	export class Compiler {
		parse(input: string) {
			return parse(input);
		}
	}

	export class Editor {
		private editor: CodeMirror.Editor;
		private compiler: Compiler;

		constructor(private editorElement: HTMLElement, private compilerOutput: HTMLTextAreaElement) {
			this.compiler = new Compiler();
			this.editor = CodeMirror(editorElement, {
				tabSize: 3,
				indentUnit: 3,
				indentWithTabs: true,
				lineNumbers: true,
				gutters: ["gutter-breakpoints", "CodeMirror-linenumbers"],
				fixedGutter: true,
				extraKeys: {
					"Tab": "indentAuto"
				}
			});
			this.editor.getDoc().setValue(window.localStorage.getItem("editor-content") || "");

			var markers = Array<TextMarker>();
			var compile = () => {
				try {
					let result = this.compiler.parse(this.editor.getDoc().getValue());
					compilerOutput.value = JSON.stringify(result, null, 2);
					markers.forEach(marker => marker.clear());
					markers.length = 0;
				} catch (e) {
					markers.forEach(marker => marker.clear());
					markers.length = 0;
					let err = (e as SyntaxError);
					let loc = err.location;
					let from = {line: loc.start.line - 1, ch: loc.start.column - 1 - (loc.start.line == loc.end.line && loc.start.column == loc.end.column ? 1 : 0)};
					let to = {line: loc.end.line - 1, ch: loc.end.column - 1};
					markers.push(this.editor.getDoc().markText(from, to, { className: "compiler-error", title: err.message}));
					compilerOutput.value = loc.start.line + ":" + loc.start.column + ": " + err.message;
				}
			}

			this.editor.on("change", (instance, change) => {
				compile();
				window.localStorage.setItem("editor-content", this.editor.getDoc().getValue());
			});

			this.editor.on("gutterClick", function(cm, n) {
				let info = cm.lineInfo(n);
				cm.setGutterMarker(n, "gutter-breakpoints", info.gutterMarkers ? null : makeMarker());
			});

			function makeMarker() {
				let marker = $(`
				<svg height="15" width="15">
					<circle cx="7" cy="7" r="7" stroke-width="1" fill="#cc0000" />
			  	</svg>
				`);
				return marker[0];
			}

			compile();
		}
	}
}