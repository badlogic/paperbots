import { Widget } from "./Widget"
import { EventBus, Event } from "./Events";
import { Dialog } from "./Dialog";
import { Api, NameAndToken } from "../Api";

export class Toolbar extends Widget {
	constructor(bus: EventBus) {
		super(bus);
	}

	render(): HTMLElement {
		let dom = $(/*html*/`
			<div id="pb-toolbar">
				<div id="pb-toolbar-logo" class="pb-toolbar-button">Paperbots</div>
				<div id="pb-toolbar-save" class="pb-toolbar-button"><i class="far fa-save"></i>Save</div>
				<div id="pb-toolbar-copy" class="pb-toolbar-button"><i class="far fa-copy"></i>Copy</div>
				<input id="pb-toolbar-title" type="text" value="Untitled project">
				<div id="pb-toolbar-signin" class="pb-toolbar-button"><i class="far fa-user-circle"></i>Log in</div>
				<div id="pb-toolbar-signup" class="pb-toolbar-button"><i class="fas fa-user-plus"></i>Sign up</div>
			</div>
		`);

		let signin = dom.find("#pb-toolbar-signin");
		signin.click(() => {
			this.loginDialog().show();
		});

		let signup = dom.find("#pb-toolbar-signup");
		signup.click(() => {
			this.signupDialog().show();
		});

		return dom[0];
	}

	private loginDialog () {
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
				this.verifyDialog().show();
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
		return dialog;
	}

	private verifyDialog (): Dialog {
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
			(nameAndToken: NameAndToken) => {
				dialog.hide();
				// TODO store token locally
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
		return dialog;
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

		let dialog = new Dialog("Sign in", content[0], ["Cancel", "Sign up"]);
		dialog.buttons[0].click(() => {
			dialog.hide();
		});
		dialog.buttons[1].click(() => {
			Api.signup(email.val() as string, name.val() as string,
			() => {
				dialog.hide();
				this.verifyDialog().show();
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
					error.html(/*html*/`
						<p class="pb-dialog-error">
							Sorry, that email is already registered. <a>Log in!</a>
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
		return dialog;
	}

	serverErrorDialog () {
		Dialog.alert("Sorry!", $(/*html*/`<p>We couldn't reach the server. If the problem persists, let us know at <a href="mailto:contact@paperbots.com">contact@paperbots.io</a></p>`));
	}

	onEvent(event: Event) {
	}
}