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

/**
 * The Exolve code creates only the following names at global scope:
 *
 * - Exolve
 * - createExolve
 * - createPuzzle (deprecated).
 * - exolvePuzzles
 *
 * - The most generic way to create a puzzle is with "new Exolve(...)".
 * - The createExolve() function is a covenient wrapper.
 * - The createExolve() function looks for and calls the function
 *       customizeExolve() if it exists (passing it the created puzzle).
 * - The createPuzzle() function is similar to createExolve(), and
 *       is deprecated (as the name may conflict with some other code).
 * - All HTML ids/class names begin with "xlv"
 */

/**
 * This is the global object in which *all* Exolve puzzles rendered on a single
 * web page are stored as properties, with the puzzle IDs being the keys.
 */
var exolvePuzzles;

/**
 * Constructor to create an Exolve puzzle.
 *
 * puzzleText contains the puzzle specs.
 * containerId is the optional HTML id of the container element in which you
 *     want to create this puzzle. If empty, the puzzle is created inside
 *     the element with id "exolve" if it exists (and its id is changed to
 *     exolve<N> in that case, where <N> is the index of this puzzle among
 *     all the pages on the page). If containerId is empty and there is no
 *     element with id "exolve", the the puzzle is created at the end of the
 *     web page.
 * customized is an optional function that will get called after the puzzle
 *     is set up. The Exolve object will be passed to the function.
 * addStateToUrl should be set to false only if you do *not* want to save
 *     the puzzle state in the URL (the puzzle state is also saved in a
 *     cookie, but that does not work for local files). Unless you are
 *     embedding the puzzle in an iframe for some reason, set this to true.
 */
function Exolve(puzzleText,
                containerId="",
                customizer=null,
                addStateToUrl=true) {
  this.VERSION = 'Exolve v0.84 August 7 2020'

  this.puzzleText = puzzleText
  this.containerId = containerId
  this.customizer = customizer
  this.addStateToUrl = addStateToUrl

  this.gridWidth = 0
  this.gridHeight = 0

  this.credits = []
  this.questionTexts = []

  // Each nina will be an array containing location [i,j] pairs and/or span
  // class names.
  this.ninas = []
  // For span-class-specified ninas, ninaClassElements[] stores the elements
  // along with the colours to apply to them when showing the ninas.
  this.ninaClassElements = []

  this.grid = []
  this.clues = {}
  this.cellColours = []
  this.submitURL = null
  this.submitKeys = []
  this.hasDiagramlessCells = false
  this.hasUnsolvedCells = false
  this.hasReveals = false
  this.hasAcrossClues = false
  this.hasDownClues = false
  this.hasNodirClues = false
  // Clues labeled non-numerically (like [A] a clue...) use this to create a
  // unique clueIndex.
  this.nextNonNumId = 1
  this.offNumClueIndices = {}
  // Objects with keys being JSON arrays of cells, mapping to orphan clues
  // they belong to, for revealing.
  this.cellsToOrphan = {}
  this.szCellsToOrphan = 0

  this.MAX_GRID_SIZE = 100
  this.GRIDLINE = 1
  this.BAR_WIDTH = 3
  this.BAR_WIDTH_BY2 = 2
  this.SEP_WIDTH = 2
  this.SEP_WIDTH_BY2 = 1.5
  this.NUMBER_START_X = 2

  this.answersList = []
  this.revelationList = []

  // State of navigation
  this.currRow = -1
  this.currCol = -1
  this.currDir = 'A'
  this.currClueIndex = null
  this.usingGnav = false
  this.lastOrphan = null
  this.activeCells = [];
  this.activeClues = [];
  this.showingNinas = false

  this.numCellsToFill = 0
  this.numCellsFilled = 0
  this.numCellsPrefilled = 0

  this.allClueIndices = []
  this.DEFAULT_ORPHAN_LEN = 15

  this.BLOCK_CHAR = '⬛';
  // We have special meanings for 0 (unfilled) and 1 (block in diagramless cell)
  // in solution states. For crosswords with digits, we use these to stand for
  // 0 and 1 respectively, in solution states.
  this.DIGIT0 = '-'
  this.DIGIT1 = '~'
  this.scriptRE = null
  this.scriptLowerCaseRE = null

  this.colorScheme = {
    'background': 'black',
    'cell': 'white',
    'active': 'mistyrose',
    'input': '#ffb6b4',
    'orphan': 'linen',
    'light-label': 'black',
    'light-text': 'black',
    'light-label-input': 'black',
    'light-text-input': 'black',
    'circle': 'gray',
    'circle-input': 'gray',
    'caret': 'gray',
    'arrow': 'mistyrose',
    'prefill': 'blue',
    'anno': 'darkgreen',
    'solved': 'dodgerblue',
    'separator': 'blue',
    'imp-text': 'darkgreen',
    'button': '#4caf50',
    'button-text': 'white',
    'button-hover': 'darkgreen',
    'small-button': 'inherit',
    'small-button-text': 'darkgreen',
    'small-button-hover': 'lightpink',
  }

  this.nextLine = 0

  this.STATE_SEP = 'xlv'
  this.STATES_SEP = 'xxllvv'  // xxllvv<id1>......xxllvv<id2>.....

  this.MARK_CLUE_TOOLTIP = 'Click to forcibly mark/unmark as solved'

  // Variables set by exolve-option
  this.hideInferredNumbers = false
  this.cluesPanelLines = -1
  this.allowDigits = false
  this.hideCopyPlaceholders = false
  this.addSolutionToAnno = true
  this.offsetLeft = 0
  this.offsetTop = 0
  this.language = ''
  this.languageScript = ''
  this.langMaxCharCodes = 1

  this.createPuzzle()
}

// Create the basic HTML structure.
// Set up globals, version number and user agent in bug link.
Exolve.prototype.init = function() {
  this.parseOverall()
  this.computeGridSize()

  if (!this.id.match(/^[a-zA-Z][a-zA-Z\d-]*$/)) {
    this.throwErr(
      'Puzzle id should be non-empty, should start with a letter, ' +
      'and should only have alphanumeric characters or -: ' + this.id)
  }
  if (!exolvePuzzles) {
    exolvePuzzles = {}
  }
  if (exolvePuzzles[this.id]) {
    this.throwErr('Puzzle id ' + this.id + ' is already in use')
  }
  exolvePuzzles[this.id] = this
  this.index = Object.keys(exolvePuzzles).length
  this.prefix = 'xlv' + this.index

  const basicHTML = `
    <div class="xlv-frame xlv-flex-col" id="${this.prefix}-frame">
      <h2 id="${this.prefix}-title" class="xlv-title">Title</h2>
      <div id="${this.prefix}-setter" class="xlv-setter"></div>
      <div id="${this.prefix}-preamble" class="xlv-preamble"></div>
      <div id="${this.prefix}-curr-clue-parent" class="xlv-curr-clue-parent">
        <div id="${this.prefix}-curr-clue" class="xlv-curr-clue"></div>
      </div>
      <div class="xlv-flex-row">
        <div id="${this.prefix}-grid-panel" class="xlv-grid-panel">
          <div id="${this.prefix}-grid-parent-centerer"
              class="xlv-grid-parent-centerer">
            <div id="${this.prefix}-grid-parent" class="xlv-grid-parent">
              <svg id="${this.prefix}-grid" class="xlv-grid"
                  zoomAndPan="disable"></svg>
              <div id="${this.prefix}-grid-input-wrapper"
                  class="xlv-grid-input-wrapper"
                  style="display:none;left:0;top:0"><input
                      id="${this.prefix}-grid-input" type="text" maxlength="2"
                      autocomplete="off" spellcheck="false"
                      class="xlv-grid-input xlv-cell-text"/></div>
              <div id="${this.prefix}-nina-group"
                  style="display:none;left:0;top:0"></div>
            </div> <!-- xlv-grid-parent -->
          </div> <!-- xlv-grid-parent-centerer -->
          <div id="${this.prefix}-controls-etc" class="xlv-controls-etc">
            <div id="${this.prefix}-controls" class="xlv-controls xlv-wide-box">
              <div id="${this.prefix}-button-row-1" class="xlv-controls-row">
                <button id="${this.prefix}-clear"
                    class="xlv-button">Clear this</button>
                <button id="${this.prefix}-clear-all"
                    class="xlv-button">Clear all!</button>
                <button id="${this.prefix}-check"
                    class="xlv-button" style="display:none">Check this</button>
                <button id="${this.prefix}-check-all" class="xlv-button" style="display:none">Check all!</button>
              </div> <!-- xlv-button-row-1 -->
              <div id="${this.prefix}-button-row-2" class="xlv-controls-row">
                <button id="${this.prefix}-reveal" class="xlv-button"
                    style="display:none">Reveal this</button>
                <button id="${this.prefix}-ninas" class="xlv-button"
                    style="display:none">Show ninas</button>
                <button id="${this.prefix}-reveal-all" class="xlv-button"
                    style="display:none">Reveal all!</button>
              </div> <!-- xlv-button-row-2 -->
            </div> <!-- xlv-controls -->
            <div id="${this.prefix}-errors" class="xlv-errors"></div>
            <div id="${this.prefix}-status" class="xlv-status">
              <span id="${this.prefix}-squares-filled">Squares filled</span>:
              <span id="${this.prefix}-status-num-filled">0</span>/<span
                    id="${this.prefix}-status-num-total"></span>
            </div> <!-- xlv-status -->
            <div id="${this.prefix}-saving" class="xlv-wide-box xlv-saving">
              Your entries are saved automatically in a cookie, for the most
              recent puzzles that you open from this site.
            </div> <!-- xlv-saving -->
            <div id="${this.prefix}-small-print" class="xlv-wide-box xlv-small-print">
              <div id="${this.prefix}-tools" style="display:none">
                <ul>
                  <li>
                    <b>Tab/Shift-Tab:</b>
                    Jump to the next/previous clue in the current direction
                  </li>
                  <li>
                    <b>Enter, Click/Tap:</b>
                    Toggle current direction
                  </li>
                  <li>
                    <b>Arrow keys:</b>
                    Move to the nearest light square in that direction
                  </li>
                  <li>
                    <b>Spacebar:</b>
                    Place/clear block in the current square if it's diagramless
                  </li>
                </ul>
                <div>
                  <span id="${this.prefix}-shuffle" class="xlv-shuffle"
                      title="Shuffle selected text (or all text, if none
                      selected)">Scratch pad: (click here to shuffle)</span>
                  <textarea
                      id="${this.prefix}-scratchpad" class="xlv-scratchpad"
                      spellcheck="false" rows="2"></textarea>
                </div>
              </div>
              <a id="${this.prefix}-tools-link" href="" title="Show/hide tools:
                  list of control keys and scratch pad">Tools</a>
              <a id="${this.prefix}-report-bug"
              href="https://github.com/viresh-ratnakar/exolve/issues/new">Report
                  bug</a>
              <a id="${this.prefix}-exolve-link"
                href="https://github.com/viresh-ratnakar/exolve">Exolve on
                GitHub</a>
              <span id="${this.prefix}-copyright"></span>
            </div> <!-- xlv-small-print -->
            <div id="${this.prefix}-questions" class="xlv-wide-box"></div>
            <div id="${this.prefix}-submit-parent">
              <button id="${this.prefix}-submit"
                  class="xlv-button" style="display:none">Submit!</button>
            </div> <!-- submit-parent -->
            <div id="${this.prefix}-explanations" class="xlv-wide-box
                xlv-explanations" style="display:none"></div>
          </div> <!-- xlv-controls-etc -->
          <br/>
        </div> <!-- xlv-grid-panel -->
        <div id="${this.prefix}-clues" class="xlv-flex-row xlv-clues">
          <div id="${this.prefix}-across-clues-panel" class="xlv-clues-box"
              style="display:none">
            <hr/>
            <span id="${this.prefix}-across-label"
                style="font-weight:bold">Across</span>
            <table id="${this.prefix}-across"></table>
            <br/>
          </div> <!-- xlv-across-clues-panel -->
          <div id="${this.prefix}-down-clues-panel" class="xlv-clues-box"
              style="display:none">
            <hr/>
            <span id="${this.prefix}-down-label"
                style="font-weight:bold">Down</span>
            <table id="${this.prefix}-down"></table>
            <br/>
          </div> <!-- xlv-down-clues-panel -->
          <div id="${this.prefix}-nodir-clues-panel"
              class="xlv-clues-box" style="display:none">
            <hr/>
            <table id="${this.prefix}-nodir"></table>
            <br/>
          </div> <!-- xlv-nodir-clues-panel -->
        </div> <!-- xlv-clues -->
      </div>
  </div> <!-- xlv-frame -->
  `

  if (document.getElementById(this.prefix + '-frame')) {
      this.throwErr('Element with id ' + this.prefix + 'frame already exists')
  }

  if (!this.containerId) {
      this.containerId = 'exolve'
  }
  const exolveHolder = document.getElementById(this.containerId)
  if (exolveHolder) {
    if (this.containerId == 'exolve') {
      exolveHolder.id = 'exolve' + this.index
    }
    exolveHolder.insertAdjacentHTML('beforeend', basicHTML)
  } else {
    document.body.insertAdjacentHTML('beforeend', basicHTML)
  }
  this.frame = document.getElementById(this.prefix + '-frame')

  document.getElementById(this.prefix + '-title').innerHTML = this.title
  if (this.setter) {
    let setter = document.getElementById(this.prefix + '-setter')
    setter.innerHTML = `<span id="${this.prefix}-setter-by">By</span> ${this.setter}`
    setter.style.color = this.colorScheme['imp-text']
  }
  if (this.copyright) {
    document.getElementById(this.prefix + '-copyright').innerHTML =
          'Ⓒ ' + this.copyright
  }
  let smallPrintBox = document.getElementById(this.prefix + '-small-print')
  for (credit of this.credits) {
    smallPrintBox.insertAdjacentHTML('beforeend', '<div>' + credit + '</div>')
  }

  this.gridPanel = document.getElementById(this.prefix + '-grid-panel');
  this.svg = document.getElementById(this.prefix + '-grid');
  this.gridInputWrapper = document.getElementById(this.prefix + '-grid-input-wrapper');
  this.gridInputWrapper.insertAdjacentHTML('beforeend',
    `<div id="${this.prefix}-grid-input-rarr" class="xlv-grid-input-rarr">&rtrif;</div>`)
  this.gridInputWrapper.insertAdjacentHTML('beforeend',
    `<div id="${this.prefix}-grid-input-darr" class="xlv-grid-input-darr">&dtrif;</div>`)
  this.gridInputRarr = document.getElementById(this.prefix + '-grid-input-rarr');
  this.gridInputDarr = document.getElementById(this.prefix + '-grid-input-darr');
  this.gridInputRarr.style.color = this.colorScheme['arrow']
  this.gridInputDarr.style.color = this.colorScheme['arrow']
  this.gridInputRarr.style.fontSize = this.arrowSize + 'px'
  this.gridInputDarr.style.fontSize = this.arrowSize + 'px'

  this.gridInput = document.getElementById(this.prefix + '-grid-input');
  this.gridInput.style.caretColor = this.colorScheme['caret']

  this.questions = document.getElementById(this.prefix + '-questions');

  this.acrossPanel = document.getElementById(this.prefix + '-across-clues-panel')
  this.downPanel = document.getElementById(this.prefix + '-down-clues-panel')
  this.nodirPanel = document.getElementById(this.prefix + '-nodir-clues-panel')
  this.acrossClues = document.getElementById(this.prefix + '-across')
  this.downClues = document.getElementById(this.prefix + '-down')
  this.nodirClues = document.getElementById(this.prefix + '-nodir')

  this.currClue = document.getElementById(this.prefix + '-curr-clue')
  this.currClueParent = document.getElementById(this.prefix + '-curr-clue-parent')
  this.ninaGroup = document.getElementById(this.prefix + '-nina-group')

  this.statusNumFilled = document.getElementById(this.prefix + '-status-num-filled')
  this.statusNumTotal = document.getElementById(this.prefix + '-status-num-total')
  if (this.addStateToUrl) {
    document.getElementById(this.prefix + '-saving').insertAdjacentHTML('beforeend',
       ` Bookmark/save the <a id="${this.prefix}-saving-url" href="">URL</a>
        for more reliable recovery.`);
    this.savingURL = document.getElementById(this.prefix + '-saving-url')
  }

  this.clearButton = document.getElementById(this.prefix + '-clear')
  this.clearButton.addEventListener('click', this.clearCurr.bind(this));

  this.clearAllButton = document.getElementById(this.prefix + '-clear-all')
  this.clearAllButton.addEventListener('click', this.clearAll.bind(this));

  this.checkButton = document.getElementById(this.prefix + '-check')
  this.checkButton.addEventListener('click', this.checkCurr.bind(this));

  this.checkAllButton = document.getElementById(this.prefix + '-check-all')
  this.checkAllButton.addEventListener('click', this.checkAll.bind(this));

  this.ninasButton = document.getElementById(this.prefix + '-ninas')
  this.ninasButton.addEventListener('click', this.toggleNinas.bind(this));

  this.revealButton = document.getElementById(this.prefix + '-reveal')
  this.revealButton.addEventListener('click', this.revealCurr.bind(this));

  this.revealAllButton = document.getElementById(this.prefix + '-reveal-all')
  this.revealAllButton.addEventListener('click', this.revealAll.bind(this));

  this.submitButton = document.getElementById(this.prefix + '-submit')
  this.submitButton.addEventListener('click', this.submitSolution.bind(this));

  document.getElementById(this.prefix + '-tools-link').addEventListener(
        'click', this.toggleTools.bind(this));

  this.scratchPad = document.getElementById(this.prefix + '-scratchpad')
  this.scratchPad.style.color = this.colorScheme['imp-text']
  this.scratchPad.addEventListener('input', this.scratchPadInput.bind(this));
  document.getElementById(this.prefix + '-shuffle').addEventListener(
        'click', this.scratchPadShuffle.bind(this));

  let info = 'Version: ' + this.VERSION + ', User Agent: ' + navigator.userAgent
  document.getElementById(this.prefix + '-report-bug').href =
        'https://github.com/viresh-ratnakar/exolve/issues/new?body=' +
        encodeURIComponent(info);

  this.CURR_ORPHAN_ID = this.prefix + '-curr-orphan'
}

Exolve.prototype.log = function(msg) {
  console.log('Exolve puzzle #' + this.index + ' [' + this.id + ']: ' + msg)
}

// The overall parser for the puzzle text.
Exolve.prototype.parseOverall = function() {
  this.specLines = []
  let rawLines = this.puzzleText.trim().split('\n');
  for (let rawLine of rawLines) {
    let cIndex = rawLine.indexOf('#');
    // A # followed by a non-space/non-eol character is not a comment marker.
    while (cIndex >= 0 && cIndex + 1 < rawLine.length &&
           rawLine.charAt(cIndex + 1) != ' ') {
      cIndex = rawLine.indexOf('#', cIndex + 1);
    }
    if (cIndex >= 0) {
      rawLine = rawLine.substr(0, cIndex).trim()
    }
    if (!rawLine) {
      continue;
    }
    this.specLines.push(rawLine)
  }
  this.numLines = this.specLines.length

  let parsedSec = this.parseSection()

  while (parsedSec && parsedSec.section != 'end') {
    let firstLine = this.nextLine
    let nextParsedSec = this.parseSection()
    let lastLine = this.nextLine - 2
    if (parsedSec.section == 'begin') {
    } else if (parsedSec.section == 'id') {
      this.id = parsedSec.value.trim()
    } else if (parsedSec.section == 'title') {
      this.title = parsedSec.value.trim()
    } else if (parsedSec.section == 'setter') {
      this.setter = parsedSec.value.trim()
    } else if (parsedSec.section == 'copyright') {
      this.copyright = parsedSec.value.trim()
    } else if (parsedSec.section == 'credits') {
      this.credits.push(parsedSec.value.trim())
    } else if (parsedSec.section == 'width') {
      this.gridWidth = parseInt(parsedSec.value)
    } else if (parsedSec.section == 'height') {
      this.gridHeight = parseInt(parsedSec.value)
    } else if (parsedSec.section == 'preamble' ||
               parsedSec.section == 'prelude') {
      this.preludeFirstLine = firstLine
      this.preludeLastLine = lastLine
    } else if (parsedSec.section == 'postscript') {
      this.psFirstLine = firstLine
      this.psLastLine = lastLine
    } else if (parsedSec.section == 'grid') {
      this.gridFirstLine = firstLine
      this.gridLastLine = lastLine
    } else if (parsedSec.section == 'nina') {
      this.parseNina(parsedSec.value)
    } else if (parsedSec.section == 'colour' ||
               parsedSec.section == 'color') {
      this.parseColour(parsedSec.value)
    } else if (parsedSec.section == 'question') {
      this.questionTexts.push(parsedSec.value)
    } else if (parsedSec.section == 'submit') {
      this.parseSubmit(parsedSec.value)
    } else if (parsedSec.section == 'across') {
      this.acrossFirstLine = firstLine
      this.acrossLastLine = lastLine
    } else if (parsedSec.section == 'down') {
      this.downFirstLine = firstLine
      this.downLastLine = lastLine
    } else if (parsedSec.section == 'nodir') {
      this.nodirFirstLine = firstLine
      this.nodirLastLine = lastLine
    } else if (parsedSec.section == 'option') {
      this.parseOption(parsedSec.value)
    } else if (parsedSec.section == 'language') {
      this.parseLanguage(parsedSec.value)
    } else if (parsedSec.section == 'explanations') {
      this.explnFirstLine = firstLine
      this.explnLastLine = lastLine
    } else if (parsedSec.section == 'relabel') {
      this.relabelFirstLine = firstLine
      this.relabelLastLine = lastLine
    }
    parsedSec = nextParsedSec
  }
}

