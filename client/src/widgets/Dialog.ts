export class Dialog {
	dom: JQuery;
	buttons = Array<JQuery>();

	constructor (title: string, content: HTMLElement, buttons: Array<string>) {
		this.dom = this.renderDialog(title, content, buttons);
	}

	show () {
		document.body.appendChild(this.dom[0]);
	}

	hide () {
		this.dom.remove();
	}

	private renderDialog (title: string, content: HTMLElement, buttons: Array<string>): JQuery {
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
			let button = $(`<input type="button" value="${buttons[i]}">`);
			this.buttons.push(button);
			buttonsDiv.append(button);
		}
		dom.find(".pb-dialog-footer").append(buttonsDiv);
		return dom;
	}

	static alert (title: string, message: JQuery): Dialog {
		let dialog = new Dialog(title, message[0], ["OK"]);
		dialog.buttons[0].click(() => {
			dialog.dom.remove();
		})
		document.body.appendChild(dialog.dom[0]);
		dialog.dom.attr("tabindex", "1");
		dialog.dom.focus();
		dialog.dom.keyup((ev: any) => {
			if (ev.keyCode == 13) dialog.buttons[0].click();
			if (ev.keyCode == 27) dialog.buttons[0].click();
		})
		return dialog;
	}

	static confirm (title: string, message: string, confirmed: () => void) {
		let dialog = new Dialog(title, $(`<span>${message}</span>`)[0], ["Cancel", "OK"]);
		dialog.buttons[0].click(() => {
			dialog.dom.remove();
		});
		dialog.buttons[1].click(() => {
			dialog.dom.remove();
			confirmed();
		});
		dialog.dom.attr("tabindex", "1");
		dialog.dom.keyup((ev: any) => {
			if (ev.keyCode == 27) dialog.buttons[0].click();
			if (ev.keyCode == 13) dialog.buttons[1].click();
		})
		document.body.appendChild(dialog.dom[0]);
		dialog.dom.focus();
		return dialog;
	}

	static prompt (title: string, value: string, confirmed: (value: string) => void, cancled: () => void) {
		let textField = $(`<input type="text" value="${value}" style="width: 100%; box-sizing: border-box;">`);
		let dialog = new Dialog(title, textField[0], ["Cancel", "OK"]);
		dialog.buttons[0].click(() => {
			dialog.dom.remove();
			cancled();
		});
		dialog.buttons[1].click(() => {
			dialog.dom.remove();
			confirmed(textField.val() as string);
		});
		document.body.appendChild(dialog.dom[0]);
		textField.focus();
		textField.select();
		textField.keyup((event: any) => {
			if (event.keyCode == 13) {
				dialog.buttons[1].click();
			}
		});
		dialog.dom.keyup((ev: any) => {
			if (ev.keyCode == 27) dialog.buttons[0].click();
		})
		return dialog;
	}
}