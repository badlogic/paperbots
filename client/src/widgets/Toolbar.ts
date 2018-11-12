import { Widget } from "./Widget"
import { EventBus, Event, LoggedIn, LoggedOut, Debug, Run, Stop, ProjectLoaded, BeforeSaveProject, ProjectSaved, ProjectChanged } from "./Events";
import { Dialog } from "./Dialog";
import { Api, Project } from "../Api";
import { setElementEnabled, escapeHtml, unescapeHtml } from "../Utils";
import { ProjectPage } from "../ProjectPage";

export enum ToolbarMode {
	ProjectPage,
	UserPage,
	IndexPage
}

export class Toolbar extends Widget {
	mode: ToolbarMode;

	by: JQuery;
	new: JQuery;
	save: JQuery;
	title: JQuery;
	login: JQuery;
	signup: JQuery;
	user: JQuery;
	profile: JQuery;

	loadedProject: Project;

	constructor(bus: EventBus, mode: ToolbarMode) {
		super(bus);
		this.mode = mode;
	}

	render(): HTMLElement {
		let dom = $(/*html*/`
			<div id="pb-toolbar">
				<a href="/" id="pb-toolbar-logo" class="pb-toolbar-button"><span id="pb-toolbar-logo-long">Paperbots</span><span id="pb-toolbar-logo-short">PB</span></a>
				<div id="pb-toolbar-new" class="pb-toolbar-button"><i class="far fa-file"></i><span>New</span></div>
				<div id="pb-toolbar-save" class="pb-toolbar-button"><i class="far fa-save"></i><span>Save</span></div>
				<input id="pb-toolbar-title" type="text" value="Untitled project">
				<div id="pb-toolbar-by" class="pb-toolbar-button"></div>
				<div style="flex: 1;"></div>
				<div id="pb-toolbar-login" class="pb-toolbar-button"><i class="far fa-user-circle"></i><span>Log in</span></div>
				<div id="pb-toolbar-signup" class="pb-toolbar-button"><i class="fas fa-user-plus"></i><span>Sign up</span></div>
				<div id="pb-toolbar-user" class="pb-toolbar-button pb-dropdown">
					<div><i class="fas fa-user-circle"></i><span id="pb-user-name"></span></div>
					<div class="pb-dropdown-content">
						<a id="pb-toolbar-profile"><i class="fas fa-project-diagram"></i>My Projects</a>
						<a id="pb-toolbar-logout"><i class="fas fa-sign-out-alt"></i> Log out</a>
					</div>
				</div>
			</div>
		`);

		this.by = dom.find("#pb-toolbar-by");

		this.new = dom.find("#pb-toolbar-new");
		this.new.click(() => {
			this.newDialog();
		});

		this.save = dom.find("#pb-toolbar-save");
		this.save.click(() => {
			this.saveProject();
		});

		this.title = dom.find("#pb-toolbar-title");
		this.title.change(() => {
			this.bus.event(new ProjectChanged());
		});

		this.login = dom.find("#pb-toolbar-login");
		this.login.click((e) => {
			this.loginDialog();
			e.preventDefault();
		});

		this.signup = dom.find("#pb-toolbar-signup");
		this.signup.click(() => {
			this.signupDialog();
		});
		this.user = dom.find("#pb-toolbar-user");
		var justClicked = false;
		this.user.click(() => {
			justClicked = true;
			$(".pb-dropdown-content").toggle();
		});
		this.profile = dom.find("#pb-toolbar-profile");

		dom.find("#pb-toolbar-logout").click(() => {
			Api.logout(() => { this.bus.event(new LoggedOut()) }, () => { this.serverErrorDialog() });
		});

		this.setupLoginAndUser();

		window.onclick = function (event) {
			if (justClicked) {
				justClicked = false;
				return;
			}
			if (!(event.target as any).matches('#pb-toolbar-user')) {
				var dropdowns = document.getElementsByClassName("pb-dropdown-content");
				var i;
				for (i = 0; i < dropdowns.length; i++) {
					$(dropdowns[i]).hide();
				}
			}
		}

		if (this.mode == ToolbarMode.UserPage) {
			// Disable everything not needed on the user page
			this.by.hide();
			this.save.hide();
			this.title.hide();
		} else if (this.mode == ToolbarMode.IndexPage) {
			this.by.hide();
			this.save.hide();
			this.title.hide();
		} else {
			// CMD + s and CTRL + s for saving
			document.addEventListener("keydown", (e) => {
				if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
					e.preventDefault();
					this.saveProject()
				}
			}, false);
		}