// specLines[] has been parsed till line # nextLine. Find the
// next line beginning with 'exolve-<section>' and return <section> as well
// as the 'value' of the section (the part after ':').
Exolve.prototype.parseSection = function() {
  const MARKER = 'exolve-'
  while (this.nextLine < this.numLines &&
         this.specLines[this.nextLine].trim().indexOf(MARKER) != 0) {
      this.nextLine++;
  }
  if (this.nextLine >= this.numLines) {
    return null
  }
  // Skip past MARKER
  let line = this.specLines[this.nextLine].trim().substr(MARKER.length)
  let index = line.indexOf(':')
  if (index < 0) {
    index = line.length
  }
  this.nextLine++
  return {'section': line.substr(0, index).trim().toLowerCase(),
          'value': line.substr(index + 1).trim()}
}

// If s is like 15a or 16D, return A15 or D16. Otherwise just return s.
Exolve.prototype.maybeClueIndex = function(s) {
  if (s.trim().match(/^\d+[aAdD]$/)) {
    s = s.trim()
    s = s.substr(s.length - 1).toUpperCase() + s.substr(0, s.length - 1)
  }
  return s
}

// Parse a nina line, which consists of cell locations or clue indices.
// Convert the cell locations to [row col] and push an array of these to the
// global ninas array.
Exolve.prototype.parseNina = function(s) {
  let nina = []
  let cellsOrOthers = s.split(' ')
  for (let cellOrOther of cellsOrOthers) {
    if (!cellOrOther) {
      continue
    }
    let cellLocation = this.parseCellLocation(cellOrOther)
    if (!cellLocation) {
      // Must be a class name, for a span-class-specified nina OR a clue index
      nina.push(this.maybeClueIndex(cellOrOther))
    } else {
      nina.push(cellLocation)
    }
  }
  if (nina.length > 0) {
    this.ninas.push(nina)
  }
}

Exolve.prototype.parseColour = function(s) {
  let colourAndCells = s.split(' ')
  let colour = ''
  for (let c of colourAndCells) {
    if (!c) {
      continue
    }
    if (!colour) {
      colour = c
      continue;
    }
    let cellLocation = this.parseCellLocation(c)
    if (!cellLocation) {
      this.cellColours.push([this.maybeClueIndex(c), colour])  // clue index
    } else {
      this.cellColours.push(cellLocation.concat(colour))
    }
  }
}

Exolve.prototype.answerListener = function(answer, forceUpper) {
  this.deactivateCurrCell()
  this.deactivateCurrClue()
  this.usingGnav = false
  let cursor = answer.selectionStart
  if (forceUpper) {
    answer.value = answer.value.toUpperCase().trimLeft()
  } else {
    answer.value = answer.value.trimLeft()
  }
  answer.selectionEnd = cursor
  this.updateAndSaveState()
}

// Parse a questionTexts and create the question elements for (which include
// an input box for the answer). The solution answer may be provided after the
// last ')'.
Exolve.prototype.displayQuestions = function() {
  for (let s of this.questionTexts) {
    let enumParse = this.parseEnum(s)
    let inputLen = enumParse.placeholder.length

    let afterEnum = enumParse.afterEnum
    let rawQ = s.substr(0, afterEnum)

    let hideEnum = false
    if (inputLen > 0) {
      if (s.substr(afterEnum, 1) == '*') {
        let beforeEnum = s.lastIndexOf('(', afterEnum - 1)
        if (beforeEnum < 0) {
          this.throwErr('Could not find open-paren in question')
        }
        rawQ = s.substr(0, beforeEnum)
        afterEnum++
        hideEnum = true
      }
    }
    s = s.substr(afterEnum).trim();

    let forceUpper = true;
    if (s.substr(0,14) == "[lowercase-ok]") {
      forceUpper = false;
      s = s.substr(14).trim();
    }

    let correctAnswer = s;
    const question = document.createElement('div')
    question.setAttributeNS(null, 'class', 'xlv-question');
    const questionText = document.createElement('span')
    questionText.innerHTML = rawQ
    question.appendChild(questionText)
    question.appendChild(document.createElement('br'))

    if (inputLen == 0) {
      hideEnum = true
      inputLen = '30'
    }
    let rows = Math.floor(inputLen / this.textAreaCols)
    if (rows * this.textAreaCols < inputLen) {
      rows++
    }
    let cols = (rows > 1) ? this.textAreaCols : inputLen

    let aType = 'input'
    if (rows > 1) {
      aType = 'textarea'
    }

    const answer = document.createElement(aType)
    if (rows > 1) {
      answer.setAttributeNS(null, 'rows', '' + rows);
      answer.setAttributeNS(null, 'cols', '' + cols);
    } else {
      answer.setAttributeNS(null, 'size', '' + cols);
    }
    answer.setAttributeNS(null, 'class', 'xlv-answer');
    this.answersList.push({
      'ans': correctAnswer,
      'input': answer,
      'isq': true,
    });
    if (!hideEnum) {
      answer.setAttributeNS(null, 'placeholder', enumParse.placeholder);
    }
    answer.setAttributeNS(null, 'class', 'xlv-answer');
    answer.style.color = this.colorScheme['imp-text']
    if (rows == 1) {
      answer.setAttributeNS(null, 'type', 'text');
    }
    answer.setAttributeNS(null, 'maxlength', '' + inputLen * this.langMaxCharCodes);
    answer.setAttributeNS(null, 'autocomplete', 'off');
    answer.setAttributeNS(null, 'spellcheck', 'false');
    question.appendChild(answer)
    this.questions.appendChild(question)
    answer.addEventListener('input', this.answerListener.bind(this, answer, forceUpper));
  }
}

Exolve.prototype.parseSubmit = function(s) {
  let parts = s.split(' ')
  if (s.length < 2) {
    this.throwErr('Submit section must have a URL and a param name for the solution')
  }
  this.submitURL = parts[0]
  this.submitKeys = []
  for (let i = 1; i < parts.length; i++) {
    this.submitKeys.push(parts[i])
  }
}

Exolve.prototype.parseOption = function(s) {
  let sparts = s.split(' ')
  for (let spart of sparts) {
    spart = spart.trim().toLowerCase()
    if (spart == "hide-inferred-numbers") {
      this.hideInferredNumbers = true
      continue
    }
    if (spart == "allow-digits") {
      this.allowDigits = true
      continue
    }
    if (spart == "hide-copy-placeholder-buttons") {
      this.hideCopyPlaceholders = true
      continue
    }
    if (spart == "no-auto-solution-in-anno") {
      this.addSolutionToAnno = false
      continue
    }
    let kv = spart.split(':')
    if (kv.length != 2) {
      this.throwErr('Expected exolve-option: key:value, got: ' + spart)
    }
    if (kv[0] == 'clues-panel-lines') {
      this.cluesPanelLines = parseInt(kv[1])
      if (isNaN(this.cluesPanelLines)) {
        this.throwErr('Unexpected val in exolve-option: clue-panel-lines: ' + kv[1])
      }
      continue
    }
    if (kv[0] == 'offset-left') {
      this.offsetLeft = parseInt(kv[1])
      if (isNaN(this.offsetLeft)) {
        this.throwErr('Unexpected val in exolve-option: offset-left: ' + kv[1])
      }
      continue
    }
    if (kv[0] == 'offset-top') {
      this.offsetTop = parseInt(kv[1])
      if (isNaN(this.offsetTop)) {
        this.throwErr('Unexpected val in exolve-option: offset-top: ' + kv[1])
      }
      continue
    }
    if (kv[0] == 'grid-background') {
      this.colorScheme['background'] = kv[1]
      continue
    }
    if (kv[0].substr(0, 6) == 'color-' || kv[0].substr(0, 7) == 'colour-') {
      let key = kv[0].substr(kv[0].indexOf('-') + 1);
      if (!this.colorScheme[key]) {
        this.throwErr('Unsupported coloring option: ' + kv[0])
      }
      this.colorScheme[key] = kv[1]
      continue
    }
    this.throwErr('Unexpected exolve-option: ' + spart)
  }
}

Exolve.prototype.parseLanguage = function(s) {
  const parts = s.trim().split(' ')
  if (parts.length < 2) {
      this.throwErr('Usage: exolve-language: ' + s + 'cannot be parsed ' +
                    'as "language-code Script [max-char-codes]"')
  }
  this.language = parts[0]
  this.languageScript = parts[1]
  try {
      this.scriptRE = new RegExp('\\p{Script=' + this.languageScript + '}', 'u')
      this.scriptLowerCaseRE = new RegExp('\\p{Lowercase}', 'u')
  } catch (err) {
      this.throwErr(
        'Your browser ' +
        '<a href="https://caniuse.com/#search=Unicode%20property%20escapes"' +
        '>does not support Unicode property escapes</a> OR you\'ve provided ' +
        'an invalid Script name: ' + this.languageScript)
  }
  // Hard-code some known scripts requiring langMaxCharCodes
  if (this.languageScript.toLowerCase() == 'devanagari') {
      this.langMaxCharCodes = 4
  }
  if (parts.length > 2) {
      this.langMaxCharCodes = parseInt(parts[2])
      if (isNaN(this.langMaxCharCodes) || this.langMaxCharCodes < 1) {
        this.throwErr('invalid max-char-codes in exolve-language: ' + parts[2])
      }
  }
}

// Extracts the prelude from its previously identified lines and sets up
// its display.
Exolve.prototype.parseAndDisplayPrelude = function() {
  if (this.preludeFirstLine >= 0 && this.preludeFirstLine <= this.preludeLastLine) {
    let preludeText = this.specLines[this.preludeFirstLine]
    let l = this.preludeFirstLine + 1
    while (l <= this.preludeLastLine) {
      preludeText = preludeText + '\n' + this.specLines[l]
      l++;
    }
    document.getElementById(this.prefix + '-preamble').innerHTML = preludeText
  }
}

Exolve.prototype.parseAndDisplayPS = function() {
  if (this.psFirstLine >= 0 && this.psFirstLine <= this.psLastLine) {
    let psText = this.specLines[this.psFirstLine]
    let l = this.psFirstLine + 1
    while (l <= this.psLastLine) {
      psText = psText + '\n' + this.specLines[l]
      l++;
    }
    psHTML = `<div id='${this.prefix}-postscript' class='xlv-postscript'><hr> ${psText} </div>`;
    this.frame.insertAdjacentHTML('beforeend', psHTML);
  }
}

// Extracts the explanations section from its previously identified lines,
// populates its element, and adds it to revelationList.
Exolve.prototype.parseAndDisplayExplanations = function() {
  if (this.explnFirstLine >= 0 &&
      this.explnFirstLine <= this.explnLastLine) {
    let explnText = this.specLines[this.explnFirstLine]
    let l = this.explnFirstLine + 1
    while (l <= this.explnLastLine) {
      explnText = explnText + '\n' + this.specLines[l]
      l++;
    }
    const expln = document.getElementById(this.prefix + '-explanations')
    expln.innerHTML = explnText
    this.revelationList.push(expln)
  }
}

// Parses exolve-relabel, changing the text of various buttons etc.
// Sets language of the page if exolve-language was specified.
Exolve.prototype.parseAndDisplayRelabel = function() {
  if (this.relabelFirstLine >= 0 && this.relabelFirstLine <= this.relabelLastLine) {
    let l = this.relabelFirstLine
    while (l <= this.relabelLastLine) {
      const colon = this.specLines[l].indexOf(':')
      if (colon < 0) {
        this.throwErr('Line in exolve-relabel does not look like ' +
                      '"id: new-label":' + this.specLines[l])
      }
      let id = this.prefix + '-' + this.specLines[l].substr(0, colon).trim()
      let elt = document.getElementById(id)
      if (!elt) {
        this.throwErr('exolve-relabel: no element found with id: ' + id)
      }
      elt.innerHTML = this.specLines[l].substr(colon + 1).trim()
      l++;
    }
  }
  if (this.language) {
    this.frame.lang = this.language
    this.gridInput.lang = this.language
    this.questions.lang = this.language
    this.gridInput.maxLength = '' + (2 * this.langMaxCharCodes)
  }
}

// Append an error message to the errors div. Scuttle everything by setting
// gridWidth to 0.
Exolve.prototype.throwErr = function(error) {
  const e = document.getElementById(this.prefix + '-errors')
  if (e) {
    e.innerHTML = e.innerHTML + '<br/>' + error;
  }
  this.gridWidth = 0
  throw error;
}

// Run some checks for serious problems with grid dimensions, etc. If found,
// abort with error.
Exolve.prototype.checkConsistency = function() {
  if (this.gridWidth < 1 || this.gridWidth > this.MAX_GRID_SIZE ||
      this.gridHeight < 1 || this.gridHeight > this.MAX_GRID_SIZE) {
    this.throwErr('Bad/missing width/height');
  } else if (this.gridFirstLine < 0 || this.gridLastLine < this.gridFirstLine ||
             this.gridHeight != this.gridLastLine - this.gridFirstLine + 1) {
    this.throwErr('Mismatched width/height');
  }
  if (this.submitURL) {
    let numKeys = 1
    for (let a of this.answersList) {
      if (a.isq) {
        numKeys++
      } else {
        break
      }
    }
    if (this.submitKeys.length != numKeys) {
      this.throwErr('Have ' + this.submitKeys.length + ' submit parameter keys, need ' + numKeys);
    }
  }
}

Exolve.prototype.caseCheck = function(c) {
  if (this.scriptRE) {
    if (this.scriptRE.test(c)) {
      return !this.scriptLowerCaseRE.test(c)
    }
  } else {
    if (c >= 'A' && c <= 'Z') {
      return true
    }
  }
  return false
}

// display chars: A-Z, ⬛, 0-9
// state chars: A-Z, '-' (DIGIT0), '~' (DIGIT1), 2-9, '0' (blank), '1' (block
// in diagramless cell), '.'
// grid[i][j].solution and grid[i][j].currLetter are in "state char" space.
// grid specified originally, consumed by parseGrid() is in state char space,
// except:
//   0 can mean the digit 0 if allow-digits is true and there are entries
//   other than 0.
Exolve.prototype.isValidDisplayChar = function(c) {
  if (this.caseCheck(c)) {
    return true
  }
  if (c == this.BLOCK_CHAR) {
    return true
  }
  if (this.allowDigits && c >= '0' && c <= '9') {
    return true
  }
  return false
}

Exolve.prototype.isValidStateChar = function(c) {
  if (this.caseCheck(c)) {
    return true
  }
  if (this.allowDigits && ((c >= '2' && c <= '9') || c == this.DIGIT0 || c == this.DIGIT1)) {
    return true
  }
  if (c == '0') {
    return true
  }
  if (this.hasDiagramlessCells && c == '1') {
    return true
  }
  return false
}

Exolve.prototype.stateToDisplayChar = function(c) {
  if (c == '0') {
    return ''
  }
  if (c == '1') {
    return this.BLOCK_CHAR
  }
  if (c == this.DIGIT0) {
    return '0'
  }
  if (c == this.DIGIT1) {
    return '1'
  }
  return c
}

Exolve.prototype.displayToStateChar = function(c) {
  if (c == this.BLOCK_CHAR) {
    return '1'
  }
  if (c == '0') {
    return this.DIGIT0
  }
  if (c == '1') {
    return this.DIGIT1
  }
  if (!this.isValidDisplayChar(c)) {
    return '0'
  }
  return c
}

Exolve.prototype.newGridCell = function(row, col, letter) {
  let cell = {}
  cell.row = row
  cell.col = col
  cell.solution = letter.toUpperCase()
  cell.isLight = false
  if (cell.solution != '.') {
    if (cell.solution != '0' && !this.isValidDisplayChar(cell.solution)) {
      this.throwErr('Bad grid entry at ' + row + ',' + col + ':' + letter);
    }
    cell.isLight = true
  }
  cell.prefill = false
  cell.isDiagramless = false

  cell.hasBarAfter = false
  cell.hasBarUnder = false
  cell.hasCircle = false
  return cell;
};

// Parse grid lines into a gridWidth x gridHeight array of objects that have
// the following properties:
//   isLight
//   hasBarAfter
//   hasBarUnder
//   hasCircle
//   isDiagramless
//   startsClueLabel
//   startsAcrossClue
//   startsDownClue
//   acrossClueLabel: #
//   downClueLabel: #
// Also set the following globals:
//   hasDiagramlessCells
//   hasUnsolvedCells
Exolve.prototype.parseGrid = function() {
  let hasSolvedCells = false
  let allEntriesAre0s = true
  const DECORATORS = ' +|_@!*'
  const reDecorators = new RegExp('[' + DECORATORS + ']')
  const reNextChar = new RegExp('[\.0' + DECORATORS + ']')
  for (let i = 0; i < this.gridHeight; i++) {
    this.grid[i] = new Array(this.gridWidth)
    let gridLine = this.specLines[i + this.gridFirstLine].trim().toUpperCase()
    if (this.langMaxCharCodes == 1) {
      gridLine = gridLine.replace(/\s/g, '')
    } else {
      gridLine = gridLine.replace(/\s+/g, ' ')
    }
    let gridLineIndex = 0
    for (let j = 0; j < this.gridWidth; j++) {
      if (gridLineIndex >= gridLine.length) {
        let errmsg = 'Too few letters in the grid at 0-based row: ' + i
        if (this.langMaxCharCodes > 1) {
          errmsg = errmsg + '. Note that grid letters must be separated by ' +
            'spaces or decorators for languages that have compound characters';
        }
        this.throwErr(errmsg)
      }
      let letter = gridLine.charAt(gridLineIndex++)
      if (this.langMaxCharCodes > 1 && letter != '.' && letter != '0') {
        let next = gridLineIndex
        while (next < gridLine.length &&
               !reNextChar.test(gridLine.charAt(next))) {
          next++
        }
        letter = letter + gridLine.substring(gridLineIndex, next).trim()
        gridLineIndex = next
      }
      this.grid[i][j] = this.newGridCell(i, j, letter)
      let gridCell = this.grid[i][j]
      // Deal with . and 0 and 1 in second pass
      let thisChar = ''
      while (gridLineIndex < gridLine.length &&
             (thisChar = gridLine.charAt(gridLineIndex)) &&
             reDecorators.test(thisChar)) {
        if (thisChar == '|') {
          gridCell.hasBarAfter = true
        } else if (thisChar == '_') {
          gridCell.hasBarUnder = true
        } else if (thisChar == '+') {
          gridCell.hasBarAfter = true
          gridCell.hasBarUnder = true
        } else if (thisChar == '@') {
          gridCell.hasCircle = true
        } else if (thisChar == '*') {
          gridCell.isDiagramless = true
        } else if (thisChar == '!') {
          gridCell.prefill = true
        } else if (thisChar == ' ') {
        } else {
          this.throwErr('Should not happen! thisChar = ' + thisChar);
        }
        gridLineIndex++
      }
      if (gridCell.isLight && gridCell.solution != '0' && !gridCell.prefill) {
        allEntriesAre0s = false
      }
    }
  }
  // We use two passes to be able to detect if 0 means blank cell or digit 0.
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      let gridCell = this.grid[i][j]
      if (gridCell.isLight) {
        if (gridCell.solution == '0') {
          if (allEntriesAre0s && !gridCell.prefill) {
            this.hasUnsolvedCells = true
          } else {
            gridCell.solution = this.DIGIT0;
          }
        } else if (gridCell.solution == '1') {
          gridCell.solution = this.DIGIT1;
        }
      }
      if (gridCell.isDiagramless && gridCell.solution == '.') {
        gridCell.solution = '1'
      }
      if (gridCell.prefill && !gridCell.isLight) {
        this.throwErr('Pre-filled cell (' + i + ',' + j + ') not in a light: ')
      }
      if (gridCell.isDiagramless) {
        this.hasDiagramlessCells = true
      }
      if (gridCell.isLight && !gridCell.prefill && gridCell.solution != '0') {
        this.hasSolvedCells = true
      }
    }
  }
  if (this.hasDiagramlessCells) {
    this.hideCopyPlaceholders = true
  }
  if (this.hasUnsolvedCells && this.hasSolvedCells) {
    this.throwErr('Either all or no solutions should be provided')
  }
}

