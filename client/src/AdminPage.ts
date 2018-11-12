import { EventBus, EventListener, Event } from "./widgets/Events"
import { Toolbar, ToolbarMode } from "./widgets/Toolbar";
import { Api, Project, Sorting } from "./Api";
import { Dialog } from "./widgets/Dialog";

export class AdminPage implements EventListener {
	private eventBus = new EventBus();
	private toolbar = new Toolbar(this.eventBus, ToolbarMode.UserPage);
	private projects: Project[] = [];
	private fetching = false;

	constructor (parent: HTMLElement) {
		// Register the components
		this.eventBus.addListener(this);
		this.eventBus.addListener(this.toolbar);

		// Add the toolbar at the top of the page
		parent.append(this.toolbar.render());

		// Render the components
		let dom = $(/*html*/ `
			<div id="pb-admin-page">
				<h1>Administration</h1>
				<div class="pb-project-list" style="width: 100%">
				</div>
			</div>
		`);
		$(parent).append(dom);

		this.fetchProjects(dom.find(".pb-project-list"));
		window.onscroll = () => {
			var scrollHeight, totalHeight;
			scrollHeight = document.body.scrollHeight;
			totalHeight = window.scrollY + window.innerHeight;
			if(totalHeight >= scrollHeight) {
				this.fetchProjects(dom.find(".pb-project-list"));
			}
		}
	}

	fetchProjects (projectListDom: JQuery) {
		if (this.fetching) return;
		console.log("Fetching");
		Api.getProjectsAdmin("Newest", this.projects.length == 0 ? null : this.projects[this.projects.length - 1].created,
			(projects: Project[]) => {
				this.renderProjects(projectListDom, projects);
				this.fetching = false;
			}, () => {
				Dialog.alert("Error", $("<p>Couldn't retrieve projects.</p>")).show();
				this.fetching = false;
			});
		this.fetching = true;
	}

	renderProjects(dom: JQuery, projects: Project[]) {
		projects.forEach(project => {
			this.projects.push(project);
			let projectDom = $(/*html*/`
				<div class="pb-project-list-item">
					<div class="pb-project-list-item-description">
						<h3><a href="${Api.getProjectUrl(project.code)}">${project.title}</a></h3>
						<table>
							<tr><td>User:</td><td><a href="${Api.getUserUrl(project.userName)}">${project.userName}</a></td></tr>
							<tr><td>Created:</td><td>${project.created}</td></tr>
							<tr><td>Last modified:</td><td>${project.lastModified}</td></tr>
						</table>
					</div>
				</div>
			`);
			dom.append(projectDom);
		});
	}

	onEvent(event: Event) {
	}
}