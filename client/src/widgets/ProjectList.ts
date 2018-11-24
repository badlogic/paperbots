import { Widget } from "./Widget";
import { Event, EventBus } from "./Events"
import { Project, Api, Sorting } from "../Api";
import { Dialog } from "./Dialog";
import { ProjectPreview } from "./ProjectPreview";

export class ProjectList extends Widget {
	private projectsDom: JQuery;
	private projects: Array<Project> = [];
	private sorting: Sorting = "LastModified";

	constructor(bus: EventBus, private provider: (sorting: Sorting, dateOffset: string, success: (projects: Array<Project>) => void, error: () => void) => void) {
		super(bus);
	}

	render(): HTMLElement {
		let projectsDom = this.projectsDom = ($(/*html*/`
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
		`));

		let self = this;
		projectsDom.find(".pb-project-list-sort > select").on("change", function () {
			let selected = $(this).val();
			if (selected == "newest") {
				self.sorting = "Newest";
			} else if  (selected == "oldest") {
				self.sorting = "Oldest";
			} else if (selected == "lastmodified") {
				self.sorting = "LastModified"
			}
			self.projects.length = 0;
			projectsDom.find(".pb-project-list-item").remove();
			self.fetchProjects();
		});

		window.onscroll = () => {
			let scrollHeight = document.body.scrollHeight;
			let totalHeight = window.scrollY + window.innerHeight;
			if(totalHeight>= scrollHeight - 100) {
				this.fetchProjects();
			}
		};
		this.fetchProjects();
		return projectsDom[0];
	}

	private fetching = false;
	private fetchProjects() {
		if (this.fetching) return;
		console.log("Fetching");
		this.provider(this.sorting, this.projects.length == 0 ? null : this.projects[this.projects.length - 1].created,
			(projects: Project[]) => {
				this.renderProjects(projects);
				projects.forEach(project => this.projects.push(project));
				this.fetching = false;
			}, () => {
				Dialog.alert("Error", $("<p>Couldn't retrieve projects.</p>")).show();
				this.fetching = false;
			});
		this.fetching = true;
	}

	private renderProjects(projects: Array<Project>) {
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
				projectDom.appendTo(this.projectsDom);
				(projectDom[0] as any).project = project;
			} catch (e) {
				console.log("Couldn't load world data for project " + project.code + ".");
			}
		})
	}

	onEvent(event: Event) {
	}
}