import { Widget } from "./Widget"
import { EventBus, Event, LoggedIn, LoggedOut } from "./Events";
import { Dialog } from "./Dialog";
import { Api } from "../Api";

export class Toolbar extends Widget {
	save: JQuery;
	copy: JQuery;
	title: JQuery;
	login: JQuery;
	signup: JQuery;
	user: JQuery;

	constructor(bus: EventBus) {
		super(bus);
	}

	render(): HTMLElement {
		let dom = $(/*html*/`
			<div id="pb-toolbar">
				<a href="/" id="pb-toolbar-logo" class="pb-toolbar-button">Paperbots</a>
				<input id="pb-toolbar-title" type="text" value="Untitled project">
				<div id="pb-toolbar-save" class="pb-toolbar-button"><i class="far fa-save"></i>Save</div>
				<div id="pb-toolbar-copy" class="pb-toolbar-button"><i class="far fa-copy"></i>Copy</div>
				<div id="pb-toolbar-login" class="pb-toolbar-button"><i class="far fa-user-circle"></i>Log in</div>
				<div id="pb-toolbar-signup" class="pb-toolbar-button"><i class="fas fa-user-plus"></i>Sign up</div>
				<div id="pb-toolbar-user" class="pb-toolbar-button dropdown">
					<i class="fas fa-user-circle"></i><span id="pb-user-name"></span>
					<div class="dropdown-content">
						<a id="pb-toolbar-projects"><i class="fas fa-project-diagram"></i> Projects</a>
						<a id="pb-toolbar-profile"><i class="fas fa-user-circle"></i> Profile</a>
						<a id="pb-toolbar-logout"><i class="fas fa-sign-out-alt"></i> Log out</a>
					</div>
				</div>
			</div>
		`);

		this.save = dom.find("#pb-toolbar-save");
		this.copy = dom.find("#pb-toolbar-copy");
		this.title = dom.find("#pb-toolbar-title");

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
			$(".dropdown-content").toggle();
		});

		dom.find("#pb-toolbar-logout").click(() => {
			Api.logout(() => { this.bus.event(new LoggedOut()) }, () => { this.serverErrorDialog() });
		});

		this.setupLoginAndUser();

		window.onclick = function(event) {
			if (justClicked) {
				justClicked = false;
				return;
			}
			if (!(event.target as any).matches('#pb-toolbar-user')) {
			  var dropdowns = document.getElementsByClassName("dropdown-content");
			  var i;
			  for (i = 0; i < dropdowns.length; i++) {
				$(dropdowns[i]).hide();
			  }
			}
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
		} else {
			this.login.show()
			this.signup.show();
			this.user.hide();
		}
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

		let dialog = new Dialog("Sign in", content[0], ["Cancel", "Sign in"]);
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

	onEvent(event: Event) {
		if (event instanceof LoggedIn || event instanceof LoggedOut) {
			this.setupLoginAndUser();
		}
	}
}