import { Widget } from "./Widget"
import { EventBus, Event } from "./Events";

export interface DocCategory {
	name: string,
	entries: DocEntry[];
	subCategories: DocCategory[];
}

export interface DocEntry {
	name: string,
	desc: string
}

const DOCS: DocCategory[] = [
{
	name: "Functions",
	entries: [],
	subCategories: [
		{
			name: "Movement",
			entries: [
				{
					name: "forward()",
					desc: "Moves the robot forward by one cell in the direction it is facing. If the grid cell is blocked by a wall, the robot does not move."
				},
				{
					name: "turnLeft()",
					desc: "Rotates the robot in-plae to the left by 90 degrees (counter-clock-wise)."
				},
				{
					name: "turnRight()",
					desc: "Rotates the robot in-plae to the right by 90 degrees (clock-wise)."
				}
			],
			subCategories: []
		}
	]
},
{
	name: "Statements",
	entries: [],
	subCategories: []
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
		return dom[0];
	}

	onEvent(event: Event) {

	}

	generateDocs() {
		DOCS.forEach((category) => {

		});
	}
}