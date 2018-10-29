import { EventBus, EventListener, Event } from "./widgets/Events"
import { Toolbar, ToolbarMode } from "./widgets/Toolbar";
import { Api, Project } from "./Api";
import { Dialog } from "./widgets/Dialog";
import { ProjectPreview } from "./widgets/ProjectPreview";
import { Player } from "./widgets/Player";

export class UserPage implements EventListener {
	private eventBus = new EventBus();
	private toolbar = new Toolbar(this.eventBus, ToolbarMode.UserPage);

	constructor (parent: HTMLElement) {
		// Register the components
		this.eventBus.addListener(this);
		this.eventBus.addListener(this.toolbar);

		// Add the toolbar at the top of the page
		parent.append(this.toolbar.render());

		// Render the components
		let dom = $(/*html*/ `
			<div id="pb-user-page">
			</div>
		`);
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
		Api.getUserProjects(userId, true,
			(projects) => {
				this.renderUser(dom, userId, projects);
			}, (error) => {

			}
		);
	}

	renderUser(dom: JQuery, userId: string, projects: Project[]) {
		dom.append($(/*html*/`
			<div class="pb-page-section">
				<h1>${userId}'s projects</h1>
				<div class="pb-project-list">
					<div class="pb-project-list-sort">
						<span>Sort by:</span>
						<select>
							<option value="lastmodified">Last modified</option>
							<option value="newest">Newest</option>
							<option value="oldest">Oldest</option>
						</select>
					</div>
				</div>
			</div>
		`));

		let projectsDom = dom.find(".pb-project-list");
		projects.forEach(project => {
			let projectDom = $(/*html*/`
				<div class="pb-project-list-item">
				</div>
			`);
			try {
				project.contentObject = JSON.parse(project.content);
				let preview = new Player(project, false, false).render()
				projectDom.append(preview);
				projectDom.append(/*html*/`
					<div class="pb-project-list-item-description">
						<h3><a href="${Api.getProjectUrl(project.code)}">${project.title}</a></h3>
						<table>
							<tr><td>Created:</td><td>${project.created}</td></tr>
							<tr><td>Last modified:</td><td>${project.lastModified}</td></tr>
						</table>
					</div>
				`);
				if (project.userName == Api.getUserName()) {
					projectDom.append(/*html*/`
						<i class="pb-project-list-item-delete fas fa-trash-alt"></i>
					`)
					projectDom.find(".pb-project-list-item-delete").click(() => {

					});
				}
				projectDom.appendTo(projectsDom);
			} catch (e) {
				console.log("Couldn't load world data for project " + project.code + ".");
			}
		})
	}

	onEvent(event: Event) {
	}
}