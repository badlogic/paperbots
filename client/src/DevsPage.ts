import { EventBus, EventListener, Event } from "./widgets/Events"
import { Toolbar, ToolbarMode } from "./widgets/Toolbar";
import { Api, Project } from "./Api";
import { Dialog } from "./widgets/Dialog";
import { Player } from "./widgets/Player";
import { ProjectPreview } from "./widgets/ProjectPreview";

export class DevsPage implements EventListener {
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

					<p>
						Paperbots is an educational programming environment running in the browser. It
						was created to enable teaching or self-learning of computational thinking and programming.
					</p>

					<p>Paperbots consists of:</p>
					<ul>
						<li>The <a href="https://github.com/badlogic/paperbots/tree/master/client/src/language">Wee programming language, compiler and virtual machine.</a></li>
						<li>The <a href="/">Paperbots website</a>, where users can
							<ul>
								<li>Create an account.</li>
								<li>Create programs for different micro worlds in a browser based IDE.</li>
								<li>Save programs to their account.</li>
								<li>Share programs with others.</li>
							</ul>
						</li>
						<li>The <a href="/learn.html">Paperbots course</a> guiding beginner's through learning computational thinking and programming.</li>
					</ul>

					<h1>Why Paperbots?</h1>
					<p>
						The foremost goal of Paperbots is to make it easier to learn (and teach) computational
						thinking and programming.
					</p>
					<p>
						There are many educational programming environments, like <a href="https://scratch.mit.edu">Scratch</a>,
						commonly in use in computing education. Scratch is a great way to give kids up until the age of 12 a taste
						of computing. However, past that age, Scratch is viewed as being "for kids" and "not being the real deal".
						Young adults want something that is closer to the "real world". It is also not immediately clear
						how to go from Scratch to a "real" programming environment.
					<p>
						In that real world, "professional" programming languages, like Python or Lua, are touted as being great for
						beginners. While these languages are indeed great, their surrounding programming
						environments and ecosystems are very complex. It is non-trivial to get setup, and the development
						environments are overwhelming. It is also very hard to share programs you've created with
						these tools.
					</p>
					<p>
						With Paperbots, I'm trying to build a bridge between the world of Scratch and professional programming
						environments.
					</p>

					<h1>I know how to program, why should I care?</h1>
					<p>
						Because Paperbots is not only an educational tool, but also a recreational tool. If you are looking
						for a simple environment to quickly whip up and share ideas for small games or generative art,
						Paperbots might be for you.
					</p>
					<p>
						As a side-effect, your programs can serve as inspiration for beginners! And maybe yourself
						have kids or friends who'd like to get a glimpse into computational programming. Maybe Paperbots
						can be their pathway into that particular rabbit hole.
					</p>

					<h1>How to use this site</h1>
					<h2>Accounting</h2>
					<p>
						You may already have noticed the <code>Sign up</code> and <code>Log in</code> buttons in the top
						right corner. You can create a new account with the former, or log in with the latter by providing
						your user name or email address.
					</p>
					<p>
						Once you are logged in, your <code>user name</code> will appear in the top right corner. Click it to quickly
						access your most recent programs, view your profile, or log out.
					</p>
					<p>
						With an account, you can save and share your programs, and access them from multiple devices.
						That said, an account is not a requirement for creating programs on this site. They will however
						get lost forever as soon as you close the browser tab.
					</p>

					<h2>Creating and saving programs</h2>
					<p>
						The <code>New</code> button in the top left corner will open a blank program in the Paperbots IDE.</p>
					<p>
						Inside the IDE, you will get an additional button called <code>Save</code> that lets you save your
						program (provided you are logged in). The <code>Save</code> is also available when viewing other people's
						projects. Clicking it will save a copy of that program into your account.
					</p>

					<h2>A quick IDE tour</h2>


				</div>
			</div>
		`);

		$(parent).append(dom);
	}

	onEvent(event: Event) {
	}
}