import { EventBus, EventListener, Event } from "./widgets/Events"
import { Toolbar, ToolbarMode } from "./widgets/Toolbar";
import { Api, Project } from "./Api";
import { Dialog } from "./widgets/Dialog";
import { ProjectPreview } from "./widgets/ProjectPreview";

export class UserPage implements EventListener {
	private eventBus = new EventBus();
	private toolbar = new Toolbar(this.eventBus, ToolbarMode.UserPage);

	constructor (parent: JQuery) {
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
		if (!userId) {
			let dialog = Dialog.alert("Sorry", $(`<p>This user doesn't exist.</p>`));
			dialog.buttons[0].click(() => {
				(window.location as any) = "/";
			})
			dialog.show();
		} else {
			Api.getUserProjects(userId, true,
				(projects) => {
					this.renderUser(dom, userId, projects);
				}, (error) => {

				}
			);
		}
	}

	renderUser(dom: JQuery, userId: string, projects: Project[]) {
		let projectsDom = ($(/*html*/`
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

		projects.forEach(project => {
			let projectDom = $(/*html*/`
				<div class="pb-project-list-item">
				</div>
			`);
			try {
				project.contentObject = JSON.parse(project.content);
				let preview = new ProjectPreview(project).render()
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
					let deleteButton = $(/*html*/`<i class="pb-project-list-item-delete fas fa-trash-alt"></i>`);
					projectDom.append(deleteButton);
					deleteButton.click(() => {
						Dialog.confirm("Delete project", $(`<p>Are you sure you want to delete project '${project.title}'?</p>`), () => {
							Api.deleteProject(project.code, () => {
								projectDom.fadeOut(1000);
							}, () => {
								Dialog.alert("Sorry", $(`<p>Could not delete project '${project.title}'.</p>`));
							});
						}).show();
					});
				}
				projectDom.appendTo(projectsDom);
				(projectDom[0] as any).project = project;
			} catch (e) {
				console.log("Couldn't load world data for project " + project.code + ".");
			}
		})

		projectsDom.find(".pb-project-list-sort > select").on("change", function() {
			let sort;
			let selected = $(this).val();
			let projects = projectsDom.find(".pb-project-list-item")
			projects.detach();
			projects.toArray().sort((a, b) => {
				let projectA = (a as any).project as Project;
				let projectB = (b as any).project as Project;

				if (selected == "newest") {
					return projectA.created > projectB.created ? -1 : 1;
				} else if  (selected == "oldest") {
					return projectA.created < projectB.created ? -1 : -1;
				} else if (selected == "lastmodified") {
					return projectA.lastModified > projectB.lastModified ? -1 : 1;
				} else {
					return 0;
				}
			}).forEach(project => {
				projectsDom.append(project);
			});

		});

		dom.append(projectsDom);
	}

	onEvent(event: Event) {
	}
}