/*
MIT License

Copyright (c) 2019 Viresh Ratnakar

See the full Exolve license notice in exolve-m.js.
*/

if (typeof exolveWidgets === 'undefined') {
  exolveWidgets = {};
}

/**
 * Expects an HTMLElement with id exolve or exolve-widget-placeholder
 * to be present. Changes that element's id to something unique.
 *
 * puzzleText: exolve spec.
 * url: url of exolve-widget.html
 * height: optional height (in px) of iframe.
 */
function ExolveWidgetCreator(puzzleText, url, height=1500) {
  this.id = "xlv" + Math.random().toString(36).substring(2, 15);
  this.puzzleText = puzzleText;
  this.sendPuzzleToExolveWidget = () => {
    document.getElementById(
        "exolve-iframe-" + this.id).contentWindow.postMessage(
            this.puzzleText, "*");
  };
  this.receiveExolveReady = (event) => {
    if (event.data == "EXOLVE-READY-" + this.id) {
      this.sendPuzzleToExolveWidget();
        window.removeEventListener("message", this.receiveExolveReady);
    }
  }
  exolveWidgets[this.id] = this;
  window.addEventListener("message", this.receiveExolveReady, false);
  let placeholder = document.getElementById("exolve");
  if (!placeholder) {
    // Try legacy name.
    placeholder = document.getElementById("exolve-widget-placeholder");
    if (!placeholder) {
      console.log('Did not find expected DIV with id: ' +
                  'exolve/exolve-widget-placeholder');
      return;
    }
  }
  placeholder.id = "exolve-widget-" + this.id;
  placeholder.insertAdjacentHTML('beforeend', `
    <iframe
      src="${url}?id=${this.id}"
      width="100%" height="${height}" allow="fullscreen"
      id="exolve-iframe-${this.id}" frameborder="0"
      style="display:block; border:none; margin-left:auto; margin-right:auto">
    </iframe>`);
}
