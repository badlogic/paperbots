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
					this.lastX = this.currTouch.x = x;
					this.lastY = this.currTouch.y = y;
					break;
				}
			}
			ev.preventDefault();
		}, false);
	}

	addListener(listener: InputListener) {
		if (this.hasListener(listener)) return;
		this.listeners.push(listener);
	}

	removeListener(listener: InputListener) {
		let idx = this.listeners.indexOf(listener);
		if (idx > -1) {
			this.listeners.splice(idx, 1);
		}
	}

	hasListener(listener: InputListener) {
		return this.listeners.indexOf(listener) >= 0;
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

export interface Map<T> {
	[name: string] : T;
}

export class TimeKeeper {
	maxDelta = 0.064;
	framesPerSecond = 0;
	delta = 0;
	totalTime = 0;

	private lastTime = Date.now() / 1000;
	private frameCount = 0;
	private frameTime = 0;

	update () {
		var now = Date.now() / 1000;
		this.delta = now - this.lastTime;
		this.frameTime += this.delta;
		this.totalTime += this.delta;
		if (this.delta > this.maxDelta) this.delta = this.maxDelta;
		this.lastTime = now;

		this.frameCount++;
		if (this.frameTime > 1) {
			this.framesPerSecond = this.frameCount / this.frameTime;
			this.frameTime = 0;
			this.frameCount = 0;
		}
	}
}

export interface ImageAsset {
	image: HTMLImageElement;
	url: string;
}

export class AssetManager {
	private toLoad = new Array<ImageAsset>();
	private loaded = {};
	private error = {};

	loadImage(url: string) {
		var img = new Image();
		var asset: ImageAsset = { image: img, url: url };
		this.toLoad.push(asset);
		img.onload = () => {
			this.loaded[asset.url] = asset;
			let idx = this.toLoad.indexOf(asset);
			if (idx >= 0) this.toLoad.splice(idx, 1);
			console.log("Loaded image " + url);
		}
		img.onerror = () => {
			this.loaded[asset.url] = asset;
			let idx = this.toLoad.indexOf(asset);
			if (idx >= 0) this.toLoad.splice(idx, 1);
			console.log("Couldn't load image " + url);
		}
		img.src = url;
	}

	getImage(url: string): HTMLImageElement {
		return (this.loaded[url] as ImageAsset).image;
	}

	hasMoreToLoad() {
		return this.toLoad.length;
	}
}


export function setElementEnabled(el: JQuery, enabled: boolean) {
	if (enabled)
		el.removeAttr("disabled");
	else
		el.attr("disabled", "true");
}

export function assertNever(x: never): never {
	throw new Error("This should never happen");
}