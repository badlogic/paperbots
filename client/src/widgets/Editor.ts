import { TextMarker, LineWidget, LineHandle } from "codemirror";
import { Widget } from "./Widget"
import * as events from "./Events"
import * as compiler from "../language/Compiler"
import { Map } from "../Utils"
import { Breakpoint } from "./Debugger"

declare function CodeMirror(host: HTMLElement, options?: CodeMirror.EditorConfiguration): CodeMirror.Editor;

class CodeMirrorBreakpoint implements Breakpoint {
	constructor(public doc: CodeMirror.Doc, public lineHandle: LineHandle) {}

	getLine(): number {
		return this.doc.getLineNumber(this.lineHandle) + 1;
	}
}

// const DEFAULT_SOURCE = `
// fun forwardUntilNumber (n: number)
// 	while true do
// 		if scanNumber() == n then return end
// 		forward()
// 	end
// end

// forwardUntilNumber(3)

// turnRight()
// forward()
// forward()

// repeat 4 times
// 	forward()
// 	print(3)
// 	forward()
// 	print(3)
// 	turnRight()
// end

// print(10)
// alert("Oh no!")
// `

const DEFAULT_SOURCE = "";

export class Editor extends Widget {
	private editor: CodeMirror.Editor;
	private error: JQuery;
	private markers = Array<TextMarker>();
	private ext = new compiler.ExternalFunctions();
	private justLoaded = false;

	render (): HTMLElement {
		let dom = $(/* html */`
			<div id="pb-code-editor">
				<div id="pb-code-editor-code-mirror-wrapper">
					<div id="pb-code-editor-code-mirror">
					</div>
				</div>
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
				},
				theme: "monokai"
			});

			this.editor.on("change", (instance, change) => {
				let module = this.compile();
				this.bus.event(new events.SourceChanged(this.editor.getDoc().getValue(), module));
				if (this.justLoaded) {
					this.justLoaded = false;
				} else {
					this.bus.event(new events.ProjectChanged());
				}
				clearTimeout(this.lastTimeoutHandle);
				this.lastTimeoutHandle = setTimeout(() => this.expandUrls(), 500);
			});

			this.editor.on("gutterClick", (cm, n) => {
				var info = cm.lineInfo(n);
				if (!info.gutterMarkers) {
					cm.setGutterMarker(n, "gutter-breakpoints", this.newBreakpointMarker());
					info = cm.lineInfo(n);
					let lineHandle = cm.getDoc().getLineHandle(n);
					let bp = new CodeMirrorBreakpoint(cm.getDoc(), lineHandle);
					this.bus.event(new events.BreakpointAdded(bp));
					info.gutterMarkers.bp = bp;
					(lineHandle as any).on("delete", () => {
						this.bus.event(new events.BreakpointRemoved(bp));
					});
				} else {
					let bp = info.gutterMarkers.bp;
					delete info.gutterMarkers.bp;
					cm.setGutterMarker(n, "gutter-breakpoints", null);
					this.bus.event(new events.BreakpointRemoved(bp));
				}
			});

			this.editor.on("delete", (line) => {
				alert(line);
			});

			this.editor.getDoc().setValue(DEFAULT_SOURCE.trim());

			let module = this.compile();
			this.bus.event(new events.SourceChanged(this.editor.getDoc().getValue(), module));
		});
		this.error = dom.find("#pb-code-editor-error");
		this.error.hide();
		return dom[0];
	}

	urlRegex = new RegExp(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
	extractUrls (text: string): string[] {
		return text.match(this.urlRegex);
	}
	lastTimeoutHandle = 0;
	urlWidgets: Map<{ widget: LineWidget, line: string, delete: boolean }> = { };
	expandUrls() {
		Object.keys(this.urlWidgets).forEach(line => {
			let widget = this.urlWidgets[line];
			widget.delete = true;
		});
		let lines = this.editor.getDoc().getValue().split("\n");
		lines.forEach((line, i) => {
			let previous = this.urlWidgets[line];
			if (previous) {
				previous.delete = false;
				return;
			}

			let urls = this.extractUrls(line);
			if (urls == null) return;
			let doms = new Array<JQuery>();
			urls.forEach(url => {
				if (url.indexOf("https://www.youtube.com/watch?v=") == 0) {
					let videoId = url.substr("https://www.youtube.com/watch?v=".length);
					if (videoId.length > 0) {
						videoId = videoId.trim();
						doms.push($(/*html*/`
							<iframe id="ytplayer" type="text/html" width="300" height="168"
							src="https://www.youtube.com/embed/${videoId}"
							frameborder="0"></iframe>
						`));
					}
				} else if (url.toLowerCase().indexOf(".png") >= 0 ||
						   url.toLowerCase().indexOf(".jpg") >= 0 ||
						   url.toLowerCase().indexOf(".gif") >= 0) {
					doms.push($(/*html*/`
						<img src="${url}" style="height: 100px;">
					`));
				}
			});

			if (doms.length > 0) {
				let lineDom = $(/*html*/`
					<div style="display: flex; flex-direction: row;">
					</div>
				`);
				doms.forEach(dom => lineDom.append(dom));
				this.urlWidgets[line] = { widget: this.editor.addLineWidget(i, lineDom[0]), line: line, delete: false };
			}
		});

		Object.keys(this.urlWidgets).forEach(line => {
			let widget = this.urlWidgets[line];
			if (widget.delete) {
				this.urlWidgets[line].widget.clear()
				delete this.urlWidgets[line];
			}
		});
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
				this.error.html("Error in line " + loc.start.line + ": " + err.message);
			} else {
				let err = e as Error;
				this.error.html(err.message + (err.stack ? err.stack : ""));
			}
			return null;
		}
	}

	newBreakpointMarker () {
		let marker = $(/*html*/`
			<div class="pb-gutter-breakpoint">
				<svg height="15" width="15">
					<circle cx="7" cy="7" r="7" stroke-width="1" fill="#cc0000" />
				</svg>
			</div>
		`);
		return marker[0];
	}

	private lastLine = -1;
	setLine(line: number) {
		if (this.lastLine != -1) this.editor.removeLineClass(this.lastLine, "background", "pb-debugged-line");
		this.editor.addLineClass(line, "background", "pb-debugged-line");
		let rect = this.editor.getWrapperElement().getBoundingClientRect();
    	let topVisibleLine = this.editor.lineAtHeight(rect.top, "window");
		let bottomVisibleLine = this.editor.lineAtHeight(rect.bottom, "window");
		if (line < topVisibleLine || line > bottomVisibleLine) {
			let h = this.editor.getScrollInfo().clientHeight;
  			let coords = this.editor.charCoords({line: line, ch: 0}, "local");
  			this.editor.scrollTo(null, (coords.top + coords.bottom - h) / 2);
		}
		this.lastLine = line;
	}

	onEvent(event: Event) {
		if (event instanceof events.Run || event instanceof events.Debug || event instanceof events.Resume) {
			this.editor.setOption("readOnly", true);
			this.editor.removeLineClass(this.lastLine, "background", "pb-debugged-line");
		} else if (event instanceof events.Stop) {
			this.editor.setOption("readOnly", false);
			this.editor.removeLineClass(this.lastLine, "background", "pb-debugged-line");
			this.lastLine = -1;
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
		} else if (event instanceof events.ProjectLoaded) {
			this.justLoaded = true;
			setTimeout(() => {
				this.editor.getDoc().setValue(event.project.contentObject.code);
			}, 100);
		} else if (event instanceof events.BeforeSaveProject) {
			event.project.contentObject.code = this.editor.getDoc().getValue()
		}
	}
}