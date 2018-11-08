import { Widget } from "./Widget"
import { EventBus, Event, AnnounceDocumentation } from "./Events";

export interface DocCategory {
	name: string,
	desc: string,
	entries: DocEntry[];
	subCategories: DocCategory[];
}

export interface DocEntry {
	name: string,
	anchor: string,
	desc: string
}

const DOCS: DocCategory[] = [
	{
		name: "Built-in functions",
		desc: "These functions are built into the programming language and available to programs of any type.",
		entries: [
			{
				name: "<code>alert(message: string)</code>",
				anchor: "lang-alert-string",
				desc: "Opens a dialog that displays the text given in <code>message</code>."
			},
			{
				name: "<code>alert(value: number)</code>",
				anchor: "lang-alert-number",
				desc: "Opens a dialog that displays the number given in <code>value</code>."
			},
			{
				name: "<code>alert(value: boolean)</code>",
				anchor: "lang-alert-boolean",
				desc: "Opens a dialog that displays the boolean given in <code>value</code>."
			},
			{
				name: "<code>toString(value: number): string</code>",
				anchor: "lang-to-string-number",
				desc: "Convers the number in <code>value</code> to a string. E.g. <code>123</code> becomes \"123\"."
			},
			{
				name: "<code>toString(value: boolean): string</code>",
				anchor: "lang-to-string-number",
				desc: "Convers the boolean in <code>value</code> to a string. E.g. <code>true</code> becomes \"true\"."
			},
			{
				name: "<code>length(text: string): number</code>",
				anchor: "lang-length-string",
				desc: "Returns the number of characters in the string <code>text</code>. Returns <code>0</code> for empty strings."
			},
			{
				name: "<code>charAt(text: string, index: number): string</code>",
				anchor: "lang-char-at-string-number",
				desc: "Returns the character at the <code>index</code> from the string. Returns an empty string if the index is smaller than <code>0</code> or greater or equal to the length of the string."
			},
			{
				name: "<code>pause(milliSeconds: number)</code>",
				anchor: "lang-wait",
				desc: "Pauses the program for the number of milliseconds given in <code>milliSeconds</code>, then continues."
			},
			{
				name: "<code>time(): number</code>",
				anchor: "lang-time",
				desc: "Returns the time in seconds since the web site started to load."
			},
			{
				name: "<code>random(): number</code>",
				anchor: "lang-random",
				desc: "Returns a random number between <code>0<code> and <code>1</code>."
			},
			{
				name: "<code>abs(value: number): number</code>",
				anchor: "lang-abs",
				desc: "Returns the absolute <code>value</code>, i.e. negative numbers turn positive, positive numbers stay positive."
			},
			{
				name: "<code>sqrt(value: number): number</code>",
				anchor: "lang-sqrt",
				desc: "Returns the square root of the <code>value</code>. Negative values are not allowed."
			},
			{
				name: "<code>pow(value: number, power: number): number</code>",
				anchor: "lang-pow",
				desc: "Returns the <code>value</code> to the <code>power</code>, i.e. <code>pow(2, 3) return 2 to the power of 3."
			},
			{
				name: "<code>cos(radians: number): number</code>",
				anchor: "lang-cos",
				desc: "Returns the cosine of the angle given in <code>radians</code>."
			},
			{
				name: "<code>sin(radians: number): number</code>",
				anchor: "lang-sin",
				desc: "Returns the sine of the angle given in <code>radians</code>."
			},
			{
				name: "<code>atan2(x: number, y: number): number</code>",
				anchor: "lang-atan2",
				desc: "Returns the arc tangent of <code>x</code> and <code>y</code>."
			}
		],
		subCategories: []
	},
	{
		name: "Statements",
		desc: "",
		entries: [],
		subCategories: [
			{
				name: "Variables",
				desc: "Variables are really cool.",
				entries: [
					{
						name: "<code>var name = value</code>",
						anchor: "statement-var-decl",
						desc: "Foo bar."
					},
					{
						name: "<code>name = value</code>",
						anchor: "statement-assignment",
						desc: "Foo bar."
					}
				],
				subCategories: []
			},
		]
	}
];

export class Docs extends Widget {
	private dom: JQuery;

	constructor(bus: EventBus) {
		super(bus)
	}

	render(): HTMLElement {
		this.dom = $(/*html*/`
			<div id="pb-docs">
			</div>
		`);
		return this.dom[0];
	}

	onEvent(event: Event) {
		if (event instanceof AnnounceDocumentation) {
			DOCS.unshift(event.docs)
			this.generateDocs(this.dom);
		}
	}

	generateDocs(container: JQuery) {
		this.dom.empty();
		let toc = $(/*html*/`
			<div id="pb-docs-toc"></div>
		`);
		let content = $(/*html*/`
			<div id="pb-docs-content"></div>
		`)
		container.append(toc);
		container.append(content);
		DOCS.forEach((cat) => {
			this.generateCategory(cat, container, toc, content, 2);
		});
	}

	generateCategory(cat: DocCategory, container: JQuery, toc: JQuery, content: JQuery, depth: number) {
		toc.append(`<h${depth}>${cat.name}</h${depth}>`);
		let entries = $(/*html*/`<ul class="pb-docs-toc-list"></ul>`);
		cat.entries.forEach((entry) => {
			let link = $(/*html*/`<a>${entry.name}</a>`);
			link.click(() => {
				let target = document.getElementById(`pb-docs-anchor-${entry.anchor}`);
				container[0].scrollTop = target.offsetTop;
			});
			let li = $(/*html*/`<li></li>`);
			li.append(link);
			entries.append(li);
		});
		toc.append(entries);

		content.append(`<h${depth}>${cat.name}</h${depth}>`);
		content.append($(this.block(cat.desc)));
		cat.entries.forEach((entry) => {
			content.append(/*html*/`
				<h${depth + 1} id="pb-docs-anchor-${entry.anchor}">${entry.name}</h${depth + 1}>
				${this.block(entry.desc)}
				<hr>
			`);
		});

		cat.subCategories.forEach((childCat) => {
			this.generateCategory(childCat, container, toc, content, depth + 1);
		});
	}

	block(desc: string) {
		if (desc.trim() == "") return "";
		try {
			$(desc);
			return desc;
		} catch(e) {
			return "<p>" + desc + "</p>";
		}
	}
}