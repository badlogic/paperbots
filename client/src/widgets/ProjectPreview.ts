import { Widget } from "./Widget";
import { Event, EventBus, ProjectLoaded, AnnounceExternalFunctions, Run, Stop } from "./Events";
import { RobotWorld } from "./RobotWorld";
import { Api, Project } from "../Api";
import { compile, ExternalFunctionsTypesConstants } from "../language/Compiler";
import { VirtualMachine, VirtualMachineState } from "../language/VirtualMachine";
import { CanvasWorld } from "./CanvasWorld";

export class ProjectPreview extends Widget {
	private world: RobotWorld | CanvasWorld;

	constructor(private project: Project) {
		super(new EventBus());
		if (project.type == "robot") {
			this.world = new RobotWorld(this.bus, true);
			this.world.setWorldData(project.contentObject.world);
		} else if (project.type == "canvas") {
			this.world = new CanvasWorld(this.bus);
		}
	}

	render(): HTMLElement {
		this.bus.addListener(this);
		this.bus.addListener(this.world);

		let dom = $(/*html*/`
			<div class="pb-preview-widget">
			</div>
		`);


		if (this.project.type == "robot") {
			let preview = this.world.render();
			dom.append(preview);
			preview.addEventListener("click", () => {
				(window.location as any) = Api.getProjectUrl(this.project.code);
			});
		} else if (this.project.type == "canvas") {
			let thumbnail = $(`<img src="${Api.getProjectThumbnailUrl(this.project.code)}" style="width: 192px; height: 108px;"/>`);
			thumbnail[0].addEventListener("click", () => {
				(window.location as any) = Api.getProjectUrl(this.project.code);
			});
			dom.append(thumbnail);
		}
		return dom[0];
	}

	onEvent(event: Event) {
	}
}