Exolve.prototype.startsAcrossClue = function(i, j) {
  if (!this.grid[i][j].isLight) {
    return false;
  }
  if (j > 0 && this.grid[i][j - 1].isLight && !this.grid[i][j - 1].hasBarAfter) {
    return false;
  }
  if (this.grid[i][j].hasBarAfter) {
    return false;
  }
  if (j == this.gridWidth - 1) {
    return false;
  }
  if (!this.grid[i][j + 1].isLight) {
    return false;
  }
  return true;
}

Exolve.prototype.startsDownClue = function(i, j) {
  if (!this.grid[i][j].isLight) {
    return false;
  }
  if (i > 0 && this.grid[i - 1][j].isLight && !this.grid[i - 1][j].hasBarUnder) {
    return false;
  }
  if (this.grid[i][j].hasBarUnder) {
    return false;
  }
  if (i == this.gridHeight - 1) {
    return false;
  }
  if (!this.grid[i + 1][j].isLight) {
    return false;
  }
  return true;
}

Exolve.prototype.newClue = function(index) {
  clue = {}
  clue.index = index
  clue.dir = index.substr(0, 1)
  clue.label = index.substr(1)
  clue.cells = []
  return clue
};

// Sets starts{Across,Down}Clue (boolean) and startsClueLabel (#) in
// grid[i][j]s where clues start.
Exolve.prototype.markClueStartsUsingGrid = function() {
  if (this.hasDiagramlessCells && this.hasUnsolvedCells) {
    // Cannot rely on grid. Clue starts should be provided in clues using
    // prefixes like #a8, #d2, etc.
    return
  }
  let nextClueNumber = 1
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      let gridCell = this.grid[i][j]
      if (this.startsAcrossClue(i, j)) {
        gridCell.startsAcrossClue = true
        gridCell.startsClueLabel = '' + nextClueNumber
        let clue = this.newClue('A' + nextClueNumber)
        this.clues[clue.index] = clue
      }
      if (this.startsDownClue(i, j)) {
        gridCell.startsDownClue = true
        gridCell.startsClueLabel = '' + nextClueNumber
        let clue = this.newClue('D' + nextClueNumber)
        this.clues[clue.index] = clue
      }
      if (gridCell.startsClueLabel) {
        nextClueNumber++
      }
    }
  }
}

  // If there are any html closing tags, move past them.
Exolve.prototype.adjustAfterEnum = function(clueLine, afterEnum) {
  let lineAfter = clueLine.substr(afterEnum)
  while (lineAfter.trim().substr(0, 2) == '</') {
    let closer = clueLine.indexOf('>', afterEnum);
    if (closer < 0) {
      return afterEnum
    }
    afterEnum = closer + 1
    lineAfter = clueLine.substr(afterEnum)
  }
  return afterEnum
}

// Parse a cell location in "chess notation" (a1 = bottom-left, etc.) or as
// 1-based row/col like r7c2 or c2r7 and return a two-element array [row, col].
Exolve.prototype.parseCellLocation = function(s) {
  let row = -1
  let col = -1
  s = s.trim()
  let spaceAt = s.indexOf(' ')
  if (spaceAt >= 0) {
    s = s.substr(0, spaceAt)
  }
  let matches = s.match(/r(\d+)c(\d+)/)
  if (matches && matches.length == 3) {
    row = this.gridHeight - parseInt(matches[1])
    col = parseInt(matches[2]) - 1
  } else {
    matches = s.match(/c(\d+)r(\d+)/)
    if (matches && matches.length == 3) {
      col = parseInt(matches[1]) - 1
      row = this.gridHeight - parseInt(matches[2])
    }
  }
  if (row < 0 || col < 0) {
    col = s.charCodeAt(0) - 'a'.charCodeAt(0)
    row = this.gridHeight - parseInt(s.substr(1))
  }
  if (isNaN(row) || isNaN(col) ||
      row < 0 || row >= this.gridHeight || col < 0 || col >= this.gridWidth) {
    return null
  }
  return [row, col];
}

