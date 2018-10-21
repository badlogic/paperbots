import { EventBus, EventListener, Event } from "./widgets/Events"
import { Toolbar, ToolbarMode } from "./widgets/Toolbar";
import { Api } from "./Api";
import { Dialog } from "./widgets/Dialog";

export class UserPage implements EventListener {
	private eventBus = new EventBus();
	private toolbar = new Toolbar(this.eventBus, ToolbarMode.UserPage);

	constructor (parent: HTMLElement) {
		// Register the components
		this.eventBus.addListener(this);
		this.eventBus.addListener(this.toolbar);

		// Render the components
		let dom = $(/*html*/ `
			<div id="pb-user-page">
			</div>
		`);
		dom.append(this.toolbar.render());
		$(parent).append(dom);

		// Check if we got a user id, and if so, load that users
		// projects. The id is the user name.
		var userId = Api.getUserId();
		if (!userId) userId = Api.getUserName();
		if (!userId) {
			let dialog = Dialog.alert("Sorry", $(`<p>This user doesn't exist.</p>`));
			dialog.buttons[0].click(() => {
				(window.location as any) = "/";
			})
			dialog.show();
		}
		Api.getUserProjects(userId,
			(projects) => {
				dom.append(`<h1>${userId}<h1>`)
			}, (error) => {

			}
		);
	}

	onEvent(event: Event) {
	}
}