		return dom[0];
	}

	private setupLoginAndUser () {
		let userName = Api.getUserName();
		if (userName) {
			this.login.hide()
			this.signup.hide();
			this.user.find("#pb-user-name").text(userName);
			this.user.show();
			this.profile.attr("href", Api.getUserUrl(Api.getUserName()));
		} else {
			this.login.show()
			this.signup.show();
			this.user.hide();
		}
	}

	private newDialog () {
		let content = $(/*html*/`
		<div style="display: flex; flex-direction: column; width: 100%; height: 100%;">
			<p>Pick the typ of program you want to write!</p>
			<div style="display: flex; flex-direction: row; width: 100%;">
				<div id="pb-new-robot-program" style="cursor: pointer; display: flex; flex-direction: row; padding: 0.5em; margin-right: 0.5em; position: relative">
					<img src="/img/new-robot-world.png">
					<span style="position: absolute; left: 0; bottom: 0; width: 100%; text-align: center; padding: 0.5em; color: white; background: rgba(0, 0, 0, 0.75);">Robot program</span>
				</div>
				<div id="pb-new-canvas-program" style="cursor: pointer; display: flex; flex-direction: row; padding: 0.5em; position: relative">
					<img style="width: 100%;" src="/img/new-canvas-world.png">
					<span style="position: absolute; left: 0; bottom: 0; width: 100%; text-align: center; padding: 0.5em; color: white; background: rgba(0, 0, 0, 0.75);">Canvas program</span>
				</div>
			</div>
		</div>`
		);

		content.find("#pb-new-robot-program").click(() => {
			(window.location as any) = "/project.html";
		});

		content.find("#pb-new-canvas-program").click(() => {
			(window.location as any) = "/project.html?type=canvas";
		});

		let dialog = new Dialog("New Project", content[0], ["Cancel"]);
		dialog.buttons[0].click(() => {
			dialog.hide();
		});
		dialog.show();
	}

	private loginDialog (email: string = "") {
		let content = $(/*html*/`
		<div style="display: flex; flex-direction: column; width: 100%; height: 100%;">
			<p>Enter your email address or user name below.</p>
			<input id="pb-signup-email-or-user" class="pb-input-field" placeholder="Email or username">
			<div id="pb-error"></div>
			<div id="pb-spinner" class="fa-3x" style="text-align: center; margin: 0.5em"><i class="fas fa-spinner fa-pulse"></i></div>
		</div>`
		);
		let emailOrUser = content.find("#pb-signup-email-or-user");
		emailOrUser.focus();
		if (email.length > 0 ) emailOrUser.val(email);
		let spinner = content.find("#pb-spinner");
		spinner.hide()
		let error = content.find("#pb-error");
		error.hide();

		let dialog = new Dialog("Log in", content[0], ["Cancel", "Log in"]);
		dialog.buttons[0].click(() => {
			dialog.hide();
		});
		dialog.buttons[1].click(() => {
			Api.login(emailOrUser.val() as string,
			() => {
				dialog.hide();
				this.verifyDialog();
			},
			(userDoesNotExist) => {
				if (userDoesNotExist) {
					spinner.hide();
					dialog.buttons.forEach(button => button.show());
					error.show();
					error.html(/*html*/`
						<p class="pb-dialog-error">
							Sorry, the email/user name you specified does not exist.
						</p>
					`);
				} else {
					dialog.hide();
					this.serverErrorDialog();
				}
			});
			error.hide();
			spinner.show();
			dialog.buttons.forEach(button => button.hide());
		});
		dialog.show();
	}

	private verifyDialog () {
		let content = $(/*html*/`
		<div style="display: flex; flex-direction: column; width: 100%; height: 100%;">
			<p>We have sent you an email with a magic code! Please enter it below.</p>
			<input id="pb-signup-code" class="pb-input-field" style="text-align: center;" placeholder="Code">
			<div id="pb-error"></div>
			<div id="pb-spinner" class="fa-3x" style="text-align: center; margin: 0.5em"><i class="fas fa-spinner fa-pulse"></i></div>
		</div>`
		);
		let emailOrUser = content.find("#pb-signup-code");
		let spinner = content.find("#pb-spinner");
		spinner.hide()
		let error = content.find("#pb-error");
		error.hide();

		let dialog = new Dialog("Magic code", content[0], ["Cancel", "Log in"]);
		dialog.buttons[0].click(() => {
			dialog.hide();
		});
		dialog.buttons[1].click(() => {
			Api.verify(emailOrUser.val() as string,
			() => {
				dialog.hide();
				this.bus.event(new LoggedIn());
			},
			(invalidCode) => {
				if (invalidCode) {
					spinner.hide();
					dialog.buttons.forEach(button => button.show());
					error.show();
					error.html(/*html*/`
						<p class="pb-dialog-error">
							Sorry, the code you entered is incorrect.
						</p>
					`);
				} else {
					dialog.hide();
					this.serverErrorDialog();
				}
			});
			error.hide();
			spinner.show();
			dialog.buttons.forEach(button => button.hide());
		})
		dialog.show();
	}

	signupDialog () {
		let content = $(/*html*/`
		<div style="display: flex; flex-direction: column; width: 100%; height: 100%;">
			<p>Enter your email address and user name below.</p>
			<input id="pb-signup-email" class="pb-input-field" placeholder="Email">
			<input id="pb-signup-name" class="pb-input-field" placeholder="User name">
			<p style="font-size: 12px">User names must be between 4 and 25 characters, letters and digits only.</p>
			<div id="pb-error"></div>
			<div id="pb-spinner" class="fa-3x" style="text-align: center; margin: 0.5em"><i class="fas fa-spinner fa-pulse"></i></div>
		</div>`
		);
		let email = content.find("#pb-signup-email");
		email.focus();
		let name = content.find("#pb-signup-name");
		let spinner = content.find("#pb-spinner");
		spinner.hide()
		let error = content.find("#pb-error");
		error.hide();

		let dialog = new Dialog("Sign up", content[0], ["Cancel", "Sign up"]);
		dialog.buttons[0].click(() => {
			dialog.hide();
		});
		dialog.buttons[1].click(() => {
			Api.signup(email.val() as string, name.val() as string,
			() => {
				dialog.hide();
				this.verifyDialog();
			},
			(reqError) => {
				if (reqError.error == "InvalidEmailAddress" || reqError.error == "InvalidUserName") {
					spinner.hide();
					dialog.buttons.forEach(button => button.show());
					error.show();
					error.html(/*html*/`
						<p class="pb-dialog-error">
							Sorry, the email or user name you specified is invalid.
						</p>
					`);
				} else if (reqError.error == "UserExists") {
					spinner.hide();
					dialog.buttons.forEach(button => button.show());
					error.show();
					error.html(/*html*/`
						<p class="pb-dialog-error">
							Sorry, that name is not available. Please pick another one.
						</p>
					`);
				} else if (reqError.error == "EmailExists") {
					spinner.hide();
					dialog.buttons.forEach(button => button.show());
					error.show();
					let content = $(/*html*/`
						<p class="pb-dialog-error">
							Sorry, that email is already registered. <a id="pb-login-link" style="cursor: pointer">Log in!</a>
						</p>
					`);
					content.find("#pb-login-link").click(() => {
						dialog.hide();
						this.loginDialog(email.val() as string);
					})
					error.empty();
					error.append(content[0]);
				} else {
					dialog.hide();
					this.serverErrorDialog();
				}
			});
			error.hide();
			spinner.show();
			dialog.buttons.forEach(button => button.hide());
		});
		dialog.show();
	}

	serverErrorDialog () {
		Dialog.alert("Sorry!", $(/*html*/`<p>We couldn't reach the server. If the problem persists, let us know at <a href="mailto:contact@paperbots.com">contact@paperbots.io</a></p>`));
	}

	saveProject () {
		if (!Api.getUserName()) {
			Dialog.alert("Sorry", $(`<p>You need to be logged in to save a project.<p>`)).show();
			return;
		}

		if ((this.title.val() as string).trim().length == 0) {
			Dialog.alert("Sorry", $(`<p>Can not save project without a title<p>`)).show();
			return;
		}

		let internalSave = () => {
			let content = $(/*html*/`
			<div style="display: flex; flex-direction: column; width: 100%; height: 100%;">
				<p>Saving project '${escapeHtml(this.title.val() as string)}', just a second!</p>
				<div id="pb-spinner" class="fa-3x" style="text-align: center; margin: 0.5em"><i class="fas fa-spinner fa-pulse"></i></div>
			</div>`
			);
			let spinner = content.find("#pb-spinner");
			let dialog = new Dialog("Saving", content[0], []);
			dialog.show();

			let saveProject = new BeforeSaveProject({
				// If the project doesn't belong to us, we save a copy
				// to our account, so code = null.
				code: this.loadedProject && this.loadedProject.userName == Api.getUserName() ? Api.getProjectId() : null,
				contentObject: { },
				content: null,
				created: null,
				description: "",
				lastModified: null,
				public: true,
				title: this.title.val() as string,
				userName: Api.getUserName(),
				type: "robot"
			});

			// All other components can now write to contentObject
			this.bus.event(saveProject);

			try {
				saveProject.project.content = JSON.stringify(saveProject.project.contentObject);
				delete saveProject.project.contentObject;
			} catch (e) {
				dialog.hide();
				Dialog.alert("Sorry", $(`<p>An error occured while saving the project.<p>`)).show();
				return;
			}

			Api.saveProject(saveProject.project, (projectCode) => {
				if (!this.loadedProject) this.loadedProject = saveProject.project;
				this.loadedProject.code = projectCode;
				this.loadedProject.userName = Api.getUserName();
				dialog.hide();
				history.pushState(null, document.title, Api.getProjectUrl(projectCode))
				this.bus.event(new ProjectSaved());
			}, (error) => {
				this.serverErrorDialog();
				dialog.hide();
			});
		}

		if (this.loadedProject && this.loadedProject.userName != Api.getUserName()) {
			Dialog.confirm("Copy?", $(`<div><p>The project you want to save belongs to <a target="_blank" href="${Api.getUserUrl(this.loadedProject.userName)}">${this.loadedProject.userName}</a>.</p><p>Do you want to make a copy and store it in your account?</p></div>`), () => {
				internalSave();
			}).show();
		} else {
			internalSave();
		}
	}

	onEvent(event: Event) {
		if (event instanceof LoggedIn || event instanceof LoggedOut) {
			this.setupLoginAndUser();
		} else if(event instanceof Run || event instanceof Debug) {
			setElementEnabled(this.save, false);
			setElementEnabled(this.new, false);
			setElementEnabled(this.title, false);
		} else if (event instanceof Stop) {
			setElementEnabled(this.save, true);
			setElementEnabled(this.new, true);
			setElementEnabled(this.title, true);
		} else if (event instanceof ProjectLoaded) {
			this.loadedProject = event.project;
			this.title.val(unescapeHtml(event.project.title));
			if (this.loadedProject.userName != Api.getUserName()) {
				this.by.html(/*html*/`
					<span>by </span><a href="${Api.getUserUrl(this.loadedProject.userName)}">${this.loadedProject.userName}</a>
				`);
			} else {
				this.by.html("");
			}
		} else if (event instanceof ProjectSaved) {
			this.by.hide();
		}
	}
}