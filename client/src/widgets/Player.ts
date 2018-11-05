import { Widget } from "./Widget";
import { Event, EventBus, ProjectLoaded, AnnounceExternalFunctions, Run, Stop } from "./Events";
import { RobotWorld } from "./RobotWorld";
import { Api, Project } from "../Api";
import { compile, ExternalFunctionsTypesConstants } from "../language/Compiler";
import { VirtualMachine, VirtualMachineState } from "../language/VirtualMachine";

export class Player extends Widget {
	private world: RobotWorld;
	private extFuncs: ExternalFunctionsTypesConstants;
	private vm: VirtualMachine = null;

	constructor(private project: Project, private autoplay = false, private showSourceLink = false, bus: EventBus = new EventBus()) {
		super(bus);
		this.world = new RobotWorld(bus, true);
	}

	render(): HTMLElement {
		this.bus.addListener(this);
		this.bus.addListener(this.world);

		let dom = $(/*html*/`
			<div class="pb-player-widget">
				<div id="pb-player-buttons">
					<div id="pb-player-run" class="pb-debugger-run-icon pb-debugger-button"></div>
					<div id="pb-player-stop" class="pb-debugger-stop-icon pb-debugger-button"></div>
					<a id="pb-player-source" href=""><i class="fas fa-code"></i> Source</a>
				</div>
			</div>
		`);
		dom.append(this.world.render());

		if (this.showSourceLink) {
			dom.find("#pb-player-source").attr("href", "/project.html?id=" + this.project.code);
		} else {
			dom.find("#pb-player-source").hide();
		}

		let advanceVm = () => {
			this.vm.run(1000);
			if (this.vm.state != VirtualMachineState.Completed) {
				requestAnimationFrame(advanceVm);
			} else {
				this.bus.event(new Stop());
				this.vm.restart();
				this.vm.state = VirtualMachineState.Completed;
				stop.hide();
				run.show();
			}
		};

		let run = dom.find("#pb-player-run");
		run.click(() => {
			this.bus.event(new Run());
			stop.show();
			run.hide();
			this.vm.restart()
			advanceVm();
		})

		let stop = dom.find("#pb-player-stop");
		stop.hide();
		stop.click(() => {
			this.bus.event(new Stop());
			this.vm.restart();
			this.vm.state = VirtualMachineState.Completed;
			stop.hide();
			run.show();
		});

		try {
			let module = compile((this.project.contentObject as any).code, this.extFuncs);
			this.vm = new VirtualMachine(module.functions, module.externalFunctions);
			this.bus.event(new ProjectLoaded(this.project));
			if (this.autoplay) run.click();
		} catch(e) {
			run.hide();
			stop.hide();
		}

		return dom[0];
	}
	onEvent(event: Event) {
		if (event instanceof AnnounceExternalFunctions) {
			this.extFuncs = event.functions;
		}
	}
}