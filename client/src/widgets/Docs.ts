import { Widget } from "./Widget"
import { EventBus, Event } from "./Events";

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
	name: "Functions",
	desc: "Use the below functions to create your program.",
	entries: [],
	subCategories: [
		{
			name: "Robot movement",
			desc: "Make the robot move with these functions.",
			entries: [
				{
					name: "<code>forward()</code>",
					anchor: "robot-forward",
					desc: "Moves the robot forward by one cell in the direction it is facing. If the grid cell is blocked by a wall, the robot does not move."
				},
				{
					name: "<code>backward()</code>",
					anchor: "robot-backward",
					desc: "Moves the robot backward by one cell in the oposite direction it is facing. If the grid cell is blocked by a wall, the robot does not move."
				},
				{
					name: "<code>turnLeft()</code>",
					anchor: "robot-turn-left",
					desc: "Rotates the robot in-place to the left by 90 degrees (counter-clock-wise)."
				},
				{
					name: "<code>turnRight()</code>",
					anchor: "robot-turn-right",
					desc: "Rotates the robot in-place to the right by 90 degrees (clock-wise)."
				}
			],
			subCategories: []
		},
		{
			name: "Robot input",
			desc: "Let the robot read information from its environment.",
			entries: [
				{
					name: "<code>scanNumber(): number</code>",
					anchor: "robot-scan-number",
					desc: "Scans the number in the cell in front of the robot and returns it. If there is no number, <code>-1</code> is returned."
				},
				{
					name: "<code>scanLetter(): string</code>",
					anchor: "robot-scan-letter",
					desc: `Scans the letter in the cell in front of the robot and returns it. If there is no letter, and empty string <code>""</code> is returned.`
				},
				{
					name: "<code>isWallAhead(): boolean</code>",
					anchor: "robot-is-wall-ahead",
					desc: "Returns <code>true</code> if there is a wall in the cell ahead of the robot. Returns <code>false</code> otherwise."
				},
				{
					name: "<code>isNumberAhead(): boolean</code>",
					anchor: "robot-is-number-ahead",
					desc: "Returns <code>true</code> if there is a number in the cell ahead of the robot. Returns <code>false</code> otherwise."
				},
				{
					name: "<code>isLetterAhead(): boolean</code>",
					anchor: "robot-is-letter-ahead",
					desc: "Returns <code>true</code> if there is a letter in the cell ahead of the robot. Returns <code>false</code> otherwise."
				},
				{
					name: "<code>distanceToWall(): number</code>",
					anchor: "robot-distance-to-wall",
					desc: "Returns the number of cells between the robot and the next wall in the direction the robot is facing."
				}
			],
			subCategories: []
		},
		{
			name: "Robot output",
			desc: "Have the robot build and print stuff on the grid.",
			entries: [
				{
					name: "<code>print(value: number)</code>",
					anchor: "robot-print-number",
					desc: "Prints the number given in <code>value</code> to the cell in front of the robot. The number must be between <code>0</code> and <code>99</code>. If the number is outside that range, or there is a wall in the cell, nothing is printed. If the number has decimal places, they will be truncated."
				},
				{
					name: "<code>print(letter: string)</code>",
					anchor: "robot-print-letter",
					desc: "Prints the letter given in <code>value</code> to the cell in front of the robot. The <code>string</code> must be exactly 1 letter long. If there is a wall in the cell, nothing is printed."
				},
				{
					name: "<code>buildWall()</code>",
					anchor: "robot-build-wall",
					desc: "Builds a wall in the cell in front of the robot. Does nothing if there is a wall already."
				},
				{
					name: "<code>destroyWall()</code>",
					anchor: "robot-destroy-wall",
					desc: "Destroys a wall in the cell in front of the robot. Does nothing if there is no wall."
				}
			],
			subCategories: []
		},
		{
			name: "Robot status",
			desc: "Check the status of the robot.",
			entries: [
				{
					name: "<code>getDirection(): number</code>",
					anchor: "robot-get-direction",
					desc: "Returns the direction the robot is facing in as a number. <code>0</code> is east, <code>1</code> is north, <code>2</code> is west, and <code>3</code> is south."
				},
				{
					name: "<code>getX(): number</code>",
					anchor: "robot-get-x",
					desc: "Returns the robot's x coordinate on the grid."
				},
				{
					name: "<code>getY(): number</code>",
					anchor: "robot-get-y",
					desc: "Returns the robot's y coordinate on the grid."
				},
				{
					name: "<code>getSpeed(): number</code>",
					anchor: "robot-get-speed",
					desc: "Returns the movement speed of the robot which is measured in number of cells per second. The speed can be a decimal number. E.g. <code>1.5</code> means the robot crosses one and a half cells when moving forward."
				},
				{
					name: "<code>setSpeed(cellsPerSecond: number)</code>",
					anchor: "robot-set-speed",
					desc: "Sets the movement speed of the robot which is measured in number of cells per second. The speed must be a number >= <code>0</code>. The <code>speed</code> can be a decimal number. E.g. <code>1.5</code> means the robot crosses one and a half cells when moving forward."
				},
				{
					name: "<code>getTurningSpeed(): number</code>",
					anchor: "robot-get-turning-speed",
					desc: "Returns the turning speed of the robot which is measured in number of degrees per second."
				},
				{
					name: "<code>setTurningSpeed(degreesPerSecond: number)</code>",
					anchor: "robot-set-turning-speed",
					desc: "Set the turning speed of the robot which is measured in number of degrees per second. The number must be >= <code>0</code>. The <code>degreesPerSecond</code> can be a decimal number. E.g. <code>40.5</code> means the robot turns by 40.5 degrees per second."
				}
			],
			subCategories: []
		},
		{
			name: "Built-in",
			desc: "Functions to work with different data and for communicating with the user.",
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
			],
			subCategories: []
		}
	]
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
	constructor(bus: EventBus) {
		super(bus)
	}

	render(): HTMLElement {
		let dom = $(/*html*/`
			<div id="pb-docs">
			</div>
		`);
		this.generateDocs(dom);
		return dom[0];
	}

	onEvent(event: Event) {

	}

	generateDocs(container: JQuery) {
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