export class SplitPane {
	dom: JQuery;
	left: JQuery;
	right: JQuery;
	toggle: JQuery;

	constructor(leftPane: JQuery, rightPane: JQuery) {
		this.dom = $(`
			<div class="pb-split-pane">
				<div class="pb-split-pane-left">
				</div>
				<div class="pb-divider"><div id="pb-split-pane-toggle">&gt;</div></div>
				<div class="pb-split-pane-right">
				</div>
			</div>`
		);

		this.left = this.dom.find(".pb-split-pane-left");
		this.right = this.dom.find(".pb-split-pane-right");
		this.left.append(leftPane);
		this.right.append(rightPane);

		this.toggle = this.dom.find("#pb-split-pane-toggle");
		let divider = this.dom.find(".pb-divider");

		var x = 0;
		var splitX = 0;
		var lastSplitPercentage = divider[0].offsetLeft / this.dom[0].clientWidth;
		var dragged = false;

		this.toggle.click((e) => {
			if (dragged) return;
			if (this.toggle.text() == ">") {
				lastSplitPercentage = divider[0].offsetLeft / this.dom[0].clientWidth;

				this.right[0].style.left = (this.dom[0].clientWidth - 10) + "px";
				this.right[0].style.width = "10px";
				divider[0].style.left = (this.dom[0].clientWidth - 10) + "px";
				this.left[0].style.width = (this.dom[0].clientWidth - 10) + "px";

				divider.addClass("pb-split-pane-collapsed");
				this.right.addClass("pb-hidden");
				this.toggle.text("<");
			} else {
				splitX = lastSplitPercentage * this.dom[0].clientWidth;

				this.left[0].style.width = splitX + "px";
				divider[0].style.left = splitX + "px";
				this.right[0].style.left = splitX + "px";
				this.right[0].style.width = (this.dom[0].clientWidth - splitX) + "px";

				divider.removeClass("pb-split-pane-collapsed");
				this.right.removeClass("pb-hidden");
				this.toggle.text(">");
			}
		});

		window.addEventListener("resize", () => {
			this.resize();
		}, true);

		// General handlers, used by both mouse and touch event code.
		var down = (clientX: number) => {
			x = clientX;
			splitX = divider[0].offsetLeft;
			dragged = false;
			registerMove();
		}
		var up = (clientX: number) => {
			if (this.toggle.text() == ">")
				lastSplitPercentage = divider[0].offsetLeft / this.dom[0].clientWidth;
			unregisterMove();
		}

		var move = (clientX: number) => {
			let delta = (clientX - x);
			let newSplitX = splitX + delta;
			if (newSplitX < -this.toggle[0].offsetLeft * 2) return;
			if (newSplitX > this.dom[0].clientWidth - divider[0].clientWidth) return;
			divider[0].style.left = newSplitX + "px";

			if (delta != 0) {
				divider.removeClass("pb-split-pane-collapsed");
				this.right.removeClass("pb-hidden");
				this.toggle.text(">");
				dragged = true;
			}
			this.right[0].style.left = (newSplitX) + "px";
			this.right[0].style.width = (this.dom[0].clientWidth - newSplitX) + "px";
			this.left[0].style.width = newSplitX + "px";
		}

		this.resize = () => {
			if (this.toggle.text() == ">") {
				splitX = lastSplitPercentage * this.dom[0].clientWidth;
				this.left[0].style.width = splitX + "px";
				divider[0].style.left = splitX + "px";
				this.right[0].style.left = splitX + "px";
				this.right[0].style.width = (this.dom[0].clientWidth - splitX) + "px";
			} else {
				this.right[0].style.left = (this.dom[0].clientWidth - 10) + "px";
				this.right[0].style.width = "10px";
				divider[0].style.left = (this.dom[0].clientWidth - 10) + "px";
				this.left[0].style.width = (this.dom[0].clientWidth - 10) + "px";
			}
		}

		// Setup mouse handlers
		divider[0].addEventListener("mousedown", (e: MouseEvent) => { down(e.clientX) }, false);
		window.addEventListener("mouseup", (e: MouseEvent) => { up(e.clientX) }, false);

		var mouseMove = (e: MouseEvent) => {
			move(e.clientX);
		}

		// Setup touch handlers
		divider[0].addEventListener("touchstart", (e: TouchEvent) => { down(e.changedTouches[0].clientX) });
		window.addEventListener("touchend", (e: TouchEvent) => { up(e.changedTouches[0].clientX) });
		window.addEventListener("touchcancel", (e: TouchEvent) => { up(e.changedTouches[0].clientX) });

		var touchMove = (e: TouchEvent) => {
			move(e.changedTouches[0].clientX);
		}

		// We register/unregister the move handler during dragging
		var registerMove = () => {
			$(document.body).addClass("pb-noselect");
			window.addEventListener("mousemove", mouseMove, true);
			window.addEventListener("touchmove", touchMove, true);
			this.left[0].style.pointerEvents = "none";
			this.right[0].style.pointerEvents = "none";
		}

		var unregisterMove = () => {
			$(document.body).removeClass("pb-noselect");
			window.removeEventListener("mousemove", mouseMove, true);
			window.removeEventListener("touchmove", touchMove, true);
			this.left[0].style.pointerEvents = "auto";
			this.right[0].style.pointerEvents = "auto";
		}

	}

	resize: () => void;
}