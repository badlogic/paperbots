import { EventBus, EventListener, Event } from "./widgets/Events"
import { Toolbar, ToolbarMode } from "./widgets/Toolbar";
import { Api, Project } from "./Api";
import { Dialog } from "./widgets/Dialog";
import { Player } from "./widgets/Player";
import { ProjectPreview } from "./widgets/ProjectPreview";

export class IndexPage implements EventListener {
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
			<div id="pb-index-page">
				<img style="display: inline-block; margin-top: 2em;" height="200px" src="img/paperbots.svg">
				<h1 style="text-align: center">Want to learn how to code?</h1>
				<div style="margin-bottom: 2em;">
					<a class="pb-button" href="/learn.html">Teach me how to code</a>
					<a class="pb-button" href="/devs.html">I am a programmer</a>
				</div>
				<div id="pb-index-page-example"></div>
				<div class="pb-page-section">
					<h1>What is Paperbots?</h1>

					<p>Paperbots lets you write different types of programs, from
						instructions for a robot, to games and interactive art. Best of
						all: you can share your programs with your friends!</p>

					<p>If you do not yet know how to program, the <a href="/learn.html">Paperbots course</a>
						will teach you all you need to know.</p>

					<p>Are you a seasoned programmer? Great! Read the <a href="/for-devs.html">language documentation</a>, then create interesting programs
						others can remix and learn from.</p>
				</div>
				<h1>Featured projects</h1>
				<div class="pb-index-page-featured">
				</div>
			</div>
		`);

		Api.loadProject("IgMlfr", project => {
			dom.find("#pb-index-page-example").append(new Player(project, true, true).render());
		}, () => {});

		$(parent).append(dom);

		// Migration for old URLs
		let projectId = Api.getUrlParameter("projectId")
		if (projectId) {
			(window.location as any) = `/project.html?id=${projectId}`;
		}

		// TODO once this page is implemented
		// stop redirecting.
		// (window.location as any) = "/project.html"

		Api.getFeaturedProjects((projects) => {
			let featured = dom.find(".pb-index-page-featured");
			projects.forEach(project => {
				let card = $(/*html*/`
					<div class="pb-featured-card">
						<div class="pb-featured-card-player"></div>
						<a class="pb-featured-card-title" href="${Api.getProjectUrl(project.code)}">${project.title}</a>
						<div><span>by </span><a href="${Api.getUserUrl(project.userName)}">${project.userName}</a></div>
					</div>
				`);
				card.find(".pb-featured-card-player").append(new Player(project, false, false).render());
				featured.append(card)
			});
		}, () => {
			Dialog.alert("Sorry", $("Couldn't get the featured projects from the server. If this problem persists"));
		});
	}

	onEvent(event: Event) {
	}
}