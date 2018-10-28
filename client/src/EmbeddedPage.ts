import { EventBus, EventListener, Event, SourceChanged } from "./widgets/Events"
import { Player } from "./widgets/Player"
import { Api } from "./Api";
import { Dialog } from "./widgets/Dialog";

export class EmbeddedPage {
	constructor(parent: JQuery) {
		let dom = $(/*html*/`
			<div id="pb-embed-page">
			</div>
		`);

		Api.loadProject(Api.getProjectId(), project => {
			dom.append(new Player(project).render());
		}, () => {
			Dialog.alert("Sorry", $(`Could not load project ${Api.getProjectId()}`));
		})
		parent.append(dom);
	}
}