/*
MIT License

Copyright (c) 2023 Viresh Ratnakar

See the full license notice in exolve-m.js.
*/

/**
 * Constructing an ExolveEmbedder object does all the work of
 * decoding the URL parameters to find a puzzle file and serve it.
 */
class ExolveEmbedder {
  constructor() {
    this.embedder = document.getElementById('xlv-embedder');
    const urlParams = new URLSearchParams(window.location.search);
    this.crossword = '';
    this.exolveOverrides = '';
    for (const [key, value] of urlParams) {
      const decodedValue = decodeURIComponent(value);
      if (key == 'crossword') {
        if (this.crossword) {
          throw new Error('Multiple "crossword=" keys found.');
        }
        this.crossword = decodedValue;
        continue;
      }
      this.exolveOverrides += 'exolve-' + key + ': ' + decodedValue + '\n';
    }
    if (!this.crossword) {
      throw new Error('Must specify "?crossword=[puz/ipuz/exolve file]" in the URL.');
    }
    const finisher = this.showData.bind(this);
    fetch(this.crossword, {
      mode: 'cors',
      credentials: 'include',
    }).then(response => {
      if (!response.ok) {
        throw new Error(
            'Error fetching [' + this.crossword +
            `], status = ${response.status}`);
      }
      return response.arrayBuffer();
    }).then(result => {
      finisher(result);
    }).catch(error => {
      this.showMessage(error.name + ': ' + error.message);
    });
  }

  /**
   * Returns true if the crossword was successfully shown.
   */
  showExolve(specs) {
    let start = specs.indexOf('exolve-begin')
    let end = specs.indexOf('exolve-end')
    if (start < 0 || end < 0 || start >= end) {
      return false;
    }
    while (start > 0 && specs.charAt(start - 1) == ' ') {
      start--;
    }
    const exolveSpecs = specs.substring(start, end) +
                        this.exolveOverrides + 'exolve-end';

    const notInIframe = (window === window.parent);

    try {
      const xlv = new Exolve(exolveSpecs, 'xlv-embedder', null, notInIframe);
    } catch (err) {
      this.showMessage(err);
      return false;
    }
    return true;
  }

  showIpuz(specs) {
    let start = specs.indexOf('{')
    let end = specs.lastIndexOf('}')
    if (start < 0 || end < 0 || start >= end) {
      return false;
    }         
    const ipuzJSON = specs.substring(start, end) + '}';
    try {
      const ipuz = JSON.parse(ipuzJSON);
      const exolve = exolveFromIpuz(ipuz, this.crossword);
      if (!exolve) {
        return false;
      }
      return this.showExolve(exolve);
    } catch (err) {
      console.log(err);
    }
    return false;
  }

  showPuz(buffer) {
    const exolve = exolveFromPuz(buffer, this.crossword);
    if (!exolve) {
      return false;
    }
    return this.showExolve(exolve);
  }


  showData(data) {
    const utf8decoder = new TextDecoder();
    const text = utf8decoder.decode(data);
    if (this.showExolve(text)) {
      return;
    }
    if (this.showIpuz(text)) {
      return;
    }
    if (this.showPuz(data)) {
      return;
    }
    this.showMessage('Could not interpret the data in [' + this.crossword + '] as a crossword.');
  }
  showMessage(msg) {
    this.embedder.innerHTML = msg;
  }
}
