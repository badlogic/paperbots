import { EventBus, EventListener, Event } from "./widgets/Events"
import { Toolbar, ToolbarMode } from "./widgets/Toolbar";
import { Api, Project } from "./Api";
import { Dialog } from "./widgets/Dialog";
import { Player } from "./widgets/Player";
import { ProjectPreview } from "./widgets/ProjectPreview";

export class LearnPage implements EventListener {
	private eventBus = new EventBus();
	private toolbar = new Toolbar(this.eventBus, ToolbarMode.UserPage);

	constructor (parent: HTMLElement) {
		// Register the components
		this.eventBus.addListener(this);
		this.eventBus.addListener(this.toolbar);
		this.eventBus.addListener(this)

		// Add the toolbar to the parent directly
		parent.append(this.toolbar.render());

		// Render the components
		let dom = $(/*html*/ `
			<div id="pb-learn-page">
				<img style="display: inline-block; margin-top: 2em;" height="200px" src="img/paperbots.svg">
				<div class="pb-page-section">
					<h1>What is Paperbots?</h1>

					<p>Paperbots lets you write different types of programs, from
						instructions for a robot, to games and interactive art. Best of
						all: you can share them with your friends, and they can share
						their programs with you!</p>

					<p>If you do not yet know how to program, the Paperbots course
						will teach you all you need to know.</p>

					<p>Are you a seasoned programmer? Great! Create interesting programs
						so others can learn and remix them. <code>ests</code></p>
				</div>
			</div>
		`);

		$(parent).append(dom);
	}

	onEvent(event: Event) {
	}
}