// Parse an enum like (4) or (4,5), or (5-2,4).
// Return an object with the following properties:
// enumLen
// hyphenAfter[] (0-based indices)
// wordEndAfter[] (0-based indices)
// afterEnum index after enum
// placeholder (something like ???? ???-?'?)
Exolve.prototype.parseEnum = function(clueLine) {
  let parse = {
    'enumLen': 0,
    'wordEndAfter': [],
    'hyphenAfter': [],
    'afterEnum': clueLine.length,
    'placeholder': '',
  };
  let enumLocation = clueLine.search(/\([1-9]+[0-9\-,\.'’\s]*\)/)
  if (enumLocation < 0) {
    // Look for the the string 'word'/'letter'/? in parens.
    enumLocation = clueLine.search(/\([^)]*(word|letter|\?)[^)]*\)/i)
    if (enumLocation >= 0) {
      let enumEndLocation =
          enumLocation + clueLine.substr(enumLocation).indexOf(')')
      if (enumEndLocation <= enumLocation) {
        return parse
      }
      parse.afterEnum = this.adjustAfterEnum(clueLine, enumEndLocation + 1)
    }
    return parse
  }
  let enumEndLocation =
      enumLocation + clueLine.substr(enumLocation).indexOf(')')
  if (enumEndLocation <= enumLocation) {
    return parse
  }
  parse.afterEnum = this.adjustAfterEnum(clueLine, enumEndLocation + 1)
  let enumLeft = clueLine.substring(enumLocation + 1, enumEndLocation)
  let nextPart
  while (enumLeft && (nextPart = parseInt(enumLeft)) && !isNaN(nextPart) &&
         nextPart > 0) {
    for (let i = 0; i < nextPart; i++) {
      parse.placeholder = parse.placeholder + '?'
    }
    parse.enumLen = parse.enumLen + nextPart
    enumLeft = enumLeft.replace(/\s*\d+\s*/, '')
    let nextSymbol = enumLeft.substr(0, 1)
    if (nextSymbol == '-') {
      parse.hyphenAfter.push(parse.enumLen - 1)
      enumLeft = enumLeft.substr(1)
    } else if (nextSymbol == ',') {
      nextSymbol = ' '
      parse.wordEndAfter.push(parse.enumLen - 1)
      enumLeft = enumLeft.substr(1)
    } else if (nextSymbol == '.') {
      parse.wordEndAfter.push(parse.enumLen - 1)
      enumLeft = enumLeft.substr(1)
    } else if (nextSymbol == '\'') {
      enumLeft = enumLeft.substr(1)
    } else if (enumLeft.indexOf('’') == 0) {
      // Fancy apostrophe
      nextSymbol = '\''
      enumLeft = enumLeft.substr('’'.length)
    } else {
      break;
    }
    parse.placeholder = parse.placeholder + nextSymbol
  }
  return parse
}

// Parse a clue label from the start of clueLine.
// Return an object with the following properties:
// isFiller
// label
// isOffNum
// dir
// hasChildren
// skip
Exolve.prototype.parseClueLabel = function(clueLine) {
  let parse = {dir: '', label: ''};
  parse.hasChilden = false
  parse.skip = 0
  numberParts = clueLine.match(/^\s*[1-9]\d*/)
  if (numberParts && numberParts.length == 1) {
    let clueNum = parseInt(numberParts[0])
    parse.label = '' + clueNum
    parse.isOffNum = false
    parse.skip = numberParts[0].length
  } else {
    let bracOpenParts = clueLine.match(/^\s*\[/)
    if (!bracOpenParts || bracOpenParts.length != 1) {
      parse.isFiller = true
      return parse
    }
    let pastBracOpen = bracOpenParts[0].length
    let bracEnd = clueLine.indexOf(']')
    if (bracEnd < 0) {
      this.throwErr('Missing matching ] in clue label in ' + clueLine)
    }
    parse.label = clueLine.substring(pastBracOpen, bracEnd).trim()
    if (parse.label.charAt(parse.label.length - 1) == '.') {
       // strip trailing period
       parse.label = parse.label.substr(0, parse.label.length - 1).trim()
    }
    parse.isOffNum = true
    parse.skip = bracEnd + 1
  }
  clueLine = clueLine.substr(parse.skip)
  dirParts = clueLine.match(/^[aAdD]/)  // no leading space
  if (dirParts && dirParts.length == 1) {
    parse.dir = dirParts[0].trim().toUpperCase()
    parse.skip += dirParts[0].length
    clueLine = clueLine.substr(dirParts[0].length)
  }
  commaParts = clueLine.match(/^\s*,/)
  if (commaParts && commaParts.length == 1) {
    parse.hasChildren = true
    parse.skip += commaParts[0].length
    clueLine = clueLine.substr(commaParts[0].length)
  }
  // Consume trailing period if it is there (but not if it's followed
  // immediately by another period (i.e., don't skip "...")
  periodParts = clueLine.match(/^\s*\./)
  if (periodParts && periodParts.length == 1 && !clueLine.match(/^\s*\.\./)) {
    parse.hasChildren = false
    parse.skip += periodParts[0].length
    clueLine = clueLine.substr(periodParts[0].length)
  }
  return parse
}

Exolve.prototype.sameCells = function(cells1, cells2) {
  if ((!cells1 && cells2) || (cells1 && !cells2)) {
    return false
  }
  if (!cells1 && !cells2) {
    return true
  }
  if (cells1.length != cells2.length) {
    return false
  }
  for (let i = 0; i < cells1.length; i++) {
    const c1 = cells1[i]
    const c2 = cells2[i]
    if (c1.length != 2 || c2.length != 2 ||
        c1[0] != c2[0] || c1[1] != c2[1]) {
      return false
    }
  }
  return true
}

// If clueIndex is an orphan clue but the clue has enough info
// to resolve it to a known (and unspecified) grid clue, return
// its index. Otherwise return clueIndex itself.
Exolve.prototype.maybeRelocateClue = function(clueIndex, dir, clue) {
  if (!clue.startCell) {
    return clueIndex
  }
  if (!(clue.isOffNum && dir != 'X') &&
      !(clue.cells && clue.cells.length > 0 && dir == 'X')) {
    return clueIndex
  }
  const r = clue.startCell[0]
  const c = clue.startCell[1]
  let gridCell = this.grid[r][c]
  if (!gridCell.startsClueLabel) {
    return clueIndex
  }
  let replIndex = null
  let clueAtRepl = null
  if (dir == 'X') {
    if (gridCell.startsAcrossClue) {
      replIndex = 'A' + gridCell.startsClueLabel
      clueAtRepl = this.clues[replIndex]
      if (clueAtRepl && !clueAtRepl.clue &&
          this.sameCells(clue.cells, clueAtRepl.cells)) {
        return replIndex
      }
    }
    if (gridCell.startsDownClue) {
      replIndex = 'D' + gridCell.startsClueLabel
      clueAtRepl = this.clues[replIndex]
      if (clueAtRepl && !clueAtRepl.clue &&
          this.sameCells(clue.cells, clueAtRepl.cells)) {
        return replIndex
      }
    }
    return clueIndex
  }
  if (dir == 'A' && gridCell.startsAcrossClue) {
    replIndex = 'A' + gridCell.startsClueLabel
  } else if (dir == 'D' && gridCell.startsDownClue) {
    replIndex = 'D' + gridCell.startsClueLabel
  }
  clueAtRepl = this.clues[replIndex]
  if (replIndex && clueAtRepl && !clueAtRepl.clue &&
      clueAtRepl.cells.length > 0) {
    return replIndex
  }
  return clueIndex
}

// Parse a single clue.
// Return an Clue object with the following properties set:
// index
// label
// isOffNum
// children[] (raw parseClueLabel() results, not yet clueIndices)
// clue
// enumLen
// hyphenAfter[] (0-based indices)
// wordEndAfter[] (0-based indices)
// placeholder
// startCell optional, used in diagramless+unsolved and off-numeric labels
// cells[] optionally filled, if all clue cells are specified in the clue
// anno (the part after the enum, if present)
// isFiller
Exolve.prototype.parseClue = function(dir, clueLine) {
  clueLine = clueLine.trim()
  let numCellsGiven = 0
  let startCell = null
  let cells = []
  while (clueLine.indexOf('#') == 0) {
    let cell = this.parseCellLocation(clueLine.substr(1));
    if (!cell) {
      break
    }
    if (numCellsGiven == 0) {
      startCell = cell
    }
    clueLine = clueLine.replace(/^#[a-z0-9]*\s*/, '')
    numCellsGiven += 1
    if (numCellsGiven == 2) {
      cells.push(startCell)
      cells.push(cell)
    } else if (numCellsGiven > 2) {
      cells.push(cell)
    }
  }

  let clueLabelParse = this.parseClueLabel(clueLine)
  let clue = this.newClue(dir + clueLabelParse.label)

  if (clueLabelParse.isFiller) {
      clue.isFiller = true
    return clue
  }
  if (startCell) {
    clue.startCell = startCell
  }
  if (cells.length  > 0) {
    clue.cells = cells
  }
  if (clueLabelParse.dir && clueLabelParse.dir != dir) {
    this.throwErr('Explicit dir ' + clueLabelParse.dir +
                  ' does not match ' + dir + ' in clue: ' + clueLine)
  }
  clue.label = clueLabelParse.label
  clue.isOffNum = clueLabelParse.isOffNum
  let clueIndex = dir + clue.label
  if (clue.isOffNum) {
    let offNumIndex = dir + '#' + (this.nextNonNumId++)
    if (!this.offNumClueIndices[clue.label]) {
      this.offNumClueIndices[clue.label] = []
    }
    this.offNumClueIndices[clue.label].push(offNumIndex)
    clueIndex = offNumIndex
  }

  clueIndex = this.maybeRelocateClue(clueIndex, dir, clue)
  clue.index = clueIndex

  if (clue.cells.length > 0) {
    if (dir != 'X') {
      this.throwErr('Cells listed in non-nodir clue: ' + clueLine)
    }
    let prev = []
    for (let c of clue.cells) {
      let gridCell = this.grid[c[0]][c[1]]
      if (!gridCell.nodirClues) {
        gridCell.nodirClues = []
      }
      gridCell.nodirClues.push(clueIndex)
      if (prev.length > 0) {
        this.grid[prev[0]][prev[1]]['succ' + clueIndex] = {
          'cell': c,
          'dir': clueIndex
        }
        gridCell['pred' + clueIndex] = {
          'cell': prev,
          'dir': clueIndex
        }
      }
      prev = c
    }
  }

  clueLine = clueLine.substr(clueLabelParse.skip)
  clue.children = []
  while (clueLabelParse.hasChildren) {
    clueLabelParse = this.parseClueLabel(clueLine)
    clue.children.push(clueLabelParse)
    clueLine = clueLine.substr(clueLabelParse.skip)
  }

  let enumParse = this.parseEnum(clueLine)
  clue.enumLen = enumParse.enumLen
  clue.hyphenAfter = enumParse.hyphenAfter
  clue.wordEndAfter = enumParse.wordEndAfter
  clue.placeholder = enumParse.placeholder
  clue.clue = clueLine.substr(0, enumParse.afterEnum).trim()
  clue.anno = clueLine.substr(enumParse.afterEnum).trim()

  return clue
}

// For a sequence of clue indices and sell locations, create a flat
// list of all cell locations (returned as parse.cells) and a list
// of lists of individual segments of length > 1 (returned as
// parse.segments, used to "reveal this" when only a segment is active
// while usingGnav).
Exolve.prototype.parseCellsOfOrphan = function(s) {
  let segments = []
  let cells = []
  let cellsOrClues = s.trim().split(' ')
  for (let cellOrClue of cellsOrClues) {
    if (!cellOrClue) {
      continue
    }
    let cellLocation = this.parseCellLocation(cellOrClue)
    if (!cellLocation) {
      let theClue = this.clues[this.maybeClueIndex(cellOrClue)]
      if (!theClue || theClue.cells.length == 0) {
        return null
      }
      if (theClue.cells.length > 1) {
        segments.push(theClue.cells)
      }
      cells = cells.concat(theClue.cells)
    } else {
      cells.push(cellLocation)
    }
  }
  return cells.length == 0 ? null : {'cells': cells, 'segments': segments}
}

Exolve.prototype.setClueSolution = function(ci) {
  let theClue = this.clues[ci]
  if (!theClue) {
    return;
  }
  if (theClue.solution || theClue.parentClueIndex) {
    return;
  }
  let clueIndices = this.getLinkedClues(ci)
  let cells = []
  for (let clueIndex of clueIndices) {
    let chClue = this.clues[clueIndex]
    if (chClue.cellsOfOrphan) {
      for (let rowcol of chClue.cellsOfOrphan) {
        cells.push(rowcol)
      }
    } else {
      for (let rowcol of chClue.cells) {
        cells.push(rowcol)
      }
    }
  }
  if (cells.length == 0) {
    return;
  }
  let solution = '';
  for (let cell of cells) {
    let c = this.stateToDisplayChar(this.grid[cell[0]][cell[1]].solution)
    if (!c) {
      return
    }
    solution = solution + c;
  }
  if (!solution) {
    return;
  }
  if (theClue.placeholder) {
    let s = ''
    let index = 0;
    for (let i = 0; i < theClue.placeholder.length; i++) {
      if (theClue.placeholder.charAt(i) == '?') {
        if (index >= solution.length) {
          return;
        }
        s = s + solution.charAt(index++);
      } else {
        s = s + theClue.placeholder.charAt(i)
      }
    }
    if (index < solution.length) {
      s = s + solution.substr(index)
    }
    solution = s;
  }
  theClue.solution = solution;
}

Exolve.prototype.parseAnno = function(anno, clueIndex) {
  let theClue = this.clues[clueIndex]
  anno = anno.trim()
  while (anno && anno.substr(0, 1) == '[') {
    let indexOfBrac = anno.indexOf(']')
    if (indexOfBrac <= 0) {
      break;
    }
    let inBrac = anno.substring(1, indexOfBrac).trim();
    let cellsOfOrphan = this.parseCellsOfOrphan(inBrac);
    if (!theClue.cellsOfOrphan &&
        cellsOfOrphan && cellsOfOrphan.cells.length > 0) {
      theClue.cellsOfOrphan = cellsOfOrphan.cells
      for (let segment of cellsOfOrphan.segments) {
        this.cellsToOrphan[JSON.stringify(segment)] = clueIndex
        this.szCellsToOrphan++
      }
    } else if (inBrac && !theClue.solution) {
      theClue.solution = inBrac;
    } else {
      break;
    }
    anno = anno.substr(indexOfBrac + 1).trim()
    hasReveals = true
  }
  theClue.anno = anno;
}

// Parse across and down clues from their exolve sections previously
// identified by parseOverall(). Sets lastOrphan, if any.
// Sets cellsToOrphan[] for orphan clues for which revelations are provided.
Exolve.prototype.parseClueLists = function() {
  // Parse across, down, nodir clues
  let prev = null
  let firstClue = null
  let lastClue = null
  for (let clueDirection of ['A', 'D', 'X']) {
    let first, last
    if (clueDirection == 'A') {
      first = this.acrossFirstLine
      last = this.acrossLastLine
    } else if (clueDirection == 'D') {
      first = this.downFirstLine
      last = this.downLastLine
    } else {
      first = this.nodirFirstLine
      last = this.nodirLastLine
    }
    if (first < 0 || last < first) {
      continue
    }
    let filler = ''
    let startNewTable = false
    for (let l = first; l <= last; l++) {
      let clueLine = this.specLines[l].trim();
      if (clueLine == '') {
        continue;
      }
      if (clueLine.substr(0, 3) == '---') {
        startNewTable = true
        continue;
      }
      let clue = this.parseClue(clueDirection, clueLine)
      if (clue.isFiller) {
        filler = filler + clueLine + '\n'
        continue
      }
      if (!clue.index) {
        this.throwErr('Could not parse clue: ' + clueLine);
      }
      if (this.clues[clue.index] && this.clues[clue.index].clue) {
        this.throwErr('Clue entry already exists for clue: ' + clueLine);
      }
      if (!firstClue) {
        firstClue = clue.index
      }
      lastClue = clue.index

      if (this.clues[clue.index]) {
        if (clue.cells.length > 0) {
          let theClue = this.clues[clue.index]
          if (theClue.cells.length > 0) {
            if (!this.sameCells(theClue.cells, clue.cells)) {
              this.throwErr('Grid, clue diff in cells for ' + clue.index)
            }
          }
        } else {
          // Take the cells from the parsing of the grid.
          clue.cells = this.clues[clue.index].cells
        }
      }
      this.clues[clue.index] = clue
      clue.displayLabel = clue.label
      // clue.index may have a different (A/D) dir than clueDirection (X)
      // if maybeRelocateClue() found one,
      if (clueDirection != clue.dir) {
        clue.clueTableDir = clueDirection
      }
      clue.fullDisplayLabel = clue.label
      if (clueDirection != 'X' && clue.label) {
        clue.fullDisplayLabel =
            clue.fullDisplayLabel + clueDirection.toLowerCase()
      }
      clue.childrenClueIndices = []

      this.parseAnno(clue.anno, clue.index)

      if (clue.startCell) {
        let row = clue.startCell[0]
        let col = clue.startCell[1]
        this.grid[row][col].forcedClueLabel = clue.label
      }
      clue.prev = prev
      clue.next = null
      if (prev) {
        this.clues[prev].next = clue.index
      }
      prev = clue.index
      if (filler) {
        clue.filler = filler
        filler = ''
      }
      if (startNewTable) {
        clue.startNewTable = true
        startNewTable = false
      }

      if (clue.clue) {
        this.allClueIndices.push(clue.index)
      }
    }
    if (filler) {
      this.throwErr('Filler line should not be at the end: ' + filler)
    }
  }
  if (firstClue && lastClue) {
    this.clues[firstClue].prev = lastClue
    this.clues[lastClue].next = firstClue
  }
  for (let clueIndex of this.allClueIndices) {
    if (!this.clues[clueIndex].parentClueIndex && this.isOrphan(clueIndex)) {
      this.lastOrphan = clueIndex
      break
    }
  }
}

Exolve.prototype.isOrphan = function(clueIndex) {
  let theClue = this.clues[clueIndex]
  return theClue && theClue.cells.length == 0;
}

Exolve.prototype.isOrphanWithReveals = function(clueIndex) {
  return this.isOrphan(clueIndex) && this.clues[clueIndex].cellsOfOrphan
}

Exolve.prototype.allCellsKnown = function(clueIndex) {
  let cis = this.getLinkedClues(clueIndex)
  if (!cis || cis.length == 0) {
    return false
  }
  clueIndex = cis[0]
  let clue = this.clues[clueIndex]
  if (!clue) {
    return false
  }
  if (!clue.enumLen) {
    return false
  }
  let allKnown = false
  let numCells = 0
  let numPrefilled = 0
  for (let ci of cis) {
    if (!this.clues[ci]) {
      return false
    }
    if (this.clues[ci].cells.length > 0) {
      numCells += this.clues[ci].cells.length
    } else if (this.clues[ci].cellsOfOrphan && this.clues[ci].cellsOfOrphan.length > 0) {
      numCells += this.clues[ci].cellsOfOrphan.length
    } else {
      return false
    }
  }
  return numCells == clue.enumLen
}

// For each cell grid[i][j], set {across,down}ClueLabels using previously
// marked clue starts. Alse set clues[clueIndex].cells for across and down
// clues.
Exolve.prototype.setClueMemberships = function() {
  // Set across clue memberships
  for (let i = 0; i < this.gridHeight; i++) {
    let clueLabel = ''
    for (let j = 0; j < this.gridWidth; j++) {
      let gridCell = this.grid[i][j]
      if (gridCell.startsAcrossClue) {
        clueLabel = gridCell.startsClueLabel
      }
      if (!clueLabel) {
        continue
      }
      if (!gridCell.isLight || gridCell.isDiagramless) {
        clueLabel = '';
        continue
      }
      if (!gridCell.startsAcrossClue && j > 0 && this.grid[i][j - 1].hasBarAfter) {
        clueLabel = '';
        continue
      }
      gridCell.acrossClueLabel = clueLabel
      let clueIndex = 'A' + clueLabel
      if (!this.clues[clueIndex]) {
        this.throwErr('Somehow did not find clues table entry for ' + clueIndex)
      }
      this.clues[clueIndex].cells.push([i, j])
    }
  }
  // Set down clue memberships
  for (let j = 0; j < this.gridWidth; j++) {
    let clueLabel = ''
    for (let i = 0; i < this.gridHeight; i++) {
      let gridCell = this.grid[i][j]
      if (gridCell.startsDownClue) {
        clueLabel = gridCell.startsClueLabel
      }
      if (!clueLabel) {
        continue
      }
      if (!gridCell.isLight || gridCell.isDiagramless) {
        clueLabel = '';
        continue
      }
      if (!gridCell.startsDownClue && i > 0 && this.grid[i - 1][j].hasBarUnder) {
        clueLabel = '';
        continue
      }
      gridCell.downClueLabel = clueLabel
      let clueIndex = 'D' + clueLabel
      if (!this.clues[clueIndex]) {
        this.throwErr('Somehow did not find clues table entry for ' + clueIndex)
      }
      this.clues[clueIndex].cells.push([i, j])
    }
  }
}

// For clues that have "child" clues (indicated like, '2, 13, 14' for parent 2,
// child 13, child 14), save the parent-child relationships, and successor grid
// cells for last cells in component clues, and spilled-over hyphenAfter and
// wordEndAfter locations.
Exolve.prototype.processClueChildren = function() {
  for (let clueIndex of this.allClueIndices) {
    let clue = this.clues[clueIndex]
    if (!clue.children) {
      continue
    }
    // Process children
    // We also need to note the successor of the last cell from the parent
    // to the first child, and then from the first child to the next, etc.
    let lastRowCol = null
    if (clue.cells.length > 0) {
      lastRowCol = clue.cells[clue.cells.length - 1]
      // If we do not know the enum of this clue (likely a diagramless puzzle),
      // do not set successors.
      if (!clue.enumLen || clue.enumLen <= 0) {
        lastRowCol = null
      }
    }
    let lastRowColDir = clue.dir
    dupes = {}
    const allDirections = ['A', 'D', 'X']
    for (let child of clue.children) {
      // Direction could be the same as the direction of the parent. Or,
      // if there is no such clue, then direction could be the other direction.
      // The direction could also be explicitly specified with a 'd' or 'a'
      // suffix.
      let childIndex = clue.dir + child.label
      if (!child.isOffNum) {
        if (!this.clues[childIndex]) {
          for (let otherDir of allDirections) {
            if (otherDir == clue.dir) {
              continue;
            }
            childIndex = otherDir + child.label
            if (this.clues[childIndex]) {
              break
            }
          }
        }
        if (child.dir) {
          childIndex = child.dir + child.label
        }
      } else {
        if (!this.offNumClueIndices[child.label] ||
            this.offNumClueIndices[child.label].length < 1) {
          this.throwErr('non-num child label ' + child.label + ' was not seen')
        }
        childIndex = this.offNumClueIndices[child.label][0]
      }
      if (!this.clues[childIndex] || childIndex == clueIndex) {
        this.throwErr('Invalid child ' + childIndex + ' in ' + clue.cluelabel + clue.dir);
      }
      if (dupes[childIndex]) {
        this.throwErr('Duplicate child ' + childIndex + ' in ' + clue.cluelabel + clue.dir);
      }
      dupes[childIndex] = true
      if (child.label) {
        clue.displayLabel = clue.displayLabel + ', ' + child.label
        if (child.dir && child.dir != clue.dir) {
          clue.displayLabel = clue.displayLabel + child.dir.toLowerCase()
        }
        clue.fullDisplayLabel = clue.fullDisplayLabel + ', ' + child.label
        if (childIndex.charAt(0) != 'X') {
          clue.fullDisplayLabel =
            clue.fullDisplayLabel + childIndex.charAt(0).toLowerCase()
        }
      }
      clue.childrenClueIndices.push(childIndex)
      let childClue = this.clues[childIndex]
      childClue.parentClueIndex = clueIndex

      if (lastRowCol && childClue.cells.length > 0) {
        let cell = childClue.cells[0]
        let childDir = childClue.dir
        if (lastRowCol[0] == cell[0] && lastRowCol[1] == cell[1]) {
          if (childDir == lastRowColDir || childClue.cells.length == 1) {
            this.throwErr('loop in successor for ' + lastRowCol)
          }
          cell = childClue.cells[1]  // Advance to the next cell.
        }
        this.grid[lastRowCol[0]][lastRowCol[1]]['succ' + lastRowColDir] = {
          'cell': cell,
          'dir': childDir
        };
        this.grid[cell[0]][cell[1]]['pred' + childDir] = {
          'cell': lastRowCol,
          'dir': lastRowColDir
        };
      }

      lastRowCol = null
      if (childClue.cells.length > 0) {
        lastRowCol = childClue.cells[childClue.cells.length - 1]
      }
      lastRowColDir = childClue.dir
    }
    if (this.hasDiagramlessCells) {
      continue
    }
    // If clue.wordEndAfter[] or clue.hyphenAfter() spill into children,
    // then copy the appropriate parts there.
    let prevLen = clue.cells.length
    let wordEndIndex = 0
    while (wordEndIndex < clue.wordEndAfter.length &&
           clue.wordEndAfter[wordEndIndex] < prevLen) {
      wordEndIndex++;
    }
    let hyphenIndex = 0
    while (hyphenIndex < clue.hyphenAfter.length &&
           clue.hyphenAfter[hyphenIndex] < prevLen) {
      hyphenIndex++;
    }
    for (let childIndex of clue.childrenClueIndices) {
      let childLen = this.clues[childIndex].cells.length
      while (wordEndIndex < clue.wordEndAfter.length &&
             clue.wordEndAfter[wordEndIndex] < prevLen + childLen) {
        let pos = clue.wordEndAfter[wordEndIndex] - prevLen
        this.clues[childIndex].wordEndAfter.push(pos)
        wordEndIndex++
      }
      while (hyphenIndex < clue.hyphenAfter.length &&
             clue.hyphenAfter[hyphenIndex] < prevLen + childLen) {
        let pos = clue.hyphenAfter[hyphenIndex] - prevLen
        this.clues[childIndex].hyphenAfter.push(pos)
        hyphenIndex++
      }
      prevLen = prevLen + childLen
    }
  }
}

Exolve.prototype.roughlyStartsWith = function(s, prefix) {
  const punct = /[\s'.,-]*/gi
  let normS = s.trim().replace(/<[^>]*>/gi, '').replace(punct, '').trim().toUpperCase();
  let normP = prefix.trim().replace(punct, '').trim().toUpperCase();
  return normS.startsWith(normP);
}

// Copy clue solutions to annos if warranted.
// Place a trailing period and space at the end of clue full display labels that
// end in letter/digit. Wrap in a clickable span if all cells are not known.
Exolve.prototype.finalClueTweaks = function() {
  for (let clueIndex of this.allClueIndices) {
    let theClue = this.clues[clueIndex]
    this.setClueSolution(clueIndex)
    if (this.addSolutionToAnno && theClue.solution && !this.isOrphan(clueIndex) &&
        !this.roughlyStartsWith(theClue.anno, theClue.solution)) {
      // For orphans, we reveal in their placeholder blanks.
      theClue.anno = '<span class="xlv-solution">' + theClue.solution +
                     '</span>. ' + theClue.anno;
    }
    if (theClue.anno) {
      this.hasReveals = true
    }
    if (!theClue.fullDisplayLabel) {
      continue
    }
    let label = theClue.fullDisplayLabel
    let l = label.length
    if (l < 1) {
      continue
    }
    let last = label.charAt(l - 1).toLowerCase()
    if ((last >= 'a' && last <= 'z') || (last >= '0' && last <= '9')) {
      label = label + '. '
    } else {
      label = label + ' '
    }
    if (!this.allCellsKnown(clueIndex)) {
      theClue.fullDisplayLabel = `<span class="xlv-clickable"><span id="${this.prefix}-curr-clue-label" class="xlv-curr-clue-label"
            title="${this.MARK_CLUE_TOOLTIP}">${label}</span></span>`
    } else {
      theClue.fullDisplayLabel = `<span id="${this.prefix}-curr-clue-label" class="xlv-curr-clue-label">
          ${label}</span>`;
    }
  }
}

// Using hyphenAfter[] and wordEndAfter[] in clues, set
// {hyphen,wordEnd}{ToRight,Below} in grid[i][j]s.
Exolve.prototype.setWordEndsAndHyphens = function() {
  if (this.hasDiagramlessCells) {
    // Give up on this
    return
  }
  // Going across
  for (let i = 0; i < this.gridHeight; i++) {
    let clueLabel = ''
    let clueIndex = ''
    let positionInClue = -1
    for (let j = 0; j < this.gridWidth; j++) {
      let gridCell = this.grid[i][j]
      if (!gridCell.acrossClueLabel) {
        clueLabel = ''
        clueIndex = ''
        positionInClue = -1
        continue
      }
      if (clueLabel == gridCell.acrossClueLabel) {
        positionInClue++
      } else {
        clueLabel = gridCell.acrossClueLabel
        positionInClue = 0
        clueIndex = 'A' + clueLabel
        if (!this.clues[clueIndex]) {
          if (!this.offNumClueIndices[clueLabel]) {
            clueLabel = ''
            clueIndex = ''
            positionInClue = -1
            continue
          }
          for (ci of this.offNumClueIndices[clueLabel]) {
            if (ci.charAt(0) == 'A' || ci.charAt(0) == 'X') {
              clueIndex = ci
              break
            }
          }
        }
        if (!this.clues[clueIndex] || !this.clues[clueIndex].clue) {
          clueLabel = ''
          clueIndex = ''
          positionInClue = -1
          continue
        }
      }
      for (let wordEndPos of this.clues[clueIndex].wordEndAfter) {
        if (positionInClue == wordEndPos) {
          gridCell.wordEndToRight = true
          break
        }
      }
      for (let hyphenPos of this.clues[clueIndex].hyphenAfter) {
        if (positionInClue == hyphenPos) {
          gridCell.hyphenToRight = true
          break
        }
      }
    }
  }
  // Going down
  for (let j = 0; j < this.gridWidth; j++) {
    let clueLabel = ''
    let clueIndex = ''
    let positionInClue = -1
    for (let i = 0; i < this.gridHeight; i++) {
      let gridCell = this.grid[i][j]
      if (!gridCell.downClueLabel) {
        clueLabel = ''
        clueIndex = ''
        positionInClue = -1
        continue
      }
      if (clueLabel == gridCell.downClueLabel) {
        positionInClue++
      } else {
        clueLabel = gridCell.downClueLabel
        positionInClue = 0
        clueIndex = 'D' + clueLabel
        if (!this.clues[clueIndex]) {
          if (!this.offNumClueIndices[clueLabel]) {
            clueLabel = ''
            clueIndex = ''
            positionInClue = -1
            continue
          }
          for (ci of this.offNumClueIndices[clueLabel]) {
            if (ci.charAt(0) == 'D' || ci.charAt(0) == 'X') {
              clueIndex = ci
              break
            }
          }
        }
        if (!this.clues[clueIndex] || !this.clues[clueIndex].clue) {
          clueLabel = ''
          clueIndex = ''
          positionInClue = -1
          continue
        }
      }
      for (let wordEndPos of this.clues[clueIndex].wordEndAfter) {
        if (positionInClue == wordEndPos) {
          gridCell.wordEndBelow = true
          break
        }
      }
      for (let hyphenPos of this.clues[clueIndex].hyphenAfter) {
        if (positionInClue == hyphenPos) {
          gridCell.hyphenBelow = true
          break
        }
      }
    }
  }
}

Exolve.prototype.cmpGnavSpans = function(s1, s2) {
  let d1 = s1.dir
  let d2 = s2.dir
  if (d1 < d2) {
    return -1
  } else if (d1 > d2) {
    return 1
  }
  let c1 = s1.cells[0]
  let c2 = s2.cells[0]
  if (c1[0] < c2[0]) {
    return -1
  } else if (c1[0] > c2[0]) {
    return 1
  }
  if (c1[1] < c2[1]) {
    return -1
  } else if (c1[1] > c2[1]) {
    return 1
  } else {
    return 0
  }
}

Exolve.prototype.extendsDiagramlessA = function(row, col) {
  let gridCell = this.grid[row][col]
  if (gridCell.isDiagramless) {
    return true
  }
  if (col > 0 && gridCell.isLight && !gridCell.acrossClueLabel) {
    return this.extendsDiagramlessA(row, col - 1)
  }
  return false
}

Exolve.prototype.extendsDiagramlessD = function(row, col) {
  let gridCell = this.grid[row][col]
  if (gridCell.isDiagramless) {
    return true
  }
  if (row > 0 && gridCell.isLight && !gridCell.downClueLabel) {
    return this.extendsDiagramlessD(row - 1, col)
  }
  return false
}

Exolve.prototype.setUpGnav = function() {
  let gnavSpans = []
  for (let ci in this.clues) {
    if (!this.clues.hasOwnProperty(ci)) {
      continue
    }
    if (this.clues[ci].cells.length == 0) {
      continue
    }
    let dir = (ci.charAt(0) == 'X') ? ci : ci.charAt(0)
    gnavSpans.push({
      'cells': this.clues[ci].cells,
      'dir': dir,
    })
  }
  // The following two loops add diagramless cells to gnav, and also set
  // up advancing typing across/down consecutive diagramless cells.
  for (let i = 0; i < this.gridHeight; i++) {
    let lastDiagramless = null
    for (let j = 0; j < this.gridWidth; j++) {
      if (this.extendsDiagramlessA(i, j)) {
        gnavSpans.push({
          'cells': [[i,j]],
          'dir': 'A',
        })
        if (lastDiagramless) {
          let lr = lastDiagramless[0]
          let lc = lastDiagramless[1]
          this.grid[lr][lc].succA = { 'cell': [i, j], 'dir': 'A'}
          this.grid[i][j].predA = { 'cell': [lr, lc], 'dir': 'A'}
        }
        lastDiagramless = [i, j]
      } else {
        lastDiagramless = null
      }
    }
  }
  for (let j = 0; j < this.gridWidth; j++) {
    let lastDiagramless = null
    for (let i = 0; i < this.gridHeight; i++) {
      if (this.extendsDiagramlessD(i, j)) {
        gnavSpans.push({
          'cells': [[i,j]],
          'dir': 'D',
        })
        if (lastDiagramless) {
          let lr = lastDiagramless[0]
          let lc = lastDiagramless[1]
          this.grid[lr][lc].succD = { 'cell': [i, j], 'dir': 'D'}
          this.grid[i][j].predD = { 'cell': [lr, lc], 'dir': 'D'}
        }
        lastDiagramless = [i, j]
      } else {
        lastDiagramless = null
      }
    }
  }
  gnavSpans.sort(this.cmpGnavSpans)

  // Set up gnav
  for (let idx = 0; idx < gnavSpans.length; idx++) {
    let prev = idx - 1
    if (prev < 0) {
      prev = gnavSpans.length - 1
    }
    let next = idx + 1
    if (next >= gnavSpans.length) {
      next = 0
    }
    for (let cell of gnavSpans[idx].cells) {
      this.grid[cell[0]][cell[1]]['next' + gnavSpans[idx].dir] = {
        'cell': gnavSpans[next].cells[0],
        'dir': gnavSpans[next].dir,
      }
      this.grid[cell[0]][cell[1]]['prev' + gnavSpans[idx].dir] = {
        'cell': gnavSpans[prev].cells[0],
        'dir': gnavSpans[prev].dir,
      }
    }
  }
}

Exolve.prototype.applyColorScheme = function() {
  let customStyles = document.createElement('style')
  customStyles.innerHTML = `
    #${this.prefix}-frame span.xlv-solved,
    #${this.prefix}-frame .xlv-solved td:first-child {
      color: ${this.colorScheme['solved']};
    }
    #${this.prefix}-status {
      color: ${this.colorScheme['imp-text']};
    }
    #${this.prefix}-frame .xlv-button {
      background-color: ${this.colorScheme['button']};
      color: ${this.colorScheme['button-text']};
    }
    #${this.prefix}-frame .xlv-button:hover {
      background-color: ${this.colorScheme['button-hover']};
    }
    #${this.prefix}-frame .xlv-button:disabled {
      background-color: gray;
    }
    #${this.prefix}-frame .xlv-small-button {
      background-color: ${this.colorScheme['small-button']};
      color: ${this.colorScheme['small-button-text']};
    }
    #${this.prefix}-frame .xlv-small-button:hover {
      background-color: ${this.colorScheme['small-button-hover']};
    }
  `;
  document.body.appendChild(customStyles);
}

Exolve.prototype.stripLineBreaks = function(s) {
  s = s.replace(/<br\s*\/?>/gi, " / ")
  return s.replace(/<\/br\s*>/gi, "")
}

Exolve.prototype.displayClues = function() {
  // Populate clues tables. Check that we have all clues
  let table = null
  let dir = ''
  for (let clueIndex of this.allClueIndices) {
    if (!this.clues[clueIndex].clue && !this.clues[clueIndex].parentClueIndex) {
      this.throwErr('Found no clue text nor a parent clue for ' + clueIndex)
    }
    let clueDir = this.clues[clueIndex].clueTableDir ||
                  this.clues[clueIndex].dir
    if (dir != clueDir) {
      if (clueDir == 'A') {
        table = this.acrossClues
        this.hasAcrossClues = true
      } else if (clueDir == 'D') {
        table = this.downClues
        this.hasDownClues = true
      } else if (clueDir == 'X') {
        table = this.nodirClues
        this.hasNodirClues = true
      } else {
        this.throwErr('Unexpected clue direction ' + clueDir + ' in ' + clueIndex)
      }
      dir = clueDir
    }
    if (this.clues[clueIndex].startNewTable) {
      let newPanel = document.createElement('div')
      newPanel.setAttributeNS(null, 'class', 'xlv-clues-box');
      newPanel.appendChild(document.createElement('hr'))
      let newTable = document.createElement('table')
      newPanel.appendChild(newTable)
      newPanel.appendChild(document.createElement('br'))

      let tableParent = table.parentElement
      tableParent.parentElement.insertBefore(newPanel, tableParent.nextSibling)
      table = newTable
    }
    if (this.clues[clueIndex].filler) {
      let tr = document.createElement('tr')
      let col = document.createElement('td')
      col.setAttributeNS(null, 'colspan', '2');
      col.setAttributeNS(null, 'class', 'xlv-filler');
      col.innerHTML = this.clues[clueIndex].filler
      tr.appendChild(col)
      table.appendChild(tr)
    }
    let tr = document.createElement('tr')
    let col1 = document.createElement('td')
    col1.innerHTML = this.clues[clueIndex].displayLabel

    let col1Chars = this.clues[clueIndex].displayLabel.replace(/&[^;]*;/g, '#')
    let col1NumChars = [...col1Chars].length
    if (col1Chars.substr(1, 1) == ',') {
      // Linked clue that begins with a single-letter/digit clue number. Indent!
      col1.style.textIndent =
        this.caseCheck(col1Chars.substr(0, 1)) ? '0.55ch' : '1ch'
      col1Chars = '0' + col1Chars
      col1NumChars++
    }
    if (!this.allCellsKnown(clueIndex)) {
      col1.setAttributeNS(null, 'class', 'xlv-clickable')
      col1.setAttributeNS(null, 'title', this.MARK_CLUE_TOOLTIP)
      col1.addEventListener('click', this.clueStateToggler.bind(this, clueIndex));
    }
    let col2 = document.createElement('td')
    col2.innerHTML = this.clues[clueIndex].clue
    if (col1NumChars > 2) {
      // More than two unicode chars in col1. Need to indent col2.
      col1Chars = col1Chars.substr(2)
      // spaces and equal number of commas use 0.6
      let col1Spaces = col1Chars.split(' ').length - 1
      let indent = col1Spaces * 2 * 0.6
      // digits, lowercase letters use 1
      let col1Digits = col1Chars.replace(/[^0-9a-z]*/g, '').length
      indent = indent + (col1Digits * 1)
      // uppercase letters use 1.1
      let col1Letters = col1Chars.replace(/[^A-Z]*/g, '').length
      indent = indent + (col1Letters * 1.1)
      let rem = col1Chars.length - col1Letters - col1Digits - (2 * col1Spaces);
      if (rem > 0) {
        indent = indent + (rem * 1.7)
      }
      if (indent < 0.5) {
        indent = 0.5
      }
      col2.style.textIndent = '' + indent + 'ch'
    }

    if (this.isOrphan(clueIndex) && !this.clues[clueIndex].parentClueIndex) {
      let placeholder = ''
      let len = this.DEFAULT_ORPHAN_LEN
      if (this.clues[clueIndex].placeholder) {
        placeholder = this.clues[clueIndex].placeholder
        len = placeholder.length
      }
      this.addOrphanUI(col2, false, len, placeholder, clueIndex)
      this.clues[clueIndex].orphanPlaceholder =
        col2.lastElementChild.firstElementChild;
      this.answersList.push({
        'input': this.clues[clueIndex].orphanPlaceholder,
        'isq': false,
      });
    }
    // If clue contains <br> tags, replace them with "/" for future renderings
    // in the "current clue" strip.
    if (this.clues[clueIndex].clue.indexOf('<') >= 0) {
      this.clues[clueIndex].clue = this.stripLineBreaks(this.clues[clueIndex].clue)
    }
    if (this.clues[clueIndex].anno) {
      let anno = document.createElement('span')
      anno.setAttributeNS(null, 'class', 'xlv-anno-text');
      anno.innerHTML = ' ' + this.clues[clueIndex].anno
      anno.style.color = this.colorScheme['anno']
      anno.style.display = 'none'
      this.revelationList.push(anno)
      col2.appendChild(anno)
      this.clues[clueIndex].annoSpan = anno
    }
    tr.appendChild(col1)
    tr.appendChild(col2)
    tr.addEventListener('click', this.clueActivator.bind(this, clueIndex));
    this.clues[clueIndex].clueTR = tr
    table.appendChild(tr)
  }
  if (this.cluesPanelLines > 0) {
    const ems = 1.40 * this.cluesPanelLines
    const emsStyle = '' + ems + 'em'
    this.acrossPanel.style.height = emsStyle
    this.downPanel.style.height = emsStyle
    if (nodirPanel) {
      this.nodirPanel.style.height = emsStyle
    }
  }
  if (this.hasAcrossClues) {
    this.acrossPanel.style.display = ''
  }
  if (this.hasDownClues) {
    this.downPanel.style.display = ''
  }
  if (this.hasNodirClues) {
    this.nodirPanel.style.display = ''
  }
}

Exolve.prototype.computeGridSize = function() {
  const viewportDim = Math.min(this.getViewportWidth(), this.getViewportHeight())
  this.squareDim = 31
  if (this.gridWidth <= 30 &&  // For jumbo grids, give up.
      (this.squareDim + this.GRIDLINE) * this.gridWidth + this.GRIDLINE > viewportDim - 8) {
    this.squareDim = Math.max(20,
      Math.floor((viewportDim - 8 - this.GRIDLINE) / this.gridWidth) - this.GRIDLINE)
  }
  this.squareDimBy2 = Math.floor((this.squareDim + 1) / 2)
  this.numberStartY = Math.floor(this.squareDim / 3)
  this.lightStartX = 1.0 + this.squareDim / 2.0
  this.lightStartY = 1.925 + Math.floor((2 * this.squareDim) / 3)
  this.hyphenW = Math.max(7, Math.floor(this.squareDim / 3) - 1)
  this.hyphenWBy2 = Math.floor((this.hyphenW + 1) / 2)
  this.circleR = 0.0 + this.squareDim / 2.0
  this.boxWidth = (this.squareDim * this.gridWidth) + ((this.gridWidth + 1) * this.GRIDLINE)
  this.boxHeight = (this.squareDim * this.gridHeight) + ((this.gridHeight + 1) * this.GRIDLINE)
  this.textAreaCols = Math.min(65, Math.max(30, Math.floor((viewportDim - 8) / 8)))
  this.letterSize = Math.max(10, this.squareDimBy2)
  this.numberSize = Math.max(7, Math.floor(this.squareDim / 3) - 1)
  this.arrowSize = Math.max(8, Math.floor(13 * this.squareDim / 31))
}

Exolve.prototype.displayGridBackground = function() {
  let svgWidth = this.boxWidth + (2 * this.offsetLeft)
  let svgHeight = this.boxHeight + (2 * this.offsetTop)
  this.svg.setAttributeNS(null, 'viewBox', '0 0 ' + svgWidth + ' ' + svgHeight)
  this.svg.setAttributeNS(null, 'width', svgWidth);
  this.svg.setAttributeNS(null, 'height', svgHeight);

  this.background =
      document.createElementNS('http://www.w3.org/2000/svg', 'rect');

  this.background.setAttributeNS(null, 'x', this.offsetLeft);
  this.background.setAttributeNS(null, 'y', this.offsetTop);
  this.background.setAttributeNS(null, 'width', this.boxWidth);
  this.background.setAttributeNS(null, 'height', this.boxHeight);
  this.background.setAttributeNS(null, 'fill', this.colorScheme['background']);
  this.svg.appendChild(this.background);
}

  // Return a string encoding the current entries in the whole grid and
  // also set the number of squares that have been filled.
Exolve.prototype.getGridStateAndNumFilled = function() {
  let state = '';
  let numFilled = 0
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      let gridCell = this.grid[i][j]
      if (gridCell.isLight || gridCell.isDiagramless) {
        if (this.langMaxCharCodes == 1) {
          state = state + gridCell.currLetter
        } else {
          state = state + gridCell.currLetter + '$'
        }
        if (gridCell.currLetter != '0') {
          numFilled++
        }
      } else {
        state = state + '.'
      }
    }
  }
  this.numCellsFilled = numFilled
  return state;
}

  // Update status, ensure answer fields are upper-case (when they have
  // an enum), disable buttons as needed, and return the state.
Exolve.prototype.updateDisplayAndGetState = function() {
  let state = this.getGridStateAndNumFilled();
  this.statusNumFilled.innerHTML = this.numCellsFilled
  let ci = this.clueOrParentIndex(this.currClueIndex)
  let revOrphan = this.isOrphanWithReveals(ci)
  this.checkButton.disabled = (this.activeCells.length == 0) && !revOrphan
  let theClue = this.clues[ci]
  let haveReveals = (this.activeCells.length > 0 && !this.hasUnsolvedCells) ||
      (theClue && (theClue.anno || theClue.solution || revOrphan));
  if (!haveReveals && this.szCellsToOrphan > 0 && this.activeCells.length > 0) {
    let orphanClue = this.cellsToOrphan[JSON.stringify(this.activeCells)];
    if (orphanClue) {
      let oc = this.clues[orphanClue]
      haveReveals =
        oc && (oc.anno || oc.solution || this.isOrphanWithReveals(orphanClue));
    }
  }
  this.revealButton.disabled = !haveReveals;
  this.clearButton.disabled = this.revealButton.disabled && this.activeCells.length == 0;
  return state
}

// Returns [start, non-inclusive-end] ([-1, -1] if not found).
Exolve.prototype.myStatePart = function(s) {
  const startMark = this.STATES_SEP + this.id
  const start = s.indexOf(startMark)
  if (start < 0) {
    return [-1, -1]
  }
  let end = s.indexOf(this.STATES_SEP, start + startMark.length)
  if (end < 0) {
    end = s.length
  }
  return [start, end]
}

// Call updateDisplayAndGetState() and save state in cookie and location.hash.
Exolve.prototype.updateAndSaveState = function() {
  let state = this.updateDisplayAndGetState()
  for (let a of this.answersList) {
    state = state + this.STATE_SEP + a.input.value
  }

  // Keep cookie for these many days
  const KEEP_FOR_DAYS = 90

  let d = new Date();
  d.setTime(d.getTime() + (KEEP_FOR_DAYS * 24 * 60 * 60 * 1000));
  let expires = 'expires=' + d.toUTCString();
  document.cookie = this.id + '=' + state +
                    '; samesite=none; secure; ' + expires + ';path=/';

  if (this.savingURL) {
    // Also save the state in location.hash.
    let lh = location.hash || '#'
    let myPart = this.myStatePart(lh)
    if (myPart[0] < 0) {
      lh = lh + this.STATES_SEP + this.id + state
    } else {
      lh = lh.substr(0, myPart[0]) +
           this.STATES_SEP + this.id + state +
           lh.substring(myPart[1])
    }
    location.hash = lh
    // Update savingURL.href for *all* puzzles
    for (let pid in exolvePuzzles) {
      let p = exolvePuzzles[pid]
      if (p.savingURL) {
        p.savingURL.href = location.href
      }
    }
  }
}

Exolve.prototype.resetState = function() {
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      let gridCell = this.grid[i][j]
      if (gridCell.isLight || gridCell.isDiagramless) {
        if (gridCell.prefill) {
          gridCell.currLetter = gridCell.solution
        } else {
          gridCell.currLetter = '0'
        }
        gridCell.textNode.nodeValue =
            this.stateToDisplayChar(gridCell.currLetter)
      }
    }
  }
}

