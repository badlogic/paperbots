export interface DialogButton {
	text: string,
	key: number
}

export class Dialog {
	dom: JQuery;
	buttons = Array<JQuery>();

	constructor (title: string, content: HTMLElement, buttons: Array<DialogButton>) {
		this.dom = this.renderDialog(title, content, buttons);
	}

	show () {
		document.body.appendChild(this.dom[0]);
	}

	hide () {
		this.dom.remove();
	}

	private renderDialog (title: string, content: HTMLElement, buttons: Array<DialogButton>): JQuery {
		let dom = $(`
		<div class="pb-dialog">
			<div class="pb-dialog-content">
				<div class="pb-dialog-header"><span>${title}</span></div>
				<div class="pb-dialog-body"></div>
				<div class="pb-dialog-footer"></div>
			</div>
		</div>
		`);

		dom.find(".pb-dialog-body").append(content);

		let buttonsDiv = $(`<div class="pb-dialog-buttons"></div>`);
		for (var i = 0; i < buttons.length; i++) {
			let button = $(`<input type="button" value="${buttons[i].text}">`);
			this.buttons.push(button);
			buttonsDiv.append(button);
		}
		dom.find(".pb-dialog-footer").append(buttonsDiv);
		dom.attr("tabindex", "1");
		dom.keyup((ev: any) => {
			buttons.forEach((button, index) => {
				if (ev.keyCode == button.key) this.buttons[index].click();
			});
		});
		requestAnimationFrame(() => { this.dom[0].focus(); });
		return dom;
	}

	static alert (title: string, message: JQuery): Dialog {
		let dialog = new Dialog(title, message[0], [{text: "", key: 27}, {text: "OK", key: 13}]);
		dialog.buttons[0].click(() => {
			dialog.dom.remove();
		});
		dialog.buttons[1].click(() => {
			dialog.dom.remove();
		});
		return dialog;
	}

	static confirm (title: string, message: JQuery, confirmed: () => void) {
		let dialog = new Dialog(title, message[0], [{text: "Cancel", key: 27}, {text: "OK", key: 13}]);
		dialog.buttons[0].click(() => {
			dialog.dom.remove();
		});
		dialog.buttons[1].click(() => {
			dialog.dom.remove();
			confirmed();
		});
		return dialog;
	}

	static prompt (title: string, value: string, confirmed: (value: string) => void, cancled: () => void) {
		let textField = $(`<input type="text" value="${value}" class="pb-input-field">`);
		let dialog = new Dialog(title, textField[0], [{text: "Cancel", key: 27}, {text: "OK", key: -1}]);
		dialog.buttons[0].click(() => {
			dialog.dom.remove();
			cancled();
		});
		dialog.buttons[1].click(() => {
			dialog.dom.remove();
			confirmed(textField.val() as string);
		});
		textField.keyup((event: any) => {
			if (event.keyCode == 13) {
				dialog.buttons[1].click();
			}
		});
		requestAnimationFrame(() => {
			textField.focus();
			textField.select();
		});
		return dialog;
	}
}