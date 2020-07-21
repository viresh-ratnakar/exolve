/*
MIT License

Copyright (c) 2019 Viresh Ratnakar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

The latest code and documentation for exolve can be found at:
https://github.com/viresh-ratnakar/exolve
*/

if (typeof exolveWidgets === 'undefined') {
  exolveWidgets = {};
}

/**
 * Expects an HTMLElement with id exolve-widget-placeholder to be present.
 *     (changes its id to something unique).
 * puzzleText: exolve spec.
 * url: url of exolve-widget.html
 * height: optional height (in px) of iframe.
 */
function ExolveWidgetCreator(puzzleText, url, height=1500) {
  this.VERSION = 'Exolve v0.80 July 20 2020';
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
  let placeholder = document.getElementById("exolve-widget-placeholder");
  if (!placeholder) {
    console.log('Did not find expected DIV with id: exolve-widget-placeholder');
    return;
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