// Returns true upon success.
Exolve.prototype.parseState = function(state) {
  let parsedState = []
  state = state.trim()
  if (!state) {
    return false
  }
  let index = 0
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      if (index >= state.length) {
        this.log('Not enough characters in saved state')
        return false
      }
      let letter = ''
      letter = state.charAt(index++)
      if (this.langMaxCharCodes > 1 && letter != '.') {
        let dollar = state.indexOf('$', index)
        if (dollar < 0) {
          this.log('Missing compound-char separator in saved state')
          return false
        }
        letter = letter + state.substring(index, dollar)
        index = dollar + 1
      }
      let gridCell = this.grid[i][j]
      if (gridCell.isLight || gridCell.isDiagramless) {
        if (gridCell.prefill) {
          parsedState.push(gridCell.solution)
          continue
        }
        if (letter == '1') {
           if (!gridCell.isDiagramless) {
             this.log('Unexpected ⬛ in non-diagramless location');
             return false
           }
           parsedState.push('1')
        } else {
           if (!this.isValidStateChar(letter)) {
             this.log('Unexpected letter/digit ' + letter +
                         ' in state: ' + state);
             return false
           }
           parsedState.push(letter)
        }
      } else {
        if (letter != '.') {
          this.log('Unexpected letter ' + letter +
                      ' in state, expected .: ' + state);
          return false
        }
      }
    }
  }
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      let gridCell = this.grid[i][j]
      if (gridCell.isLight || gridCell.isDiagramless) {
        console.assert(parsedState.length > 0, parsedState)
        gridCell.currLetter = parsedState.shift();
        gridCell.textNode.nodeValue =
            this.stateToDisplayChar(gridCell.currLetter)
      }
    }
  }
  console.assert(parsedState.length == 0, parsedState)

  // Also try to recover answers to questions and orphan-fills.
  if (state.substr(index, this.STATE_SEP.length) == this.STATE_SEP) {
    let parts = state.substr(index + this.STATE_SEP.length).split(this.STATE_SEP)
    if (parts.length == this.answersList.length) {
      for (let i = 0; i < parts.length; i++) {
        this.answersList[i].input.value = parts[i]
      }
    }
  }
  return true
}

// Restore state from cookie (or location.hash).
Exolve.prototype.restoreState = function() {
  this.resetState();
  let foundState = false

  let name = this.id + '=';
  let ca = decodeURIComponent(document.cookie).split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) == 0) {
      foundState = this.parseState(c.substring(name.length, c.length));
      if (foundState) {
        this.log('Found saved state in cookie')
      }
      break
    }
  }
  if (!foundState) {
    try {
      let lh = decodeURIComponent(location.hash.substr(1))
      let myPart = this.myStatePart(lh)
      if (myPart[0] >= 0) {
        foundState = this.parseState(lh.substring(
            myPart[0] + this.STATES_SEP.length + this.id.length, myPart[1]))
        if (foundState) {
          this.log('Found saved state in url')
        }
      }
    } catch (e) {
      foundState = false
    }
  }
  if (!foundState) {
    this.log('No saved state available')
  }
  if (this.index == 0 && this.savingURL) {
    location.hash = ''  // Clear, including any legacy-format state
  }
  for (let ci of this.allClueIndices) {
    // When restoring state, we reveal annos for fully prefilled entries.
    this.updateClueState(ci, true, null)
  }
  this.updateAndSaveState()
}

Exolve.prototype.deactivateCurrCell = function() {
  this.gridInputWrapper.style.display = 'none'
  for (let x of this.activeCells) {
    let gridCell = this.grid[x[0]][x[1]]
    let cellRect = gridCell.cellRect
    if (gridCell.colour) {
      cellRect.style.fill = gridCell.colour
    } else {
      cellRect.style.fill = this.colorScheme['cell']
    }
    if (!gridCell.prefill) {
      gridCell.cellText.style.fill = this.colorScheme['light-text']
    }
    if (gridCell.cellNum) {
      gridCell.cellNum.style.fill = this.colorScheme['light-label']
    }
    if (gridCell.cellCircle) {
      gridCell.cellCircle.style.stroke = this.colorScheme['circle']
    }
  }
  this.activeCells = [];
}

// Utils --------------------
Exolve.prototype.currCellIsValid = function() {
  if (this.currRow < 0 || this.currRow >= this.gridHeight ||
      this.currCol < 0 || this.currCol >= this.gridWidth) {
    return false;
  }
  return true
}
Exolve.prototype.currCell = function() {
  if (!this.currCellIsValid()) {
    return null;
  }
  return this.grid[this.currRow][this.currCol]
}
Exolve.prototype.atCurr = function(row, col) {
  return row == this.currRow && col == this.currCol
}
Exolve.prototype.symCell = function(row, col) {
  return this.grid[this.gridHeight - 1 - row][this.gridWidth - 1 - col]
}
Exolve.prototype.cellLeftPos = function(col, offset) {
  return this.offsetLeft + offset + col * (this.squareDim + this.GRIDLINE);
}
Exolve.prototype.cellTopPos = function(row, offset) {
  return this.offsetTop + offset + row * (this.squareDim + this.GRIDLINE);
}
Exolve.prototype.clueOrParentIndex = function(ci) {
  if (ci && this.clues[ci] && this.clues[ci].parentClueIndex) {
    return this.clues[ci].parentClueIndex
  }
  return ci
}
// ------------------------

Exolve.prototype.deactivateCurrClue = function() {
  for (let x of this.activeClues) {
    x.style.background = 'inherit'
  }
  this.activeClues = [];
  this.currClueIndex = null
  this.currClue.innerHTML = ''
  this.currClue.style.background = 'transparent'
  this.currClue.style.top = '0'
  this.clearButton.disabled = true
  this.checkButton.disabled = true
  this.revealButton.disabled = true
}

Exolve.prototype.makeCurrClueVisible = function() {
  // Check if grid input is visible.
  const inputPos = this.gridInput.getBoundingClientRect();
  if (inputPos.top < 0) {
    return
  }
  let windowH = this.getViewportHeight()
  if (!windowH || windowH <= 0) {
    return
  }
  const bPos = this.frame.getBoundingClientRect();
  const gpPos = this.gridPanel.getBoundingClientRect();
  const cluePos = this.currClue.getBoundingClientRect();
  const clueParentPos = this.currClueParent.getBoundingClientRect();

  this.currClue.style.left = (gpPos.left - bPos.left) + 'px';

  let normalTop = 0;
  const clearance = 4;
  if (gpPos.top - clueParentPos.top < cluePos.height + clearance) {
    normalTop = (gpPos.top - clueParentPos.top) - (cluePos.height + clearance);
  }

  if (inputPos.bottom >= windowH) {
    this.currClue.style.top = normalTop + 'px';
    return
  }
  // gridInput is visible
  const top = cluePos.top
  const parentTop = clueParentPos.top
  // Reposition
  let newTop = 0
  if (parentTop >= 0) {
    // Parent is below viewport top: use normal positioning.
    this.currClue.style.top = normalTop + 'px';
    return
  }
  let adjustment = cluePos.height + clearance - inputPos.top;
  if (adjustment < 0) {
    adjustment = 0;
  }
  this.currClue.style.top = (0 - parentTop - adjustment) + 'px';
}

