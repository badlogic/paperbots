import { TextMarker } from "codemirror";
import { Widget } from "./Widget"
import * as events from "./Events"
import * as compiler from "../Compiler"

declare function CodeMirror(host: HTMLElement, options?: CodeMirror.EditorConfiguration): CodeMirror.Editor;

const DEFAULT_SOURCE = `
fun forwardUntilNumber (n: number)
	while true do
		if scan() == n then return end
		forward()
	end
end

forwardUntilNumber(3)

turnRight()
forward()
forward()

repeat 4 times
	forward()
	print(3)
	forward()
	print(3)
	turnRight()
end

print(10)
alert("Oh no!")
`

export class Editor extends Widget {
	private editor: CodeMirror.Editor;
	private error: JQuery;
	private markers = Array<TextMarker>();
	private ext = new compiler.ExternalFunctions();

	render (): HTMLElement {
		let dom = $(/* html */`
			<div id="pb-code-editor">
				<div id="pb-code-editor-code-mirror"></div>
				<div id="pb-code-editor-error"></div>
			</div>
		`);
		requestAnimationFrame(() => {
			this.editor = (CodeMirror as any)(dom.find("#pb-code-editor-code-mirror")[0], {
				tabSize: 3,
				indentUnit: 3,
				indentWithTabs: true,
				styleActiveLine: true,
				styleActiveSelected: true,
				lineNumbers: true,
				gutters: ["gutter-breakpoints", "CodeMirror-linenumbers"],
				fixedGutter: true,
				extraKeys: {
					"Tab": "indentAuto"
				}
			});

			this.editor.on("change", (instance, change) => {
				let module = this.compile();
				this.bus.event(new events.SourceChanged(this.editor.getDoc().getValue(), module));
			});

			this.editor.getDoc().setValue(DEFAULT_SOURCE.trim());

			let module = this.compile();
			this.bus.event(new events.SourceChanged(this.editor.getDoc().getValue(), module));
		});
		this.error = dom.find("#pb-code-editor-error");
		this.error.hide();
		return dom[0];
	}

	compile () {
		this.markers.forEach(marker => marker.clear());
		this.markers.length = 0;

		try {
			let result = compiler.compile(this.editor.getDoc().getValue(), this.ext);
			this.error.hide();
			return result;
		} catch (e) {
			this.error.show();
			if (e["location"]) {
				let err = (e as compiler.CompilerError);
				let loc = err.location;
				let from = {line: loc.start.line - 1, ch: loc.start.column - 1 - (loc.start.line == loc.end.line && loc.start.column == loc.end.column ? 1 : 0)};
				let to = {line: loc.end.line - 1, ch: loc.end.column - 1};
				this.markers.push(this.editor.getDoc().markText(from, to, { className: "compiler-error", title: err.message}));
				this.error.html("Error in line " + loc.start.line + ", column " + loc.start.column + ": " + err.message);
			} else {
				let err = e as Error;
				this.error.html(err.message + (err.stack ? err.stack : ""));
			}
			return null;
		}
	}

	newBreakpointMarker () {
		let marker = $(`
		<svg height="15" width="15">
			<circle cx="7" cy="7" r="7" stroke-width="1" fill="#cc0000" />
		  </svg>
		`);
		return marker[0];
	}

	setLine(line: number) {
		this.editor.getDoc().setCursor(line, 1);
	}

	onEvent(event: Event) {
		if (event instanceof events.Run || event instanceof events.Debug) {
			this.editor.setOption("readOnly", true);
		} else if (event instanceof events.Stop) {
			this.editor.setOption("readOnly", false);
			this.editor.focus();
		} else if (event instanceof events.Step || event instanceof events.LineChange) {
			this.setLine(event.line - 1);
		} else if (event instanceof events.Select) {
			this.editor.getDoc().setSelection(
				{line: event.startLine - 1, ch: event.startColumn - 1},
				{line: event.endLine - 1, ch: event.endColumn - 1}
			);
		} else if (event instanceof events.AnnounceExternalFunctions) {
			this.ext = event.functions;
		}
	}
}