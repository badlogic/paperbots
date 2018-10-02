export class Input {
	element: HTMLElement;
	lastX = 0;
	lastY = 0;
	buttonDown = false;
	currTouch: Touch = null;

	private listeners = new Array<InputListener>();
	constructor (element: HTMLElement) {
		this.element = element;
		this.setupCallbacks(element);
	}

	private setupCallbacks(element: HTMLElement) {
		element.addEventListener("mousedown", (ev: UIEvent) => {
			if (ev instanceof MouseEvent) {
				let rect = element.getBoundingClientRect();
				let x = ev.clientX - rect.left;
				let y = ev.clientY - rect.top;

				let listeners = this.listeners;
				for (let i = 0; i < listeners.length; i++) {
					listeners[i].down(x, y);
				}

				this.lastX = x;
				this.lastY = y;
				this.buttonDown = true;
			}
		}, true);
		element.addEventListener("mousemove", (ev: UIEvent) => {
			if (ev instanceof MouseEvent) {
				let rect = element.getBoundingClientRect();
				let x = ev.clientX - rect.left;
				let y = ev.clientY - rect.top;

				let listeners = this.listeners;
				for (let i = 0; i < listeners.length; i++) {
					if (this.buttonDown) {
						listeners[i].dragged(x, y);
					} else {
						listeners[i].moved(x, y);
					}
				}

				this.lastX = x;
				this.lastY = y;
			}
		}, true);
		element.addEventListener("mouseup", (ev: UIEvent) => {
			if (ev instanceof MouseEvent) {
				let rect = element.getBoundingClientRect();
				let x = ev.clientX - rect.left;
				let y = ev.clientY - rect.top;

				let listeners = this.listeners;
				for (let i = 0; i < listeners.length; i++) {
					listeners[i].up(x, y);
				}

				this.lastX = x;
				this.lastY = y;
				this.buttonDown = false;
			}
		}, true);
		element.addEventListener("touchstart", (ev: TouchEvent) => {
			if (this.currTouch != null) return;

			var touches = ev.changedTouches;
			for (var i = 0; i < touches.length; i++) {
				var touch = touches[i];
				let rect = element.getBoundingClientRect();
				let x = touch.clientX - rect.left;
				let y = touch.clientY - rect.top;
				this.currTouch = new Touch(touch.identifier, x, y);
				break;
			}

			let listeners = this.listeners;
			for (let i = 0; i < listeners.length; i++) {
				listeners[i].down(this.currTouch.x, this.currTouch.y);
			}
			console.log("Start " + this.currTouch.x + ", " + this.currTouch.y);
			this.lastX = this.currTouch.x;
			this.lastY = this.currTouch.y;
			this.buttonDown = true;
			ev.preventDefault();
		}, false);
		element.addEventListener("touchend", (ev: TouchEvent) => {
			var touches = ev.changedTouches;
			for (var i = 0; i < touches.length; i++) {
				var touch = touches[i];
				if (this.currTouch.identifier === touch.identifier) {
					let rect = element.getBoundingClientRect();
					let x = this.currTouch.x = touch.clientX - rect.left;
					let y = this.currTouch.y = touch.clientY - rect.top;
					let listeners = this.listeners;
					for (let i = 0; i < listeners.length; i++) {
						listeners[i].up(x, y);
					}
					console.log("End " + x + ", " + y);
					this.lastX = x;
					this.lastY = y;
					this.buttonDown = false;
					this.currTouch = null;
					break;
				}
			}
			ev.preventDefault();
		}, false);
		element.addEventListener("touchcancel", (ev: TouchEvent) => {
			var touches = ev.changedTouches;
			for (var i = 0; i < touches.length; i++) {
				var touch = touches[i];
				if (this.currTouch.identifier === touch.identifier) {
					let rect = element.getBoundingClientRect();
					let x = this.currTouch.x = touch.clientX - rect.left;
					let y = this.currTouch.y = touch.clientY - rect.top;
					let listeners = this.listeners;
					for (let i = 0; i < listeners.length; i++) {
						listeners[i].up(x, y);
					}
					console.log("End " + x + ", " + y);
					this.lastX = x;
					this.lastY = y;
					this.buttonDown = false;
					this.currTouch = null;
					break;
				}
			}
			ev.preventDefault();
		}, false);
		element.addEventListener("touchmove", (ev: TouchEvent) => {
			if (this.currTouch == null) return;

			var touches = ev.changedTouches;
			for (var i = 0; i < touches.length; i++) {
				var touch = touches[i];
				if (this.currTouch.identifier === touch.identifier) {
					let rect = element.getBoundingClientRect();
					let x = touch.clientX - rect.left;
					let y = touch.clientY - rect.top;

					let listeners = this.listeners;
					for (let i = 0; i < listeners.length; i++) {
						listeners[i].dragged(x, y);
					}
					console.log("Drag " + x + ", " + y);
					this.lastX = this.currTouch.x = x;
					this.lastY = this.currTouch.y = y;
					break;
				}
			}
			ev.preventDefault();
		}, false);
	}

	addListener(listener: InputListener) {
		this.listeners.push(listener);
	}

	removeListener(listener: InputListener) {
		let idx = this.listeners.indexOf(listener);
		if (idx > -1) {
			this.listeners.splice(idx, 1);
		}
	}
}

export class Touch {
	constructor(public identifier: number, public x: number, public y: number) {
	}
}

export interface InputListener {
	down(x: number, y: number): void;
	up(x: number, y: number): void;
	moved(x: number, y: number): void;
	dragged(x: number, y: number): void;
}