Exolve.prototype.gnavToInner = function(cell, dir) {
  this.currRow = cell[0]
  this.currCol = cell[1]
  this.currDir = dir

  let gridCell = this.currCell()
  if (!gridCell || (!gridCell.isLight && !gridCell.isDiagramless)) {
    return null
  }

  this.gridInputWrapper.style.width = '' + this.squareDim + 'px'
  this.gridInputWrapper.style.height = '' + (this.squareDim - 2) + 'px'
  this.gridInputWrapper.style.left = '' + gridCell.cellLeft + 'px'
  this.gridInputWrapper.style.top = '' + gridCell.cellTop + 'px'
  this.gridInput.value = gridCell.prefill ? '' :
      this.stateToDisplayChar(gridCell.currLetter)
  this.gridInputRarr.style.display = 'none'
  this.gridInputDarr.style.display = 'none'
  this.gridInputWrapper.style.display = ''
  this.gridInput.focus()
  // Try to place the cursor at the end
  if (this.gridInput.setSelectionRange) {
    let len = this.gridInput.value.length
    this.gridInput.setSelectionRange(len, len);
  }

  let activeClueIndex = ''
  let activeClueLabel = ''
  // If the current direction does not have an active clue, toggle direction
  if (this.currDir == 'A' && !gridCell.isDiagramless &&
      !gridCell.acrossClueLabel &&
      !this.extendsDiagramlessA(this.currRow, this.currCol)) {
    this.toggleCurrDir()
  } else if (this.currDir == 'D' && !gridCell.isDiagramless &&
             !gridCell.downClueLabel &&
             !this.extendsDiagramlessD(this.currRow, this.currCol)) {
    this.toggleCurrDir()
  } else if (this.currDir.charAt(0) == 'X' &&
             (!gridCell.nodirClues ||
              !gridCell.nodirClues.includes(this.currDir))) {
    this.toggleCurrDir()
  }
  if (this.currDir == 'A') {
    if (gridCell.acrossClueLabel) {
      activeClueLabel = gridCell.acrossClueLabel
      activeClueIndex = 'A' + activeClueLabel
    }
    this.gridInputRarr.style.display = ''
  } else if (this.currDir == 'D') {
    if (gridCell.downClueLabel) {
      activeClueLabel = gridCell.downClueLabel
      activeClueIndex = 'D' + activeClueLabel
    }
    this.gridInputDarr.style.display = ''
  } else {
    // currDir is actually a clueindex (for an X clue)
    activeClueIndex = this.currDir
    activeClueLabel = this.currDir.substr(1)
  }
  if (activeClueIndex != '') {
    if (!this.clues[activeClueIndex]) {
      activeClueIndex = ''
      if (this.offNumClueIndices[activeClueLabel]) {
        for (let ci of this.offNumClueIndices[activeClueLabel]) {
          if (ci.charAt(0) == 'X' ||
              ci.charAt(0) == activeClueIndex.charAt(0)) {
            activeClueIndex = ci
            break
          }
        }
      }
      if (!this.clues[activeClueIndex]) {
        activeClueIndex = ''
      }
    }
  }
  this.clearButton.disabled = false
  this.checkButton.disabled = false
  this.revealButton.disabled = this.hasUnsolvedCells

  if (activeClueIndex && this.clues[activeClueIndex]) {
    let clueIndices = this.getLinkedClues(activeClueIndex)
    let parentIndex = clueIndices[0]
    for (let clueIndex of clueIndices) {
      for (let rowcol of this.clues[clueIndex].cells) {
        this.grid[rowcol[0]][rowcol[1]].cellRect.style.fill =
            this.colorScheme['active']
        this.activeCells.push(rowcol)
      }
    }
  } else {
    // No active clue, activate the last orphan clue.
    this.activeCells.push([this.currRow, this.currCol])
    activeClueIndex = this.lastOrphan
  }
  gridCell.cellRect.style.fill = this.colorScheme['input']
  if (!gridCell.prefill) {
    gridCell.cellText.style.fill = this.colorScheme['light-text-input']
  }
  if (gridCell.cellNum) {
    gridCell.cellNum.style.fill = this.colorScheme['light-label-input']
  }
  if (gridCell.cellCircle) {
    gridCell.cellCircle.style.stroke = this.colorScheme['circle-input']
  }
  return activeClueIndex
}

Exolve.prototype.activateCell = function(row, col) {
  this.deactivateCurrCell();
  let clue = this.gnavToInner([row, col], this.currDir)
  if (clue) {
    this.deactivateCurrClue();
    this.cnavToInner(clue)
  }
  this.updateAndSaveState()
}

Exolve.prototype.cellActivator = function(row, col) {
  this.usingGnav = true
  this.activateCell(row, col);
}
Exolve.prototype.clueActivator = function(ci) {
  this.usingGnav = false
  this.cnavTo(ci);
}

Exolve.prototype.getViewportHeight = function() {
  return window.innerHeight && document.documentElement.clientHeight ?
      Math.min(window.innerHeight, document.documentElement.clientHeight) :
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.getElementsByTagName('body')[0].clientHeight;
}

Exolve.prototype.getViewportWidth = function() {
  return window.innerWidth && document.documentElement.clientWidth ?
      Math.min(window.innerWidth, document.documentElement.clientWidth) :
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.getElementsByTagName('body')[0].clientWidth;
}

// Check if an element is visible, vertically.
Exolve.prototype.isVisible = function(elt) {
  const pos = elt.getBoundingClientRect();
  if (pos.bottom < 0) {
    return false
  }
  let windowH = this.getViewportHeight()
  if (!windowH || windowH <= 0) {
    return false
  }
  if (pos.top >= windowH) {
    return false
  }
  return true
}

// Given a clue index, return a list containing all the linked clues.
// The first entry in the list is the parent clue.
Exolve.prototype.getLinkedClues = function(clueIndex) {
  let clueIndices = [clueIndex]
  if (this.clues[clueIndex]) {
    if (this.clues[clueIndex].parentClueIndex) {
      let parent = this.clues[clueIndex].parentClueIndex
      clueIndices = [parent].concat(this.clues[parent].childrenClueIndices)
    } else if (this.clues[clueIndex].childrenClueIndices) {
      clueIndices =
          clueIndices.concat(this.clues[clueIndex].childrenClueIndices)
    }
  }
  return clueIndices
}

// Get HTML for back/forth buttons in current clue.
Exolve.prototype.getCurrClueButtons = function() {
  return `<span>
      <button id="${this.prefix}-curr-clue-prev" class="xlv-small-button"
      title="Previous clue">&lsaquo;</button>&nbsp;
      <button id="${this.prefix}-curr-clue-next" class="xlv-small-button"
      title="next clue">&rsaquo;</button></span>`;
}

Exolve.prototype.cnavNext = function() {
  if (!this.currClueIndex || !this.clues[this.currClueIndex] ||
      !this.clues[this.currClueIndex].next) {
    return
  }
  let next = this.clues[this.currClueIndex].next
  if (this.gnavIsClueless()) {
    let jumps = 0
    while (jumps < this.allClueIndices.length && !this.isOrphan(next)) {
      jumps++
      next = this.clues[next].next
    }
  }
  this.cnavTo(next)
  if (this.usingGnav) {
    this.gridInput.focus()
  }
}
Exolve.prototype.cnavPrev = function() {
  if (!this.currClueIndex || !this.clues[this.currClueIndex] ||
      !this.clues[this.currClueIndex].prev) {
    return
  }
  let prev = this.clues[this.currClueIndex].prev
  if (this.gnavIsClueless()) {
    let jumps = 0
    while (jumps < this.allClueIndices.length && !this.isOrphan(prev)) {
      jumps++
      prev = this.clues[prev].prev
    }
  }
  this.cnavTo(prev)
  if (this.usingGnav) {
    this.gridInput.focus()
  }
}

// Select a clicked clue.
Exolve.prototype.cnavToInner = function(activeClueIndex, grabFocus = false) {
  let clueIndices = this.getLinkedClues(activeClueIndex)
  let parentIndex = clueIndices[0]
  let gnav = null
  let clueAtActive = this.clues[activeClueIndex]
  if (clueAtActive && clueAtActive.cells.length > 0) {
    let dir = (activeClueIndex.charAt(0) == 'X') ? activeClueIndex :
              activeClueIndex.charAt(0)
    gnav = [clueAtActive.cells[0][0], clueAtActive.cells[0][1], dir]
  }
  let curr = this.clues[parentIndex]
  if (!curr || !curr.clue) {
    activeClueIndex = this.lastOrphan
    parentIndex = this.lastOrphan
    curr = this.clues[parentIndex]
    if (!curr || !curr.clue) {
      return null
    }
    clueIndices = this.getLinkedClues(parentIndex)
  }
  let orphan = this.isOrphan(parentIndex)
  if (orphan) {
    this.lastOrphan = parentIndex
  }
  let colour = orphan ? this.colorScheme['orphan'] : this.colorScheme['active'];
  for (let clueIndex of clueIndices) {
    let theClue = this.clues[clueIndex]
    if (theClue.anno || (orphan && theClue.cellsOfOrphan)) {
      this.revealButton.disabled = false
    }
    if (!theClue.clueTR) {
      continue
    }
    theClue.clueTR.style.background = colour
    if (grabFocus && this.cluesPanelLines > 0 &&
        this.isVisible(theClue.clueTR.parentElement)) {
      theClue.clueTR.scrollIntoView()
      this.gridInput.scrollIntoView()  // Else we may move away from the cell!
    }
    this.activeClues.push(theClue.clueTR)
  }
  this.currClueIndex = activeClueIndex
  this.currClue.innerHTML = this.getCurrClueButtons() +
    curr.fullDisplayLabel + curr.clue
  document.getElementById(this.prefix + '-curr-clue-prev').addEventListener(
      'click', this.cnavPrev.bind(this))
  document.getElementById(this.prefix + '-curr-clue-next').addEventListener(
      'click', this.cnavNext.bind(this))
  let currLab = document.getElementById(this.prefix + '-curr-clue-label')
  if (currLab.parentElement.classList.contains('xlv-clickable')) {
    currLab.addEventListener(
        'click', this.toggleClueSolvedState.bind(this, this.currClueIndex))
  }
  if (orphan) {
    let placeholder = ''
    let len = this.DEFAULT_ORPHAN_LEN
    if (this.clues[parentIndex].placeholder) {
      placeholder = this.clues[parentIndex].placeholder
      len = placeholder.length
    }
    this.addOrphanUI(this.currClue, true, len, placeholder, parentIndex)
    this.copyOrphanEntryToCurr(parentIndex)
    if (grabFocus && !this.usingGnav && this.clues[parentIndex].clueTR) {
      let plIns = this.clues[parentIndex].clueTR.getElementsByTagName('input')
      if (plIns && plIns.length > 0) {
        plIns[0].focus()
      }
    }
  }
  this.currClue.style.background = colour
  this.updateClueState(parentIndex, false, null)
  this.makeCurrClueVisible();
  return gnav
}

// The current gnav position is diagramless or does not have a known
// clue in the current direction.
Exolve.prototype.gnavIsClueless = function() {
  let gridCell = this.currCell()
  if (!gridCell) {
    return false
  }
  return (gridCell.isDiagramless ||
     (this.currDir == 'A' &&
      (!gridCell.acrossClueLabel ||
       !this.clues['A' + gridCell.acrossClueLabel] ||
       !this.clues['A' + gridCell.acrossClueLabel].clue)) ||
     (this.currDir == 'D' &&
      (!gridCell.downClueLabel ||
       !this.clues['D' + gridCell.downClueLabel] ||
       !this.clues['D' + gridCell.downClueLabel].clue)) ||
     (this.currDir.charAt(0) == 'X' &&
      (!gridCell.nodirClues ||
       !gridCell.nodirClues.includes(this.currDir))));
}

Exolve.prototype.cnavTo = function(activeClueIndex) {
  this.deactivateCurrClue();
  let cellDir = this.cnavToInner(activeClueIndex, true)
  if (cellDir) {
    this.deactivateCurrCell();
    this.gnavToInner([cellDir[0], cellDir[1]], cellDir[2])
  } else {
    // If the currently active cells had a known clue association, deactivate.
    if (!this.gnavIsClueless()) {
      this.deactivateCurrCell();
    }
  }
  this.updateAndSaveState()
}

Exolve.prototype.copyOrphanEntry = function(clueIndex) {
  if (this.hideCopyPlaceholders || this.activeCells.length < 1 ||
      !clueIndex || !this.clues[clueIndex] || !this.clues[clueIndex].clueTR) {
    return
  }
  let ips = this.clues[clueIndex].clueTR.getElementsByTagName('input')
  if (ips.length != 1) {
    return
  }
  let entry = ips[0].value
  let letters = ''
  for (let i = 0; i < entry.length; i++) {
    let letter = entry[i]
    if (!this.caseCheck(letter)) {
      if (!this.allowDigits || letter < '0' || letter > '9') {
        continue;
      }
    }
    letters = letters + letter
  }
  if (letters.length < 1) {
    return
  }
  if (letters.length != this.activeCells.length) {
    if (!confirm('Are you sure you want to partially copy from ' +
                  letters.length + ' letters into ' + this.activeCells.length +
                  ' squares?')) {
      return
    }
  }
  let index = 0
  let row = -1
  let col = -1
  for (let i = 0; i < letters.length; i++) {
    if (index >= this.activeCells.length) {
      break;
    }
    let x = this.activeCells[index++]
    row = x[0]
    col = x[1]
    let gridCell = this.grid[row][col]
    if (gridCell.prefill) {
      continue
    }
    let letter = letters[i]
    let oldLetter = gridCell.currLetter
    if (oldLetter != letter) {
      gridCell.currLetter = letter
      let revealedChar = this.stateToDisplayChar(letter)
      gridCell.textNode.nodeValue = revealedChar
      if (this.atCurr(row, col)) {
        this.gridInput.value = revealedChar
      }
    }
  }
  if (index < this.activeCells.length) {
    // Advance to the next square.
    let x = this.activeCells[index]
    row = x[0]
    col = x[1]
  }
  if (row >= 0 && col >= 0) {
    this.activateCell(row, col)
  }
  this.updateActiveCluesState()
  this.updateAndSaveState()
}

// inCurr is set to true when this is called oninput in the currClue strip
// and false when called oninput in the clues table.
Exolve.prototype.updateOrphanEntry = function(clueIndex, inCurr) {
  if (!clueIndex || !this.clues[clueIndex] || !this.clues[clueIndex].clueTR ||
      !this.isOrphan(clueIndex) || this.clues[clueIndex].parentClueIndex) {
    return
  }
  let clueInputs = this.clues[clueIndex].clueTR.getElementsByTagName('input')
  if (clueInputs.length != 1) {
    this.log('Missing placeholder input for clue ' + clueIndex)
    return
  }
  let theInput = clueInputs[0]
  if (!inCurr) {
    let cursor = theInput.selectionStart
    theInput.value = theInput.value.toUpperCase().trimLeft()
    theInput.selectionEnd = cursor
    this.updateAndSaveState()
  }
  let curr = document.getElementById(this.CURR_ORPHAN_ID)
  if (!curr) {
    return
  }
  let currInputs = curr.getElementsByTagName('input')
  if (currInputs.length != 1) {
    return
  }
  let theCurrInput = currInputs[0]
  if (inCurr) {
    let cursor = theCurrInput.selectionStart
    theCurrInput.value = theCurrInput.value.toUpperCase().trimLeft()
    theCurrInput.selectionEnd = cursor
    theInput.value = theCurrInput.value
    this.updateAndSaveState()
  } else {
    theCurrInput.value = theInput.value
  }
}

// Copy placeholder value from clue table to the newly created curr clue.
Exolve.prototype.copyOrphanEntryToCurr = function(clueIndex) {
  if (!clueIndex || !this.clues[clueIndex] || !this.clues[clueIndex].clueTR ||
      !this.isOrphan(clueIndex) || this.clues[clueIndex].parentClueIndex) {
    return
  }
  let clueInputs = this.clues[clueIndex].clueTR.getElementsByTagName('input')
  if (clueInputs.length != 1) {
    this.log('Missing placeholder input for clue ' + clueIndex)
    return
  }
  let curr = document.getElementById(this.CURR_ORPHAN_ID)
  if (!curr) {
    return
  }
  let currInputs = curr.getElementsByTagName('input')
  if (clueInputs.length != 1) {
    return
  }
  currInputs[0].value = clueInputs[0].value
}

Exolve.prototype.orphanCopier = function(clueIndex, e) {
  this.copyOrphanEntry(clueIndex)
  e.stopPropagation()
}

Exolve.prototype.addOrphanUI =
    function(elt, inCurr, len, placeholder, clueIndex) {
  let html = '<span'
  if (inCurr) {
    html = html + ' id="' + this.CURR_ORPHAN_ID + '"'
  }
  html = html + ' class="xlv-nobr">' +
    '<input size="' + len + '" class="xlv-incluefill" placeholder="' +
    placeholder.replace(/\?/g, '·') +
    '" type="text" ' +
    'title="You can record your solution here before copying to squares" ' +
    'autocomplete="off" spellcheck="off"></input>'
  if (!this.hideCopyPlaceholders) {
    html = html + '<button title="Copy into currently highlighted squares" ' +
      'class="xlv-small-button">&#8690;</button>'
  }
  html = html + '</span>'
  elt.insertAdjacentHTML('beforeend', html)
  let incluefill = elt.lastElementChild.firstElementChild
  incluefill.style.color = this.colorScheme['imp-text']
  incluefill.addEventListener(
      'input', this.updateOrphanEntry.bind(this, clueIndex, inCurr))
  if (!this.hideCopyPlaceholders) {
    elt.lastElementChild.lastElementChild.addEventListener(
      'click', this.orphanCopier.bind(this, clueIndex))
  }
}

Exolve.prototype.toggleCurrDir = function() {
  // toggle direction
  let gridCell = this.currCell()
  if (!gridCell) {
    return
  }
  let choices = []
  if (gridCell.acrossClueLabel || gridCell.succA || gridCell.predA) {
    choices.push('A')
  }
  if (gridCell.downClueLabel || gridCell.succD || gridCell.predD) {
    choices.push('D')
  }
  if (gridCell.nodirClues) {
    choices = choices.concat(gridCell.nodirClues)
  }
  if (choices.length < 1) {
    return
  }
  let i = 0
  while (i < choices.length && this.currDir != choices[i]) {
    i++;
  }
  if (i >= choices.length) {
    i = -1
  }
  let newDir = choices[(i + 1) % choices.length]
  if (this.currDir == newDir) {
    return
  }
  this.currDir = newDir
}

Exolve.prototype.toggleCurrDirAndActivate = function() {
  this.usingGnav = true
  this.toggleCurrDir()
  this.activateCell(this.currRow, this.currCol)
}

// Handle navigation keys. Used by a listener, and also used to auto-advance
// after a cell is filled. Returns false only if a tab input was actually used.
Exolve.prototype.handleKeyUpInner = function(key) {
  if (key == 9) {
    return false;  // tab is handled on key-down already, as 221/219.
  }
  if (key == 221) {
    // ] or tab
    if (this.usingGnav) {
      let gridCell = this.currCell()
      if (!gridCell || !this.currDir) {
        return false
      }
      let gnav = gridCell['next' + this.currDir]
      if (!gnav) {
        return false
      }
      this.currDir = gnav.dir
      this.activateCell(gnav.cell[0], gnav.cell[1])
    } else {
      if (!this.currClueIndex || !this.clues[this.currClueIndex] ||
          !this.clues[this.currClueIndex].next) {
        return false
      }
      this.cnavTo(this.clues[this.currClueIndex].next)
    }
    return true
  } else if (key == 219) {
    // [ or shift-tab
    if (this.usingGnav) {
      let gridCell = this.currCell()
      if (!gridCell || !this.currDir) {
        return false
      }
      let gnav = gridCell['prev' + this.currDir]
      if (!gnav) {
        return false
      }
      this.currDir = gnav.dir
      this.activateCell(gnav.cell[0], gnav.cell[1])
    } else {
      if (!this.currClueIndex || !this.clues[this.currClueIndex] ||
          !this.clues[this.currClueIndex].prev) {
        return false
      }
      this.cnavTo(this.clues[this.currClueIndex].prev)
    }
    return true
  }
  if (!this.currCellIsValid()) {
    return false
  }

  this.usingGnav = true
  if (key == 8) {
    let gridCell = this.currCell()
    if (gridCell.currLetter != '0' && !gridCell.prefill) {
      return true
    }
    // backspace in an empty or prefilled cell
    this.retreatCursorInLight();
    return true
  }
  if (key == 13) {
    // Enter
    this.toggleCurrDirAndActivate()
  } else if (key == 39) {
    // right arrow
    let col = this.currCol + 1
    while (col < this.gridWidth &&
           !this.grid[this.currRow][col].isLight &&
           !this.grid[this.currRow][col].isDiagramless) {
      col++;
    }
    if (col < this.gridWidth) {
      this.activateCell(this.currRow, col);
    }
  } else if (key == 37) {
    // left arrow
    let col = this.currCol - 1
    while (col >= 0 &&
           !this.grid[this.currRow][col].isLight &&
           !this.grid[this.currRow][col].isDiagramless) {
      col--;
    }
    if (col >= 0) {
      this.activateCell(this.currRow, col);
    }
  } else if (key == 40) {
    // down arrow
    let row = this.currRow + 1
    while (row < this.gridHeight &&
           !this.grid[row][this.currCol].isLight &&
           !this.grid[row][this.currCol].isDiagramless) {
      row++;
    }
    if (row < this.gridHeight) {
      this.activateCell(row, this.currCol);
    }
  } else if (key == 38) {
    // up arrow
    let row = this.currRow - 1
    while (row >= 0 &&
           !this.grid[row][this.currCol].isLight &&
           !this.grid[row][this.currCol].isDiagramless) {
      row--;
    }
    if (row >= 0) {
      this.activateCell(row, this.currCol);
    }
  }
  return true
}

