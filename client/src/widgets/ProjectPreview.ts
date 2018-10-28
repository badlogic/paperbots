import { Widget } from "./Widget";
import { Event, EventBus, ProjectLoaded, AnnounceExternalFunctions, Run, Stop } from "./Events";
import { RobotWorld } from "./RobotWorld";
import { Api, Project } from "../Api";
import { compile, ExternalFunctions } from "../language/Compiler";
import { VirtualMachine, VirtualMachineState } from "../language/VirtualMachine";

export class ProjectPreview extends Widget {
	private world: RobotWorld;

	constructor(private project: Project) {
		super(new EventBus());
		this.world = new RobotWorld(this.bus, true);
		this.world.setWorldData(project.contentObject.world);
	}

	render(): HTMLElement {
		this.bus.addListener(this);
		this.bus.addListener(this.world);

		let dom = $(/*html*/`
			<div class="pb-preview-widget">
			</div>
		`);
		dom.append(this.world.render());
		return dom[0];
	}

	onEvent(event: Event) {
	}
}