Exolve.prototype.handleKeyUp = function(e) {
  let key = e.which || e.keyCode
  this.handleKeyUpInner(key)
}

  // For tab/shift-tab, we intercept KeyDown
Exolve.prototype.handleTabKeyDown = function(e) {
  let key = e.which || e.keyCode
  if (key == 9) {
    // tab. replace with [ or ]
    key = e.shiftKey ? 219 : 221
    if (this.handleKeyUpInner(key)) {
      // Tab input got used already.
      e.preventDefault()
    }
  }
}

Exolve.prototype.advanceCursor = function() {
  let gridCell = this.currCell()
  if (!gridCell) {
    return
  }
  // First check if there is successor
  let successorProperty = 'succ' + this.currDir
  if (gridCell[successorProperty]) {
    let successor = gridCell[successorProperty]
    this.currDir = successor.dir
    this.activateCell(successor.cell[0], successor.cell[1]);
    return
  }
  if (gridCell.isDiagramless) {
    return
  }
  if (this.currDir == 'A') {
    if (this.currCol + 1 < this.gridWidth &&
        this.grid[this.currRow][this.currCol + 1].acrossClueLabel ==
            gridCell.acrossClueLabel) {
      this.handleKeyUpInner(39);
    }
  } else if (this.currDir == 'D') {
    if (this.currRow + 1 < this.gridHeight &&
        this.grid[this.currRow + 1][this.currCol].downClueLabel ==
            gridCell.downClueLabel) {
      this.handleKeyUpInner(40);
    }
  }
}

Exolve.prototype.retreatCursorInLight = function() {
  let gridCell = this.currCell()
  if (!gridCell) {
    return
  }
  if (this.currDir == 'A' && this.currCol - 1 >= 0 &&
      this.grid[this.currRow][this.currCol - 1].acrossClueLabel ==
        gridCell.acrossClueLabel) {
    this.activateCell(this.currRow, this.currCol - 1);
    return
  } else if (this.currDir == 'D' && this.currRow - 1 >= 0 &&
             this.grid[this.currRow - 1][this.currCol].downClueLabel ==
               gridCell.downClueLabel) {
    this.activateCell(this.currRow - 1, this.currCol);
    return
  }
  let predProperty = 'pred' + this.currDir
  let pred = gridCell[predProperty]
  if (!pred) {
    return
  }
  this.currDir = pred.dir
  this.activateCell(pred.cell[0], pred.cell[1]);
}

Exolve.prototype.toggleClueSolvedState = function(clueIndex) {
  if (this.allCellsKnown(clueIndex)) {
    this.log('toggleClueSolvedState() called on ' + clueIndex +
                ' with all cells known')
      return
  }
  let clue = this.clues[clueIndex]
  if (!clue || !clue.clueTR) {
    return
  }
  let cls = clue.clueTR.className
  let currLab = null
  if (clueIndex == this.currClueIndex) {
    currLab = document.getElementById(this.prefix + '-curr-clue-label')
  }
  if (cls == 'xlv-solved') {
    clue.clueTR.className = ''
    if (currLab) {
      currLab.className = 'xlv-curr-clue-label'
    }
  } else {
    clue.clueTR.className = 'xlv-solved'
    if (currLab) {
      currLab.className = 'xlv-curr-clue-label xlv-solved'
    }
  }
}

Exolve.prototype.clueStateToggler = function(ci, e) {
  this.toggleClueSolvedState(ci)
  e.stopPropagation()
}

// Mark the clue as solved by setting its number's colour, if filled.
// If annoPrefilled is true and the clue is fully prefilled, reveal its anno.
// forceSolved can be passed as null or 'solved' or 'unsolved'.
Exolve.prototype.updateClueState =
    function(clueIndex, annoPrefilled, forceSolved) {
  let cis = this.getLinkedClues(clueIndex)
  if (!cis || cis.length == 0) {
    return
  }
  clueIndex = cis[0]  // Use parent for a linked child
  let clue = this.clues[clueIndex]
  if (!clue) {
    return
  }
  let solved = false
  if (clue && clue.clueTR && clue.clueTR.className == 'xlv-solved') {
    solved = true
  }
  let numFilled = 0
  let numPrefilled = 0
  for (let ci of cis) {
    let theClue = this.clues[ci]
    if (!theClue.clueTR) {
      numFilled = 0
      break
    }
    let isFullRet = this.isFull(ci)
    if (!isFullRet[0]) {
      numFilled = 0
      break
    }
    numFilled += isFullRet[1]
    if (isFullRet[0] == 2) {
      numPrefilled += isFullRet[1]
    }
  }
  if (forceSolved) {
    if (forceSolved == 'solved') {
      solved = true
    } else {
      solved = false
      // override for all-prefilled
      if (this.allCellsKnown(clueIndex) && numPrefilled == clue.enumLen) {
        solved = true
      }
    }
  } else if (clue.annoSpan && clue.annoSpan.style.display == '') {
    solved = true
  } else if (this.allCellsKnown(clueIndex)) {
    solved = numFilled == clue.enumLen
  }
  if (solved && numFilled == numPrefilled && annoPrefilled &&
      (clue.annoSpan || clue.solution)) {
    this.revealClueAnno(clueIndex);
  }
  let cls = solved ? 'xlv-solved' : ''
  for (let ci of cis) {
    if (this.clues[ci].clueTR) {
      this.clues[ci].clueTR.setAttributeNS(null, 'class', cls);
    }
    if (ci == this.currClueIndex) {
      let currLab = document.getElementById(this.prefix + '-curr-clue-label')
      if (currLab) {
        currLab.setAttributeNS(null, 'class', 'xlv-curr-clue-label' + (cls ? (' ' + cls) : ''));
      }
    }
  }
}

// Call updateClueState() on all clues active or crossing active cells.
Exolve.prototype.updateActiveCluesState = function() {
  let clueIndices = {}
  if (this.currClueIndex) {
    let lci = this.getLinkedClues(this.currClueIndex)
    for (let ci of lci) {
      clueIndices[ci] = true
    }
  }
  for (let x of this.activeCells) {
    let gridCell = this.grid[x[0]][x[1]]
    if (gridCell.acrossClueLabel) {
      let ci = 'A' + gridCell.acrossClueLabel
      clueIndices[ci] = true
    }
    if (gridCell.downClueLabel) {
      let ci = 'D' + gridCell.downClueLabel
      clueIndices[ci] = true
    }
    if (gridCell.nodirClues) {
      for (let ci of gridCell.nodirClues) {
        clueIndices[ci] = true
      }
    }
  }
  for (let ci in clueIndices) {
    this.updateClueState(ci, false, null)
  }
}

Exolve.prototype.handleGridInput = function() {
  this.usingGnav = true
  let gridCell = this.currCell()
  if (!gridCell) {
    return
  }
  if (!gridCell.isLight && !gridCell.isDiagramless) {
    return;
  }
  if (gridCell.prefill) {
    // Changes disallowed
    this.gridInput.value = ''
    this.advanceCursor()
    return
  }
  let newInput = this.gridInput.value
  let currDisplayChar = this.stateToDisplayChar(gridCell.currLetter)
  if (gridCell.currLetter != '0' &&
      newInput != currDisplayChar && this.langMaxCharCodes == 1) {
    // The "new" input may be before or after the old input.
    let index = newInput.indexOf(currDisplayChar)
    if (index == 0) {
      newInput = newInput.substr(1)
    }
  }
  let displayChar = newInput.substr(0, this.langMaxCharCodes)
  if (displayChar == ' ' && gridCell.isDiagramless) {
    // spacebar creates a blocked cell in a diagramless puzzle cell
    displayChar = this.BLOCK_CHAR
  } else {
    displayChar = displayChar.toUpperCase()
    if (!this.isValidDisplayChar(displayChar)) {
      displayChar = ''
    }
  }
  let stateChar = this.displayToStateChar(displayChar)
  let oldLetter = gridCell.currLetter
  gridCell.currLetter = stateChar
  gridCell.textNode.nodeValue = displayChar
  this.gridInput.value = displayChar
  if (oldLetter == '1' || stateChar == '1') {
    let gridCellSym = this.symCell(this.currRow, this.currCol)
    if (gridCellSym.isDiagramless) {
      let symLetter = (stateChar == '1') ? '1' : '0'
      let symChar = (stateChar == '1') ? this.BLOCK_CHAR : ''
      gridCellSym.currLetter = symLetter
      gridCellSym.textNode.nodeValue = symChar
    }
  }

  let cluesAffected = []
  let label = gridCell.acrossClueLabel
  if (label) {
    cluesAffected.push('A' + label)
  }
  label = gridCell.downClueLabel
  if (label) {
    cluesAffected.push('D' + label)
  }
  let otherClues = gridCell.nodirClues
  if (otherClues) {
    cluesAffected = cluesAffected.concat(otherClues)
  }
  for (ci of cluesAffected) {
    this.updateClueState(ci, false, null)
  }

  this.updateAndSaveState()

  if (this.isValidDisplayChar(displayChar) && this.langMaxCharCodes == 1) {
    this.advanceCursor()
  }
}

Exolve.prototype.deactivator = function() {
  this.deactivateCurrCell()
  this.deactivateCurrClue()
  this.usingGnav = false
}

Exolve.prototype.createListeners = function() {
  this.gridInput.addEventListener('keyup', this.handleKeyUp.bind(this));
  // Listen for tab/shift tab everywhere in the puzzle area.
  this.frame.addEventListener('keydown', this.handleTabKeyDown.bind(this));
  this.gridInput.addEventListener('input', this.handleGridInput.bind(this));
  this.gridInputWrapper.addEventListener('click', this.toggleCurrDirAndActivate.bind(this));
  let boundDeactivator = this.deactivator.bind(this)
  this.background.addEventListener('click', boundDeactivator);
  // Clicking on the title will also unselect current clue (useful
  // for barred grids where background is not visible).
  document.getElementById(this.prefix + '-title').addEventListener(
    'click', boundDeactivator);
  let boundClueVisiblizer = this.makeCurrClueVisible.bind(this)
  window.addEventListener('scroll', boundClueVisiblizer)
  window.addEventListener('resize', boundClueVisiblizer)
}

Exolve.prototype.displayGrid = function() {
  this.numCellsToFill = 0
  this.numCellsPrefilled = 0
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      let gridCell = this.grid[i][j]
      const cellGroup =
          document.createElementNS('http://www.w3.org/2000/svg', 'g');
      if (gridCell.isLight || gridCell.isDiagramless) {
        this.numCellsToFill++
        if (gridCell.prefill) {
          this.numCellsPrefilled++
        }
        const cellRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const cellLeft = this.cellLeftPos(j, this.GRIDLINE)
        const cellTop = this.cellTopPos(i, this.GRIDLINE)
        cellRect.setAttributeNS(null, 'x', cellLeft);
        cellRect.setAttributeNS(null, 'y', cellTop);
        cellRect.setAttributeNS(null, 'width', this.squareDim);
        cellRect.setAttributeNS(null, 'height', this.squareDim);
        cellRect.style.fill = this.colorScheme['cell']
        cellGroup.appendChild(cellRect)

        const cellText =
            document.createElementNS('http://www.w3.org/2000/svg', 'text');
        cellText.setAttributeNS(
            null, 'x', this.cellLeftPos(j, this.lightStartX));
        cellText.setAttributeNS(
            null, 'y', this.cellTopPos(i, this.lightStartY));
        cellText.setAttributeNS(null, 'text-anchor', 'middle');
        cellText.setAttributeNS(null, 'editable', 'simple');
        let letter = '0'
        let cellClass = 'xlv-cell-text'
        if (gridCell.prefill) {
          letter = gridCell.solution
          cellText.style.fill = this.colorScheme['prefill']
          cellClass = 'xlv-cell-text xlv-prefill'
        } else {
          cellText.style.fill = this.colorScheme['light-text']
        }
        cellText.style.fontSize = this.letterSize + 'px'
        cellText.setAttributeNS(null, 'class', cellClass)

        const text = document.createTextNode(letter);
        cellText.appendChild(text);
        cellGroup.appendChild(cellText)

        gridCell.currLetter = letter;
        gridCell.textNode = text;
        gridCell.cellText = cellText;
        gridCell.cellRect = cellRect;
        gridCell.cellLeft = cellLeft;
        gridCell.cellTop = cellTop;

        cellText.addEventListener('click', this.cellActivator.bind(this, i, j));
        cellRect.addEventListener('click', this.cellActivator.bind(this, i, j));
      }
      if (gridCell.hasCircle) {
        const cellCircle =
            document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        cellCircle.setAttributeNS(
            null, 'cx', this.cellLeftPos(j, this.circleR + this.GRIDLINE));
        cellCircle.setAttributeNS(
            null, 'cy', this.cellTopPos(i, this.circleR + this.GRIDLINE));
        cellCircle.setAttributeNS(null, 'class', 'xlv-cell-circle');
        cellCircle.style.stroke = this.colorScheme['circle']
        cellCircle.setAttributeNS(null, 'r', this.circleR);
        cellGroup.appendChild(cellCircle)
        cellCircle.addEventListener('click', this.cellActivator.bind(this, i, j));
        gridCell.cellCircle = cellCircle
      }
      if ((gridCell.startsClueLabel && !gridCell.isDiagramless &&
           !this.hideInferredNumbers) || gridCell.forcedClueLabel) {
        const cellNum =
            document.createElementNS('http://www.w3.org/2000/svg', 'text');
        cellNum.setAttributeNS(
            null, 'x', this.cellLeftPos(j, this.NUMBER_START_X));
        cellNum.setAttributeNS(
            null, 'y', this.cellTopPos(i, this.numberStartY));
        cellNum.setAttributeNS(null, 'class', 'xlv-cell-num');
        cellNum.style.fill = this.colorScheme['light-label']
        cellNum.style.fontSize = this.numberSize + 'px'
        const numText = gridCell.forcedClueLabel ?
            gridCell.forcedClueLabel : gridCell.startsClueLabel;
        const num = document.createTextNode(numText)
        cellNum.appendChild(num);
        cellGroup.appendChild(cellNum)
        gridCell.cellNum = cellNum
      }
      this.svg.appendChild(cellGroup);
    }
  }

  // Set colours specified through exolve-colour.
  for (let cellColour of this.cellColours) {
    if (cellColour.length == 2) {
      let ci = cellColour[0]
      if (!this.clues[ci]) {
        continue
      }
      let colour = cellColour[1]
      for (let cell of this.clues[ci].cells) {
        this.grid[cell[0]][cell[1]].colour = colour
        this.grid[cell[0]][cell[1]].cellRect.style.fill = colour
      }
    } else {
      let row = cellColour[0]
      let col = cellColour[1]
      if (!this.grid[row][col].cellRect) {
        continue
      }
      let colour = cellColour[2]
      this.grid[row][col].colour = colour
      this.grid[row][col].cellRect.style.fill = colour
    }
  }

  // Bars/word-ends to the right and under; hyphens.
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      let gridCell = this.grid[i][j]
      const cellGroup =
          document.createElementNS('http://www.w3.org/2000/svg', 'g');
      let emptyGroup = true
      if (gridCell.wordEndToRight && (j + 1) < this.gridWidth &&
          this.grid[i][j + 1].isLight) {
        const wordEndRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        wordEndRect.setAttributeNS(
            null, 'x',
            this.cellLeftPos(j + 1, this.GRIDLINE - this.SEP_WIDTH_BY2));
        wordEndRect.setAttributeNS(
            null, 'y', this.cellTopPos(i, this.GRIDLINE));
        wordEndRect.setAttributeNS(null, 'width', this.SEP_WIDTH);
        wordEndRect.setAttributeNS(null, 'height', this.squareDim);
        wordEndRect.style.fill = this.colorScheme['separator']
        cellGroup.appendChild(wordEndRect)
        emptyGroup = false
      }
      if (gridCell.wordEndBelow && (i + 1) < this.gridHeight &&
          this.grid[i + 1][j].isLight) {
        const wordEndRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        wordEndRect.setAttributeNS(
            null, 'x', this.cellLeftPos(j, this.GRIDLINE));
        wordEndRect.setAttributeNS(null, 'y',
            this.cellTopPos(i + 1, this.GRIDLINE - this.SEP_WIDTH_BY2));
        wordEndRect.setAttributeNS(null, 'width', this.squareDim);
        wordEndRect.setAttributeNS(null, 'height', this.SEP_WIDTH);
        wordEndRect.style.fill = this.colorScheme['separator']
        cellGroup.appendChild(wordEndRect)
        emptyGroup = false
      }
      if (gridCell.hyphenToRight) {
        const hyphenRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hyphenRect.setAttributeNS(null, 'x',
            this.cellLeftPos(j + 1, this.GRIDLINE - this.hyphenWBy2));
        hyphenRect.setAttributeNS(null, 'y', this.cellTopPos(
            i, this.GRIDLINE + this.squareDimBy2 - this.SEP_WIDTH_BY2));
        let hw = (j + 1) < this.gridWidth ? this.hyphenW : this.hyphenWBy2
        hyphenRect.setAttributeNS(null, 'width', hw);
        hyphenRect.setAttributeNS(null, 'height', this.SEP_WIDTH);
        hyphenRect.style.fill = this.colorScheme['separator']
        cellGroup.appendChild(hyphenRect)
        emptyGroup = false
      }
      if (gridCell.hyphenBelow) {
        const hyphenRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hyphenRect.setAttributeNS(null, 'x', this.cellLeftPos(
            j, this.GRIDLINE + this.squareDimBy2 - this.SEP_WIDTH_BY2));
        hyphenRect.setAttributeNS(
            null, 'y', this.cellTopPos(i + 1, this.GRIDLINE - this.hyphenWBy2));
        hyphenRect.setAttributeNS(null, 'width', this.SEP_WIDTH);
        let hh = (i + 1) < this.gridHeight ? this.hyphenW : this.hyphenWBy2
        hyphenRect.setAttributeNS(null, 'height', hh);
        hyphenRect.style.fill = this.colorScheme['separator']
        cellGroup.appendChild(hyphenRect)
        emptyGroup = false
      }
      if (gridCell.hasBarAfter) {
        const barRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        barRect.setAttributeNS(null, 'x',
            this.cellLeftPos(j + 1, this.GRIDLINE - this.BAR_WIDTH_BY2));
        barRect.setAttributeNS(null, 'y', this.cellTopPos(i, this.GRIDLINE));
        barRect.setAttributeNS(null, 'width', this.BAR_WIDTH);
        barRect.setAttributeNS(null, 'height', this.squareDim);
        barRect.setAttributeNS(null, 'fill', this.colorScheme['background']);
        cellGroup.appendChild(barRect)
        emptyGroup = false
      }
      if (gridCell.hasBarUnder) {
        const barRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        barRect.setAttributeNS(null, 'x', this.cellLeftPos(j, this.GRIDLINE));
        barRect.setAttributeNS(null, 'y',
            this.cellTopPos(i + 1, this.GRIDLINE - this.BAR_WIDTH_BY2));
        barRect.setAttributeNS(null, 'width', this.squareDim);
        barRect.setAttributeNS(null, 'height', this.BAR_WIDTH);
        barRect.setAttributeNS(null, 'fill', this.colorScheme['background']);
        cellGroup.appendChild(barRect)
        emptyGroup = false
      }
      if (!emptyGroup) {
        gridCell.miscGroup = cellGroup
        this.svg.appendChild(cellGroup);
      }
    }
  }
  this.statusNumTotal.innerHTML = this.numCellsToFill
}

Exolve.prototype.displayNinas = function() {
  const NINA_COLORS = [
    'rgba(0,0,255,0.2)',
    'rgba(0,255,0,0.2)',
    'rgba(0,255,255,0.2)',
    'rgba(255,0,255,0.2)',
    'rgba(255,255,0,0.2)',
    'rgba(255,50,50,0.2)',
    'rgba(50,255,50,0.2)',
    'rgba(50,50,255,0.2)',
    'rgba(50,200,200,0.2)',
    'rgba(200,50,200,0.2)',
    'rgba(200,200,50,0.2)',
  ];
  let ninaColorIndex = 0;
  for (let nina of this.ninas) {
    // First resolve clue indices to cells.
    let nina2 = []
    for (let cellOrOther of nina) {
      if (!Array.isArray(cellOrOther) && this.clues[cellOrOther]) {
        nina2 = nina2.concat(this.clues[cellOrOther].cells)
      } else {
        nina2.push(cellOrOther)
      }
    }
    for (let cellOrClass of nina2) {
      if (!Array.isArray(cellOrClass)) {
        // span-class-specified nina
        const elts = document.getElementsByClassName(cellOrClass)
        if (!elts || elts.length == 0) {
          this.throwErr('Nina ' + cellOrClass + ' is not a cell/clue ' +
                        'location nor a class with html tags');
        }
        for (let x = 0; x < elts.length; x++) {
          this.ninaClassElements.push({
            'element': elts[x],
            'colour':  NINA_COLORS[ninaColorIndex],
          });
        }
        continue
      }
      const row = cellOrClass[0]
      const col = cellOrClass[1]
      const ninaRect = document.createElement('div');
      ninaRect.style.left =  '' +  this.grid[row][col].cellLeft + 'px';
      ninaRect.style.top = '' + this.grid[row][col].cellTop + 'px';
      ninaRect.style.width = '' + this.squareDim + 'px';
      ninaRect.style.height = '' + this.squareDim + 'px';
      ninaRect.style.backgroundColor = NINA_COLORS[ninaColorIndex]
      ninaRect.setAttributeNS(null, 'class', 'xlv-nina');
      ninaRect.addEventListener(
          'click', this.cellActivator.bind(this, row, col));
      this.ninaGroup.appendChild(ninaRect);
    }
    ninaColorIndex = (ninaColorIndex + 1) % NINA_COLORS.length
  }
}

Exolve.prototype.showNinas = function() {
  for (const ec of this.ninaClassElements) {
    ec.element.style.backgroundColor = ec.colour;
  }
  this.ninaGroup.style.display = '';
  this.ninasButton.innerHTML = 'Hide ninas'
  this.showingNinas = true
}

Exolve.prototype.hideNinas = function() {
  for (const ec of this.ninaClassElements) {
    ec.element.style.backgroundColor = 'transparent';
  }
  this.ninaGroup.style.display = 'none';
  this.ninasButton.innerHTML = 'Show ninas'
  this.showingNinas = false
}

Exolve.prototype.toggleNinas = function() {
  if (this.showingNinas) {
    this.hideNinas()
  } else {
    if (!confirm('Are you sure you want to reveal the nina(s)!?')) {
      return
    }
    this.showNinas()
  }
}

Exolve.prototype.clearCell = function(row, col) {
  let gridCell = this.grid[row][col]
  let oldLetter = gridCell.currLetter
  if (oldLetter != '0') {
    gridCell.currLetter = '0'
    gridCell.textNode.nodeValue = ''
    if (this.atCurr(row, col)) {
      this.gridInput.value = ''
    }
  }
  if (oldLetter == '1') {
    let gridSymCell = this.symCell(row, col)
    if (gridSymCell.isDiagramless) {
      gridSymCell.currLetter = '0'
      gridSymCell.textNode.nodeValue = ''
    }
  }
}

// Returns a pair of numbers. The first number is  0 if not full, 1 if full,
// 2 if full entirely with prefills. The second number is the number of
// full cells.
Exolve.prototype.isFull = function(clueIndex) {
  let theClue = this.clues[clueIndex]
  if (!theClue) {
    return [0, 0];
  }
  let cells = theClue.cells
  if (cells.length < 1) {
    cells = theClue.cellsOfOrphan
    if (!cells || cells.length < 1) {
      return [0, 0];
    }
  }
  let numPrefills = 0;
  for (let x of cells) {
    let gridCell = this.grid[x[0]][x[1]]
    if (gridCell.prefill) {
      numPrefills++;
      continue
    }
    if (gridCell.currLetter == '0') {
      return [0, 0];
    }
  }
  return (numPrefills == cells.length) ? [2, cells.length] : [1, cells.length];
}

Exolve.prototype.clearCurr = function() {
  let clueIndices = []
  if (this.currClueIndex) {
    clueIndices = this.getLinkedClues(this.currClueIndex)
    for (let clueIndex of clueIndices) {
      if (this.clues[clueIndex].annoSpan) {
        this.clues[clueIndex].annoSpan.style.display = 'none'
      }
    }
    if (this.isOrphan(this.currClueIndex) && this.activeCells.length > 0) {
      // For determining crossers, use the current grid clue, if any.
      clueIndices = []
      if (this.usingGnav && this.currCellIsValid()) {
        let gridCell = this.currCell()
        if (this.currDir == 'A' && gridCell.acrossClueLabel) {
          clueIndices.push('A' + gridCell.acrossClueLabel)
        }
        if (this.currDir == 'D' && gridCell.downClueLabel) {
          clueIndices.push('D' + gridCell.downClueLabel)
        }
      }
    }
  }
  let fullCrossers = []
  let others = []
  for (let x of this.activeCells) {
    let row = x[0]
    let col = x[1]
    let gridCell = this.grid[row][col]
    if (gridCell.prefill) {
      continue
    }
    if (gridCell.currLetter == '0') {
      continue
    }
    if (gridCell.acrossClueLabel && gridCell.downClueLabel) {
      let across = 'A' + gridCell.acrossClueLabel
      let down = 'D' + gridCell.downClueLabel
      let crosser = ''
      if (clueIndices.includes(across) && !clueIndices.includes(down)) {
        crosser = down
      } else if (!clueIndices.includes(across) && clueIndices.includes(down)) {
        crosser = across
      }
      if (crosser && this.isFull(crosser)[0]) {
        fullCrossers.push([row, col])
      } else {
        others.push([row, col])
      }
    } else {
      others.push([row, col])
    }
  }
  for (let rc of others) {
    this.clearCell(rc[0], rc[1])
  }
  if (others.length == 0) {
    for (let rc of fullCrossers) {
      this.clearCell(rc[0], rc[1])
    }
  }
  this.updateActiveCluesState()
  if (this.currClueIndex) {
    this.updateClueState(this.currClueIndex, false, 'unsolved')
  }
  this.updateAndSaveState()
  if (this.usingGnav) {
    this.gridInput.focus()
  }
}

Exolve.prototype.clearAll = function() {
  let message = 'Are you sure you want to clear every entry!?'
  let clearingPls = false
  if (this.lastOrphan) {
    if (this.numCellsFilled == this.numCellsPrefilled) {
      message = 'Are you sure you want to clear every entry including all ' +
                'the placeholder entries!?'
      clearingPls = true
    } else {
      message = message + ' (The placeholder entries will not be cleared. To' +
        ' clear the placeholders, click on clear-all again after clearing' +
        ' the grid.)'
    }
  }
  if (!confirm(message)) {
    if (this.usingGnav) {
      this.gridInput.focus()
    }
    return
  }
  for (let row = 0; row < this.gridHeight; row++) {
    for (let col = 0; col < this.gridWidth; col++) {
      let gridCell = this.grid[row][col]
      if (!gridCell.isLight && !gridCell.isDiagramless) {
        continue
      }
      if (gridCell.prefill) {
        continue
      }
      gridCell.currLetter = '0'
      gridCell.textNode.nodeValue = ''
      if (this.atCurr(row, col)) {
        this.gridInput.value = ''
      }
    }
  }
  for (let a of this.answersList) {
    if (a.isq) {
      a.input.value = ''
    } else {
      break
    }
  }
  for (let a of this.revelationList) {
    a.style.display = 'none'
  }
  this.hideNinas()

  for (let ci of this.allClueIndices) {
    this.updateClueState(ci, false, 'unsolved')
    if (clearingPls && this.isOrphan(ci) && this.clues[ci].orphanPlaceholder) {
      this.clues[ci].orphanPlaceholder.value = ''
    }
  }
  if (clearingPls && this.currClue) {
    let clueInputs = this.currClue.getElementsByTagName('input')
    if (clueInputs.length == 1) {
      clueInputs[0].value = ''
    }
  }
  this.updateAndSaveState()
  if (this.usingGnav) {
    this.gridInput.focus()
  }
}

Exolve.prototype.checkCurr = function() {
  let resetActiveCells = false
  if (this.activeCells.length == 0 && this.currClueIndex &&
      !this.allCellsKnown(this.currClueIndex)) {
    let clueIndices = this.getLinkedClues(this.currClueIndex)
    if (clueIndices.length > 0 && this.isOrphanWithReveals(clueIndices[0])) {
      for (let rowcol of this.clues[clueIndices[0]].cellsOfOrphan) {
        this.activeCells.push(rowcol)
      }
      this.resetActiveCells = true
    }
  }
  let allCorrectNum = 0
  for (let x of this.activeCells) {
    let row = x[0]
    let col = x[1]
    let gridCell = this.grid[row][col]
    let oldLetter = gridCell.currLetter
    if (oldLetter == gridCell.solution) {
      allCorrectNum++
      continue
    }
    allCorrectNum = 0
    gridCell.currLetter = '0'
    gridCell.textNode.nodeValue = ''
    if (this.atCurr(row, col)) {
      this.gridInput.value = ''
    }
    if (oldLetter == '1') {
      let gridSymCell = this.symCell(row, col)
      if (gridSymCell.isDiagramless) {
        gridSymCell.currLetter = '0'
        gridSymCell.textNode.nodeValue = ''
      }
    }
  }
  let neededAllCorrectNum = -1  // revealCurr() will not get triggered
  if (resetActiveCells) {
    if (this.activeCells.length > 0) {
      neededAllCorrectNum = this.activeCells.length
    }
    activeCells = []
  } else if (this.currClueIndex) {
    let ci = this.clueOrParentIndex(this.currClueIndex)
    let theClue = this.clues[ci]
    if (!this.isOrphan(ci) && this.allCellsKnown(ci)) {
      neededAllCorrectNum = theClue.enumLen
    } else if (this.activeCells.length > 0 && this.szCellsToOrphan > 0) {
      let orphanClueForCells =
          this.cellsToOrphan[JSON.stringify(this.activeCells)];
      if (orphanClueForCells &&
          this.clues[orphanClueForCells].cellsOfOrphan.length ==
            this.activeCells.length) {
        neededAllCorrectNum = this.activeCells.length
      }
    }
  }
  if (allCorrectNum == neededAllCorrectNum) {
    this.revealCurr()  // calls updateAndSaveState()
  } else {
    this.updateActiveCluesState()
    this.updateAndSaveState()
  }
  if (this.usingGnav) {
    this.gridInput.focus()
  }
}

Exolve.prototype.checkAll = function() {
  if (!confirm('Are you sure you want to clear mistakes everywhere!?')) {
    if (this.usingGnav) {
      this.gridInput.focus()
    }
    return
  }
  let allCorrect = true
  for (let row = 0; row < this.gridHeight; row++) {
    for (let col = 0; col < this.gridWidth; col++) {
      let gridCell = this.grid[row][col]
      if (!gridCell.isLight && !gridCell.isDiagramless) {
        continue
      }
      if (gridCell.currLetter == gridCell.solution) {
        continue
      }
      allCorrect = false
      gridCell.currLetter = '0'
      gridCell.textNode.nodeValue = ''
      if (this.atCurr(row, col)) {
        this.gridInput.value = ''
      }
    }
  }
  if (allCorrect) {
    this.revealAll()  // calls updateAndSaveState()
  } else {
    for (let ci of this.allClueIndices) {
      this.updateClueState(ci, false, null)
    }
    this.updateAndSaveState()
  }
  if (this.usingGnav) {
    this.gridInput.focus()
  }
}

Exolve.prototype.revealClueAnno = function(ci) {
  let clueIndices = this.getLinkedClues(ci);
  for (let clueIndex of clueIndices) {
    let theClue = this.clues[clueIndex]
    if (theClue.annoSpan) {
      theClue.annoSpan.style.display = ''
    }
    if (theClue.orphanPlaceholder) {
      if (theClue.solution) {
        theClue.orphanPlaceholder.value = theClue.solution
        if (clueIndex == this.currClueIndex) {
          this.copyOrphanEntryToCurr(clueIndex)
        }
      }
    }
  }
}

Exolve.prototype.revealCurr = function() {
  // If active cells are present and usingGnav, we reveal only those (the
  // current clue might be pointing to a random orphan).
  let clueIndexForAnnoReveal = null
  let addCellsFromOrphanClue = null
  if (this.usingGnav && this.activeCells.length > 0) {
    if (this.currClueIndex && !this.isOrphan(this.currClueIndex)) {
      clueIndexForAnnoReveal = this.currClueIndex
    }
    if (this.currClueIndex && this.activeCells.length > 1 &&
        (this.isOrphan(this.currClueIndex) ||
         !this.allCellsKnown(this.currClueIndex)) &&
        this.szCellsToOrphan > 0) {
      let orphanClueForCells =
          this.cellsToOrphan[JSON.stringify(this.activeCells)];
      if (orphanClueForCells) {
        this.deactivateCurrClue();
        this.cnavToInner(orphanClueForCells)
        clueIndexForAnnoReveal = orphanClueForCells
        addCellsFromOrphanClue = this.clues[orphanClueForCells]
      }
    }
  } else if (this.currClueIndex) {
    clueIndexForAnnoReveal = this.currClueIndex
    let parentClueIndex =
      this.clues[this.currClueIndex].parentClueIndex || this.currClueIndex
    if (this.isOrphanWithReveals(parentClueIndex)) {
      this.deactivateCurrCell();
      this.addCellsFromOrphanClue = this.clues[parentClueIndex]
    }
  }
  if (clueIndexForAnnoReveal) {
    this.revealClueAnno(clueIndexForAnnoReveal)
  }
  if (addCellsFromOrphanClue) {
    let activeCellsSet = {}
    for (let rowcol of this.activeCells) {
      activeCellsSet[JSON.stringify(rowcol)] = true
    }
    for (let rowcol of addCellsFromOrphanClue.cellsOfOrphan) {
      let gridCell = this.grid[rowcol[0]][rowcol[1]]
      if (!activeCellsSet[JSON.stringify(rowcol)]) {
        gridCell.cellRect.style.fill = this.colorScheme['active']
        this.activeCells.push(rowcol)
      }
    }
  }
  for (let x of this.activeCells) {
    let row = x[0]
    let col = x[1]
    let gridCell = this.grid[row][col]
    if (gridCell.prefill) {
      continue
    }
    let oldLetter = gridCell.currLetter
    let letter = gridCell.solution
    if (letter && oldLetter != letter) {
      gridCell.currLetter = letter
      let revealedChar = this.stateToDisplayChar(letter)
      gridCell.textNode.nodeValue = revealedChar
      if (this.atCurr(row, col)) {
        this.gridInput.value = revealedChar
      }
    }
    if (oldLetter == '1' || letter == '1') {
      let gridSymCell = this.symCell(row, col)
      if (gridSymCell.isDiagramless) {
        let symLetter = (letter == '1') ? '1' : '0'
        let symChar = (letter == '1') ? this.BLOCK_CHAR : ''
        gridSymCell.currLetter = symLetter
        gridSymCell.textNode.nodeValue = symChar
      }
    }
  }
  this.updateActiveCluesState()
  if (this.currClueIndex) {
    this.updateClueState(this.currClueIndex, false, 'solved')
  }
  this.updateAndSaveState()
  if (this.usingGnav) {
    this.gridInput.focus()
  }
}

Exolve.prototype.revealAll = function() {
  if (!confirm('Are you sure you want to reveal the whole solution!?')) {
    if (usingGnav) {
      this.gridInput.focus()
    }
    return
  }
  for (let row = 0; row < this.gridHeight; row++) {
    for (let col = 0; col < this.gridWidth; col++) {
      let gridCell = this.grid[row][col]
      if (!gridCell.isLight && !gridCell.isDiagramless) {
        continue
      }
      if (gridCell.prefill) {
        continue
      }
      if (gridCell.currLetter != gridCell.solution) {
        gridCell.currLetter = gridCell.solution
        let revealedChar = this.stateToDisplayChar(gridCell.solution)
        gridCell.textNode.nodeValue = revealedChar
        if (this.atCurr(row, col)) {
          this.gridInput.value = revealedChar
        }
      }
    }
  }
  for (let a of this.answersList) {
    if (a.ans) {
      a.input.value = a.ans
    }
  }
  for (let a of this.revelationList) {
    a.style.display = ''
  }
  this.showNinas()
  for (let ci of this.allClueIndices) {
    this.revealClueAnno(ci);
    this.updateClueState(ci, false, 'solved')
  }
  this.updateAndSaveState()
  if (this.usingGnav) {
    this.gridInput.focus()
  }
}

Exolve.prototype.scratchPadInput = function() {
  let cursor = this.scratchPad.selectionStart
  this.scratchPad.value = this.scratchPad.value.toUpperCase()
  this.scratchPad.selectionEnd = cursor
}

Exolve.prototype.scratchPadShuffle = function() {
  let text = this.scratchPad.value
  let start = this.scratchPad.selectionStart
  let end = this.scratchPad.selectionEnd
  if (end <= start) {
    start = 0
    end = text.length
  }
  let indices = []
  let toShuffle = []
  for (let i = start; i < end; i++) {
    if (this.caseCheck(text[i])) {
      indices.push(i)
      toShuffle.push(text[i])
    }
  }
  if (indices.length <= 1) {
    return
  }
  for (let i = toShuffle.length - 1; i >= 1; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    if (i != j) {
      let temp = toShuffle[i]
      toShuffle[i] = toShuffle[j]
      toShuffle[j] = temp
    }
  }
  let textArray = text.split('')
  for (let i = 0; i < indices.length; i++) {
    textArray[indices[i]] = toShuffle[i]
  }
  this.scratchPad.value = textArray.join('')
}

Exolve.prototype.submitSolution = function() {
  let message = 'Are you sure you are ready to submit!?';
  let state = this.updateDisplayAndGetState()
  if (this.numCellsFilled != this.numCellsToFill) {
    message = 'Are you sure you want to submit an INCOMPLETE solution!?';
  }
  if (!confirm(message)) {
    return
  }
  let fullSubmitURL = this.submitURL + '&' + this.submitKeys[0] + '=' +
                      encodeURIComponent(state)
  for (let i = 0; i < this.answersList.length; i++) {
    if (!this.answersList[i].isq) {
      break
    }
    fullSubmitURL = fullSubmitURL + '&' + this.submitKeys[i + 1] + '=' +
      encodeURIComponent(this.answersList[i].input.value)
  }
  document.body.style.cursor = 'wait'
  window.location.replace(fullSubmitURL)
}

Exolve.prototype.displayButtons = function() {
  this.clearButton.setAttributeNS(
    null, 'title',
    'Note: clear crossers from full clues with a second click');
  if (this.lastOrphan) {
    this.clearAllButton.setAttributeNS(
      null, 'title',
      'Note: second click clears all placeholder entries in clues ' +
      'without known cells');
  }
  this.clearButton.disabled = true
  if (!this.hasUnsolvedCells) {
    this.checkButton.style.display = ''
    this.checkAllButton.style.display = ''
    this.revealAllButton.style.display = ''

    this.checkButton.disabled = true
  }
  if (!this.hasUnsolvedCells || this.hasReveals) {
    this.revealButton.style.display = ''
    this.revealButton.disabled = true
  }
  if (this.ninas.length > 0) {
    this.ninasButton.style.display = ''
  }
  if (this.submitURL) {
    this.submitButton.style.display = ''
  }
  this.scratchPad.cols = Math.max(30, Math.floor(this.textAreaCols * 3 / 4))
}

Exolve.prototype.toggleTools = function(e) {
  let tools = document.getElementById(this.prefix + '-tools')
  if (tools.style.display == 'none') {
    tools.style.display = ''
  } else {
    tools.style.display = 'none'
  }
  e.preventDefault()
  }

Exolve.prototype.createPuzzle = function() {
  this.init()

  this.parseAndDisplayPrelude()
  this.parseAndDisplayExplanations()

  this.parseGrid()
  this.markClueStartsUsingGrid()
  this.setClueMemberships()
  this.parseClueLists()

  this.processClueChildren()
  this.finalClueTweaks()
  this.setWordEndsAndHyphens();
  this.setUpGnav()

  this.applyColorScheme()

  this.displayQuestions()
  this.displayClues()
  this.displayGridBackground()
  this.createListeners()
  this.displayGrid()
  this.displayNinas()
  this.displayButtons()

  this.parseAndDisplayRelabel()
  this.parseAndDisplayPS()

  this.restoreState()

  if (this.customizer) {
    this.customizer(this)
  }
  this.checkConsistency()
}

/**
 * createExolve(puzzleText) is just a convenient wrapper that looks for
 *     the customizeExolve() function.
 * See documentation of parameters above the Exolve constructor definition.
 */
function createExolve(puzzleText, containerId="", addStateToUrl=true) {
  const customizer = (typeof customizeExolve === 'function') ?
      customizeExolve : null;
  let p = new Exolve(puzzleText, containerId, customizer, addStateToUrl);
}

/*
 * The global variable "puzzleText" should have been set to the puzzle specs.
 * inIframe can be set to true if the puzzle is embedded in an iframe, which
 *     will then set addStateToUrl to false.
 * @deprecated use createExolve().
 */
function createPuzzle(inIframe=false) {
  createExolve(puzzleText, "", !inIframe);
}
