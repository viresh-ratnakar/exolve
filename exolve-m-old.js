/**
 * NOTE: THIS IS A DEPRECATED COPY OF exolve-m.js FROZEN AT v0.83.
 * AT v0.84, THERE WERE BACKWARD-INCOMPATIBLE CHANGES IN EXOLVE, TO
 * BETTER SUPPORT EMBEDDING EXOLVE IN ARBIRARY WEB SITES.
 *
 * PLEASE USE THIS FILE (ALONG WITH exolve-m-old.css) ONLY IF YOU
 * KNOW WHAT YOU ARE DOING!
 */

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

const VERSION = 'Exolve v0.83 August 3 2020'

// ------ Begin globals.

let puzzleId = 'exolve-grid'

let gridWidth = 0
let gridHeight = 0

let gridFirstLine = -1
let gridLastLine = -1
let preludeFirstLine = -1
let preludeLastLine = -1
let psFirstLine = -1
let psLastLine = -1
let acrossFirstLine = -1
let acrossLastLine = -1
let downFirstLine = -1
let downLastLine = -1
let nodirFirstLine = -1
let nodirLastLine = -1
let explanationsFirstLine = -1
let explanationsLastLine = -1
let relabelFirstLine = -1
let relabelLastLine = -1

// Each nina will be an array containing location [i,j] pairs and/or span
// class names.
let ninas = []
// For span-class-specified ninas, ninaClassElements[] stores the elements
// along with the colours to apply to them when showing the ninas.
let ninaClassElements = []
let showingNinas = false

let grid = []
let clues = {}
let cellColours = []
let submitURL = null
let submitKeys = []
let hasDiagramlessCells = false
let hasUnsolvedCells = false
let hasReveals = false
let hasAcrossClues = false
let hasDownClues = false
let hasNodirClues = false
// Clues labeled non-numerically (like [A] a clue...) use this to create a
// unique clueIndex.
let nextNonNumId = 1
let offNumClueIndices = {}
let cellsToOrphan = {}
let numCellsToOrphan = 0

const MAX_GRID_SIZE = 100
const GRIDLINE = 1
const BAR_WIDTH = 3
const BAR_WIDTH_BY2 = 2
const SEP_WIDTH = 2
const SEP_WIDTH_BY2 = 1.5
const NUMBER_START_X = 2

let SQUARE_DIM = 31
let SQUARE_DIM_BY2 = 16
let NUMBER_START_Y = 10
let LIGHT_START_X = 16.5
let LIGHT_START_Y = 21.925
let HYPHEN_WIDTH = 9
let HYPHEN_WIDTH_BY2 = 5
let CIRCLE_RADIUS = 0.0 + SQUARE_DIM / 2.0
let boxWidth = 0
let boxHeight = 0

let answersList = []
let revelationList = []

// State of navigation
let currentRow = -1
let currentCol = -1
let currentDir = 'A'
let currentClueIndex = null
let usingGnav = false
let lastOrphan = null
let activeCells = [];
let activeClues = [];

let numCellsToFill = 0
let numCellsFilled = 0
let numCellsPrefilled = 0

let allClueIndices = []
const CURR_ORPHAN_ID = 'curr-orphan'
const DEFAULT_ORPHAN_LEN = 15

const BLOCK_CHAR = '⬛';
// We have special meanings for 0 (unfilled) and 1 (block in diagramless cell)
// in solution states. For crosswords with digits, we use these to stand for
// 0 and 1 respectively, in solution states.
const DIGIT0 = '-'
const DIGIT1 = '~'
let scriptRE = null
let scriptLowerCaseRE = null

let colorScheme = {
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

// deprecated, but kept as used in some custom scripts.
let gridBackground = 'black'

let nextPuzzleTextLine = 0

const OLD_STATE_SEP = 'eexxoollvvee'
const STATE_SEP = 'xlv'

const MARK_CLUE_TOOLTIP = 'Click to forcibly mark/unmark as solved'

// Variables set by exolve-option
let hideInferredNumbers = false
let cluesPanelLines = -1
let allowDigits = false
let hideCopyPlaceholders = false
let addSolutionToAnno = true
let offsetLeft = 0
let offsetTop = 0
let language = ''
let languageScript = ''
let langMaxCharCodes = 1

// Variables set in init().
let outermost;
let puzzleTextLines;
let numPuzzleTextLines;
let textAreaCols;
let gridPanel;
let svg;
let gridInputWrapper;
let gridInputRarrow;
let gridInputDarrow;
let gridInput;
let questions;
let background;
let acrossClues;
let downClues;
let nodirClues;
let acrossPanel;
let downPanel;
let nodirPanel;
let currClue;
let currClueParent;
let ninaGroup;
let statusNumFilled;
let statusNumTotal;
let savingURL;
let clearButton;
let clearAllButton;
let checkButton;
let checkAllButton;
let ninasButton;
let revealButton;
let revealAllButton;
let submitButton;

// ------ End globals.

// ------ Begin functions.

// Create the basic HTML structure.
// Set up globals, version number and user agent in bug link.
function init(inWidget=false) {
  outermost = document.getElementById('outermost-stack')
  if (outermost) {
    outermost.remove();
  }
  // Do not remove things from basicHTML, basically ever, to ensure backward
  // compatibility. Use code to add/remove/modify the DOM tree, if needed.
  const basicHTML = `
<div class="flex-col" id="outermost-stack">
  <h2 id="title">Title</h2>
  <div id="setter"></div>
  <div id="prelude"></div>
  <div id="current-clue-parent">
    <div id="current-clue"></div>
  </div>
  <div class="flex-row">
    <div id="grid-panel">
      <div id="grid-parent-centerer">
        <div id="grid-parent">
          <svg id="grid" zoomAndPan="disable"></svg>
          <div id="grid-input-wrapper" style="display:none;left:0;top:0"><input id="grid-input" type="text" maxlength="2" autocomplete="off" spellcheck="false" class="cell-text"/></div>
          <div id="nina-group" style="display:none;left:0;top:0"></div>
        </div> <!-- #grid-parent -->
      </div> <!-- #grid-parent-centerer -->
      <div id="controls-etc">
        <div id="controls" class="wide-box">
          <div id="button-row-1" class="controls-row">
            <button id="clear" class="button"
                onclick="clearCurrent()">Clear this</button>
            <button id="clear-all" class="button"
                onclick="clearAll()">Clear all!</button>
            <button id="check" class="button" style="display:none"
                onclick="checkCurrent()">Check this</button>
            <button id="check-all" class="button" style="display:none"
                onclick="checkAll()">Check all!</button>
          </div> <!-- #button-row-1 -->
          <div id="button-row-2" class="controls-row">
            <button id="reveal" class="button" style="display:none"
                onclick="revealCurrent()">Reveal this</button>
            <button id="ninas" class="button" style="display:none"
                onclick="toggleNinas()">Show ninas</button>
            <button id="reveal-all" class="button" style="display:none"
                onclick="revealAll()">Reveal all!</button>
          </div> <!-- #button-row-2 -->
        </div> <!-- #controls -->
        <div id="errors"></div>
        <div id="status">
          <span id="squares-filled">Squares filled</span>:
          <span id="status-num-filled">0</span>/<span
                id="status-num-total"></span>
        </div> <!-- #status -->
        <div id="saving" class="wide-box">
          Your entries are saved automatically in a cookie, for the most
          recent puzzles that you open from this site.
        </div> <!-- #saving -->
        <div id="small-print" class="wide-box">
          <div id="control-keys-list" style="display:none">
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
              <span id="shuffle"
                title="Shuffle selected text (or all text, if none selected)"
                onclick="scratchPadShuffle()">
                Scratch pad: (click here to shuffle)
              </span>
              <textarea oninput="scratchPadInput()"
                id="scratchpad" spellcheck="false"
                rows="2"></textarea>
            </div>
          </div>
          <a id="show-control-keys" href=""
            title="Show/hide tools: list of control keys and scratch pad"
            onclick="toggleShowControls();return false">Tools</a>
          <a id="report-bug"
            href="https://github.com/viresh-ratnakar/exolve/issues/new">Report
            bug</a>
          <a id="exolve-link"
            href="https://github.com/viresh-ratnakar/exolve">Exolve on
            GitHub</a>
          <span id="copyright"></span>
        </div> <!-- #small-print -->
        <div id="questions" class="wide-box"></div> 
        <div id="submit-parent">
          <button id="submit" class="button" style="display:none"
              onclick="submitSolution()">Submit!</button>
        </div> <!-- submit-parent -->
        <div id="explanations" class="wide-box" style="display:none"></div>
      </div> <!-- #controls-etc -->
      <br/>
    </div> <!-- #grid-panel -->
    <div id="clues" class="flex-row">
      <div id="across-clues-panel" class="clues-box" style="display:none">
        <hr/>
        <span id="across-label" style="font-weight:bold">Across</span>
        <table id="across"></table>
        <br/>
      </div> <!-- #across-clues-panel -->
      <div id="down-clues-panel" class="clues-box" style="display:none">
        <hr/>
        <span id="down-label" style="font-weight:bold">Down</span>
        <table id="down"></table>
        <br/>
      </div> <!-- #down-clues-panel -->
      <div id="nodir-clues-panel" class="clues-box" style="display:none">
        <hr/>
        <table id="nodir"></table>
        <br/>
      </div> <!-- #nodir-clues-panel -->
    </div> <!-- #clues -->
  </div>
</div> <!-- #outermost-stack -->
  `
  const exolveHolder = document.getElementById('exolve')
  if (exolveHolder) {
    exolveHolder.insertAdjacentHTML('beforeend', basicHTML)
  } else {
    document.body.insertAdjacentHTML('beforeend', basicHTML)
  }
  outermost = document.getElementById('outermost-stack')

  puzzleTextLines = []
  let rawLines = puzzleText.trim().split('\n');
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
    puzzleTextLines.push(rawLine)
  }
  numPuzzleTextLines = puzzleTextLines.length

  gridPanel = document.getElementById('grid-panel');
  svg = document.getElementById('grid');
  gridInputWrapper = document.getElementById('grid-input-wrapper');
  gridInputWrapper.insertAdjacentHTML('beforeend',
    '<div id="grid-input-rarr">&rtrif;</div>')
  gridInputWrapper.insertAdjacentHTML('beforeend',
    '<div id="grid-input-darr">&dtrif;</div>')
  gridInputRarrow = document.getElementById('grid-input-rarr');
  gridInputDarrow = document.getElementById('grid-input-darr');
  gridInput = document.getElementById('grid-input');
  questions = document.getElementById('questions');

  background =
    document.createElementNS('http://www.w3.org/2000/svg', 'rect');

  acrossPanel = document.getElementById('across-clues-panel')
  downPanel = document.getElementById('down-clues-panel')
  nodirPanel = document.getElementById('nodir-clues-panel')
  acrossClues = document.getElementById('across')
  downClues = document.getElementById('down')
  nodirClues = document.getElementById('nodir')

  currClue = document.getElementById('current-clue')
  currClueParent = document.getElementById('current-clue-parent')
  ninaGroup = document.getElementById('nina-group')

  statusNumFilled = document.getElementById('status-num-filled')
  statusNumTotal = document.getElementById('status-num-total')
  if (!inWidget) {
    document.getElementById('saving').insertAdjacentHTML('beforeend',
        ' Bookmark/save the <a id="saving-url" href="">URL</a>' +
        ' for more reliable recovery.');
    savingURL = document.getElementById('saving-url')
  }

  clearButton = document.getElementById('clear')
  clearAllButton = document.getElementById('clear-all')
  checkButton = document.getElementById('check')
  checkAllButton = document.getElementById('check-all')
  ninasButton = document.getElementById('ninas')
  revealButton = document.getElementById('reveal')
  revealAllButton = document.getElementById('reveal-all')
  submitButton = document.getElementById('submit')

  let info = 'Version: ' + VERSION + ', User Agent: ' + navigator.userAgent
  document.getElementById('report-bug').href =
      'https://github.com/viresh-ratnakar/exolve/issues/new?body=' +
      encodeURIComponent(info);

  setTextAreaCols()
}

// puzzleTextLines[] has been parsed till line # nextPuzzleTextLine. Fine the
// next line beginning with 'exolve-<section>' and return <section> as well
// as the 'value' of the section (the part after ':').
function parseToNextSection() {
  const MARKER = 'exolve-'
  while (nextPuzzleTextLine < numPuzzleTextLines &&
         puzzleTextLines[nextPuzzleTextLine].trim().indexOf(MARKER) != 0) {
    nextPuzzleTextLine++;
  }
  if (nextPuzzleTextLine >= numPuzzleTextLines) {
    return null
  }
  // Skip past MARKER
  let line = puzzleTextLines[nextPuzzleTextLine].trim().substr(MARKER.length)
  let index = line.indexOf(':')
  if (index < 0) {
    index = line.length
  }
  nextPuzzleTextLine++
  return {'section': line.substr(0, index).trim().toLowerCase(),
          'value': line.substr(index + 1).trim()}
}

// If s is like 15a or 16D, return A15 or D16. Otherwise just return s.
function maybeClueIndex(s) {
  if (s.trim().match(/^\d+[aAdD]$/)) {
    s = s.trim()
    s = s.substr(s.length - 1).toUpperCase() + s.substr(0, s.length - 1)
  }
  return s 
}

// Parse a nina line, which consists of cell locations or clue indices.
// Convert the cell locations to [row col] and push an array of these to the
// global ninas array.
function parseNina(s) {
  let nina = []
  let cellsOrOthers = s.split(' ')
  for (let cellOrOther of cellsOrOthers) {
    if (!cellOrOther) {
      continue
    }
    let cellLocation = parseCellLocation(cellOrOther)
    if (!cellLocation) {
      // Must be a class name, for a span-class-specified nina OR a clue index
      nina.push(maybeClueIndex(cellOrOther))
    } else {
      nina.push(cellLocation)
    }
  }
  if (nina.length > 0) {
    ninas.push(nina)
  }
}

function parseColour(s) {
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
    let cellLocation = parseCellLocation(c)
    if (!cellLocation) {
      cellColours.push([maybeClueIndex(c), colour])  // clue index
    } else {
      cellColours.push(cellLocation.concat(colour))
    }
  }
}

function getAnswerListener(answer, forceUpper) {
  return function() {
    deactivateCurrentCell()
    deactivateCurrentClue()
    usingGnav = false
    let cursor = answer.selectionStart
    if (forceUpper) {
      answer.value = answer.value.toUpperCase().trimLeft()
    } else {
      answer.value = answer.value.trimLeft()
    }
    answer.selectionEnd = cursor 
    updateAndSaveState()
  };
}

// Parse a question line and create the question element for it (which includes
// an input box for the answer). The solution answer may be provided after the
// last ')'.
function parseQuestion(s) {
  let enumParse = parseEnum(s)
  let inputLen = enumParse.placeholder.length

  let afterEnum = enumParse.afterEnum
  let rawQ = s.substr(0, afterEnum)

  let hideEnum = false
  if (inputLen > 0) {
    if (s.substr(afterEnum, 1) == '*') {
      beforeEnum = s.lastIndexOf('(', afterEnum - 1)
      if (beforeEnum < 0) {
        throwErr('Could not find open-paren strangely')
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
  question.setAttributeNS(null, 'class', 'question');
  const questionText = document.createElement('span')
  questionText.innerHTML = rawQ
  question.appendChild(questionText)
  question.appendChild(document.createElement('br'))

  if (inputLen == 0) {
    hideEnum = true
    inputLen = '30'
  }
  let rows = Math.floor(inputLen / textAreaCols)
  if (rows * textAreaCols < inputLen) {
    rows++
  }
  let cols = (rows > 1) ? textAreaCols : inputLen

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
  answer.setAttributeNS(null, 'class', 'answer');
  answersList.push({
    'ans': correctAnswer,
    'input': answer,
    'isq': true,
  });
  if (!hideEnum) {
    answer.setAttributeNS(null, 'placeholder', enumParse.placeholder);
  }
  answer.setAttributeNS(null, 'class', 'answer');
  if (rows == 1) {
    answer.setAttributeNS(null, 'type', 'text');
  }
  answer.setAttributeNS(null, 'maxlength', '' + inputLen * langMaxCharCodes);
  answer.setAttributeNS(null, 'autocomplete', 'off');
  answer.setAttributeNS(null, 'spellcheck', 'false');
  question.appendChild(answer)
  questions.appendChild(question)
  answer.addEventListener('input', getAnswerListener(answer, forceUpper));
}

function parseSubmit(s) {
  let parts = s.split(' ')
  if (s.length < 2) {
    throwErr('Submit section must have a URL and a param name for the solution')
  }
  submitURL = parts[0]
  submitKeys = []
  for (let i = 1; i < parts.length; i++) {
    submitKeys.push(parts[i])
  }
}

function parseOption(s) {
  let sparts = s.split(' ')
  for (let spart of sparts) {
    spart = spart.trim().toLowerCase()
    if (spart == "hide-inferred-numbers") {
      hideInferredNumbers = true
      continue
    }
    if (spart == "allow-digits") {
      allowDigits = true
      continue
    }
    if (spart == "hide-copy-placeholder-buttons") {
      hideCopyPlaceholders = true
      continue
    }
    if (spart == "no-auto-solution-in-anno") {
      addSolutionToAnno = false
      continue
    }
    let kv = spart.split(':')
    if (kv.length != 2) {
      throwErr('Expected exolve-option: key:value, got: ' + spart)
    }
    if (kv[0] == 'clues-panel-lines') {
      cluesPanelLines = parseInt(kv[1])
      if (isNaN(cluesPanelLines)) {
        throwErr('Unexpected val in exolve-option: clue-panel-lines: ' + kv[1])
      }
      continue
    }
    if (kv[0] == 'offset-left') {
      offsetLeft = parseInt(kv[1])
      if (isNaN(offsetLeft)) {
        throwErr('Unexpected val in exolve-option: offset-left: ' + kv[1])
      }
      continue
    }
    if (kv[0] == 'offset-top') {
      offsetTop = parseInt(kv[1])
      if (isNaN(offsetTop)) {
        throwErr('Unexpected val in exolve-option: offset-top: ' + kv[1])
      }
      continue
    }
    if (kv[0] == 'grid-background') {
      gridBackground = kv[1]
      colorScheme['background'] = kv[1]
      continue
    }
    if (kv[0].substr(0, 6) == 'color-' || kv[0].substr(0, 7) == 'colour-') {
      let key = kv[0].substr(kv[0].indexOf('-') + 1);
      if (!colorScheme[key]) {
        throwErr('Unsupported coloring option: ' + kv[0])
      }
      colorScheme[key] = kv[1]
      continue
    }
    throwErr('Unexpected exolve-option: ' + spart)
  }
}

function parseLanguage(s) {
  const parts = s.trim().split(' ')
  if (parts.length < 2) {
    throwErr('Usage: exolve-language: ' + s + 'cannot be parsed ' +
             'as "language-code Script [max-char-codes]"')
  }
  language = parts[0]
  languageScript = parts[1]
  try {
    scriptRE = new RegExp('\\p{Script=' + languageScript + '}', 'u')
    scriptLowerCaseRE = new RegExp('\\p{Lowercase}', 'u')
  } catch (err) {
    throwErr(
      'Your browser ' +
      '<a href="https://caniuse.com/#search=Unicode%20property%20escapes"' +
      '>does not support Unicode property escapes</a> OR you\'ve provided ' +
      'an invalid Script name: ' + languageScript)
  }
  // Hard-code some known scripts requiring langMaxCharCodes
  if (languageScript.toLowerCase() == 'devanagari') {
    langMaxCharCodes = 4
  }
  if (parts.length > 2) {
    langMaxCharCodes = parseInt(parts[2])
    if (isNaN(langMaxCharCodes) || langMaxCharCodes < 1) {
      throwErr('invalid max-char-codes in exolve-language: ' + parts[2])
    }
  }
}

// The overall parser for the puzzle text. Also takes care of parsing and
// displaying all exolve-* sections except premable, grid, across, down,
// postscript (for these, it just captures where the start and end lines are).
function parseOverallDisplayMost() {
  let sectionAndValue = parseToNextSection()

  while (sectionAndValue && sectionAndValue.section != 'end') {
    let firstLine = nextPuzzleTextLine
    let nextSectionAndValue = parseToNextSection()
    let lastLine = nextPuzzleTextLine - 2
    if (sectionAndValue.section == 'begin') {
    } else if (sectionAndValue.section == 'id') {
      puzzleId = sectionAndValue.value
    } else if (sectionAndValue.section == 'title') {
      document.getElementById('title').innerHTML = sectionAndValue.value
    } else if (sectionAndValue.section == 'setter') {
      if (sectionAndValue.value.trim() != '') {
        document.getElementById('setter').innerHTML =
            '<span id="setter-by">By</span> ' + sectionAndValue.value
      }
    } else if (sectionAndValue.section == 'copyright') {
      document.getElementById('copyright').innerHTML =
          'Ⓒ ' + sectionAndValue.value
    } else if (sectionAndValue.section == 'credits') {
      let smallPrintBox = document.getElementById('small-print')
      smallPrintBox.insertAdjacentHTML('beforeend',
        '<div>' + sectionAndValue.value + '</div>')
    } else if (sectionAndValue.section == 'width') {
      gridWidth = parseInt(sectionAndValue.value)
    } else if (sectionAndValue.section == 'height') {
      gridHeight = parseInt(sectionAndValue.value)
    } else if (sectionAndValue.section == 'preamble' ||
               sectionAndValue.section == 'prelude') {
      preludeFirstLine = firstLine
      preludeLastLine = lastLine
    } else if (sectionAndValue.section == 'postscript') {
      psFirstLine = firstLine
      psLastLine = lastLine
    } else if (sectionAndValue.section == 'grid') {
      gridFirstLine = firstLine
      gridLastLine = lastLine
    } else if (sectionAndValue.section == 'nina') {
      parseNina(sectionAndValue.value)
    } else if (sectionAndValue.section == 'colour' ||
               sectionAndValue.section == 'color') {
      parseColour(sectionAndValue.value)
    } else if (sectionAndValue.section == 'question') {
      parseQuestion(sectionAndValue.value)
    } else if (sectionAndValue.section == 'submit') {
      parseSubmit(sectionAndValue.value)
    } else if (sectionAndValue.section == 'across') {
      acrossFirstLine = firstLine
      acrossLastLine = lastLine
    } else if (sectionAndValue.section == 'down') {
      downFirstLine = firstLine
      downLastLine = lastLine
    } else if (sectionAndValue.section == 'nodir') {
      nodirFirstLine = firstLine
      nodirLastLine = lastLine
    } else if (sectionAndValue.section == 'option') {
      parseOption(sectionAndValue.value)
    } else if (sectionAndValue.section == 'language') {
      parseLanguage(sectionAndValue.value)
    } else if (sectionAndValue.section == 'explanations') {
      explanationsFirstLine = firstLine
      explanationsLastLine = lastLine
    } else if (sectionAndValue.section == 'relabel') {
      relabelFirstLine = firstLine
      relabelLastLine = lastLine
    }
    sectionAndValue = nextSectionAndValue
  }
}

// Extracts the prelude from its previously identified lines and sets up
// its display.
function parseAndDisplayPrelude() {
  if (preludeFirstLine >= 0 && preludeFirstLine <= preludeLastLine) {
    let preludeText = puzzleTextLines[preludeFirstLine]
    let l = preludeFirstLine + 1
    while (l <= preludeLastLine) {
      preludeText = preludeText + '\n' + puzzleTextLines[l]
      l++;
    }
    document.getElementById('prelude').innerHTML = preludeText
  }
}

function parseAndDisplayPS() {
  if (psFirstLine >= 0 && psFirstLine <= psLastLine) {
    let psText = puzzleTextLines[psFirstLine]
    let l = psFirstLine + 1
    while (l <= psLastLine) {
      psText = psText + '\n' + puzzleTextLines[l]
      l++;
    }
    psHTML = "<div id='postscript'><hr>" + psText + "</div>";
    outermost.insertAdjacentHTML('beforeend', psHTML);
  }
}

// Extracts the explanations section from its previously identified lines,
// populates its element, and adds it to revelationList.
function parseAndDisplayExplanations() {
  if (explanationsFirstLine >= 0 &&
      explanationsFirstLine <= explanationsLastLine) {
    let explanationsText = puzzleTextLines[explanationsFirstLine]
    let l = explanationsFirstLine + 1
    while (l <= explanationsLastLine) {
      explanationsText = explanationsText + '\n' + puzzleTextLines[l]
      l++;
    }
    const explanations = document.getElementById('explanations')
    explanations.innerHTML = explanationsText
    revelationList.push(explanations)
  }
}

// Parses exolve-relabel, changing the text of various buttons etc.
// Sets language of the page if exolve-language was specified.
function parseAndDisplayRelabel() {
  if (relabelFirstLine >= 0 && relabelFirstLine <= relabelLastLine) {
    let l = relabelFirstLine
    while (l <= relabelLastLine) {
      const colon = puzzleTextLines[l].indexOf(':')
      if (colon < 0) {
        throwErr('Line in exolve-relabel does not look like ' +
                 '"id: new-label":' + puzzleTextLines[l])
      }
      let id = puzzleTextLines[l].substr(0, colon).trim()
      let elt = document.getElementById(id)
      if (!elt) {
        throwErr('exolve-relabel: no element found with id: ' + id)
      }
      elt.innerHTML = puzzleTextLines[l].substr(colon + 1).trim()
      l++;
    }
  }
  if (language) {
    document.documentElement.lang = language
    gridInput.lang = language
    questions.lang = language
    gridInput.maxLength = '' + (2 * langMaxCharCodes)
  }
}

// Append an error message to the errors div. Scuttle everything by setting
// gridWidth to 0.
function throwErr(error) {
  document.getElementById('errors').innerHTML =
      document.getElementById('errors').innerHTML + '<br/>' +
      error;
  gridWidth = 0
  throw error;
}

// Run some checks for serious problems with grid id, dimensions, etc. If found,
// abort with error.
function checkIdAndConsistency() {
  if (puzzleId.match(/[^a-zA-Z\d-]/)) {
    throwErr('Puzzle id should only have alphanumeric characters or -: ' +
             puzzleId)
  }
  if (gridWidth < 1 || gridWidth > MAX_GRID_SIZE ||
      gridHeight < 1 || gridHeight > MAX_GRID_SIZE) {
    throwErr('Bad/missing width/height');
  } else if (gridFirstLine < 0 || gridLastLine < gridFirstLine ||
             gridHeight != gridLastLine - gridFirstLine + 1) {
    throwErr('Mismatched width/height');
  }
  if (submitURL) {
    let numKeys = 1
    for (let a of answersList) {
      if (a.isq) {
        numKeys++
      } else {
        break
      }
    }
    if (submitKeys.length != numKeys) {
      throwErr('Have ' + submitKeys.length + ' submit paramater keys, need ' +
               numKeys);
    }
  }
}

function caseCheck(c) {
  if (scriptRE) {
    if (scriptRE.test(c)) {
      return !scriptLowerCaseRE.test(c)
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
// grid[i][j].solution and grid[i][j].currentLetter are in "state char" space.
// grid specified originally, consumed by parseGrid() is in state char space,
// except:
//   0 can mean the digit 0 if allow-digits is true and there are entries
//   other than 0.

function isValidDisplayChar(c) {
  if (caseCheck(c)) {
    return true
  }
  if (c == BLOCK_CHAR) {
    return true
  }
  if (allowDigits && c >= '0' && c <= '9') {
    return true
  }
  return false
}

function isValidStateChar(c) {
  if (caseCheck(c)) {
    return true
  }
  if (allowDigits && ((c >= '2' && c <= '9') || c == DIGIT0 || c == DIGIT1)) {
    return true
  }
  if (c == '0') {
    return true
  }
  if (hasDiagramlessCells && c == '1') {
    return true
  }
  return false
}

function stateCharToDisplayChar(c) {
  if (c == '0') {
    return ''
  }
  if (c == '1') {
    return BLOCK_CHAR
  }
  if (c == DIGIT0) {
    return '0'
  }
  if (c == DIGIT1) {
    return '1'
  }
  return c
}

function displayCharToStateChar(c) {
  if (c == BLOCK_CHAR) {
    return '1'
  }
  if (c == '0') {
    return DIGIT0
  }
  if (c == '1') {
    return DIGIT1
  }
  if (!isValidDisplayChar(c)) {
    return '0'
  }
  return c
}

function GridCell(row, col, letter) {
  this.row = row
  this.col = col
  this.solution = letter.toUpperCase()
  this.isLight = false
  if (this.solution != '.') {
    if (this.solution != '0' && !isValidDisplayChar(this.solution)) {
      throwErr('Bad grid entry at ' + row + ',' + col + ':' + letter);
    }
    this.isLight = true
  }
  this.prefill = false
  this.isDiagramless = false

  this.hasBarAfter = false
  this.hasBarUnder = false
  this.hasCircle = false

  this.notBlocked = function() {
    return this.isLight || this.isDiagramless
  }
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
function parseGrid() {
  let hasSolvedCells = false
  let allEntriesAre0s = true
  const DECORATORS = ' +|_@!*'
  const reDecorators = new RegExp('[' + DECORATORS + ']')
  const reNextChar = new RegExp('[\.0' + DECORATORS + ']')
  for (let i = 0; i < gridHeight; i++) {
    grid[i] = new Array(gridWidth)
    let gridLine = puzzleTextLines[i + gridFirstLine].trim().toUpperCase()
    if (langMaxCharCodes == 1) {
      gridLine = gridLine.replace(/\s/g, '')
    } else {
      gridLine = gridLine.replace(/\s+/g, ' ')
    }
    let gridLineIndex = 0
    for (let j = 0; j < gridWidth; j++) {
      if (gridLineIndex >= gridLine.length) {
        let errmsg = 'Too few letters in the grid at 0-based row: ' + i
        if (langMaxCharCodes > 1) {
          errmsg = errmsg + '. Note that grid letters must be separated by ' +
            'spaces or decorators for languages that have compund characters';
        }
        throwErr(errmsg)
      }
      let letter = gridLine.charAt(gridLineIndex++)
      if (langMaxCharCodes > 1 && letter != '.' && letter != '0') {
        let next = gridLineIndex
        while (next < gridLine.length &&
               !reNextChar.test(gridLine.charAt(next))) {
          next++
        }
        letter = letter + gridLine.substring(gridLineIndex, next).trim()
        gridLineIndex = next
      }
      grid[i][j] = new GridCell(i, j, letter)
      let gridCell = grid[i][j]
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
          throwErr('Should not happen! thisChar = ' + thisChar);
        }
        gridLineIndex++
      }
      if (gridCell.isLight && gridCell.solution != '0' && !gridCell.prefill) {
        allEntriesAre0s = false
      }
    }
  }
  // We use two passes to be able to detect if 0 means blank cell or digit 0.
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      let gridCell = grid[i][j]
      if (gridCell.isLight) {
        if (gridCell.solution == '0') {
          if (allEntriesAre0s && !gridCell.prefill) {
            hasUnsolvedCells = true
          } else {
            gridCell.solution = DIGIT0;
          }
        } else if (gridCell.solution == '1') {
          gridCell.solution = DIGIT1;
        }
      }
      if (gridCell.isDiagramless && gridCell.solution == '.') {
        gridCell.solution = '1'
      }
      if (gridCell.prefill && !gridCell.isLight) {
        throwErr('Pre-filled cell (' + i + ',' + j + ') not in a light: ')
      }
      if (gridCell.isDiagramless) {
        hasDiagramlessCells = true
      }
      if (gridCell.isLight && !gridCell.prefill && gridCell.solution != '0') {
        hasSolvedCells = true
      }
    }
  }
  if (hasDiagramlessCells) {
    hideCopyPlaceholders = true
  }
  if (hasUnsolvedCells && hasSolvedCells) {
    throwErr('Either all or no solutions should be provided')
  }
}

function startsAcrossClue(i, j) {
  if (!grid[i][j].isLight) {
    return false;
  }
  if (j > 0 && grid[i][j - 1].isLight && !grid[i][j - 1].hasBarAfter) {
    return false;
  }
  if (grid[i][j].hasBarAfter) {
    return false;
  }
  if (j == gridWidth - 1) {
    return false;
  }
  if (!grid[i][j + 1].isLight) {
    return false;
  }
  return true;
}

function startsDownClue(i, j) {
  if (!grid[i][j].isLight) {
    return false;
  }
  if (i > 0 && grid[i - 1][j].isLight && !grid[i - 1][j].hasBarUnder) {
    return false;
  }
  if (grid[i][j].hasBarUnder) {
    return false;
  }
  if (i == gridHeight - 1) {
    return false;
  }
  if (!grid[i + 1][j].isLight) {
    return false;
  }
  return true;
}

function Clue(index) {
  this.index = index
  this.dir = index.substr(0, 1)
  this.label = index.substr(1)
  this.cells = []
};

// Sets starts{Across,Down}Clue (boolean) and startsClueLabel (#) in
// grid[i][j]s where clues start.
function markClueStartsUsingGrid() {
  if (hasDiagramlessCells && hasUnsolvedCells) {
    // Cannot rely on grid. Clue starts should be provided in clues using
    // prefixes like #a8, #d2, etc.
    return
  }
  let nextClueNumber = 1
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      let gridCell = grid[i][j]
      if (startsAcrossClue(i, j)) {
        gridCell.startsAcrossClue = true
        gridCell.startsClueLabel = '' + nextClueNumber
        let clue = new Clue('A' + nextClueNumber)
        clues[clue.index] = clue
      }
      if (startsDownClue(i, j)) {
        gridCell.startsDownClue = true
        gridCell.startsClueLabel = '' + nextClueNumber
        let clue = new Clue('D' + nextClueNumber)
        clues[clue.index] = clue
      }
      if (gridCell.startsClueLabel) {
        nextClueNumber++
      }
    }
  }
}

// If there are any html closing tags, move past them.
function adjustAfterEnum(clueLine, afterEnum) {
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
function parseCellLocation(s) {
  let row = -1
  let col = -1
  s = s.trim()
  let spaceAt = s.indexOf(' ')
  if (spaceAt >= 0) {
    s = s.substr(0, spaceAt)
  }
  let matches = s.match(/r(\d+)c(\d+)/)
  if (matches && matches.length == 3) {
    row = gridHeight - parseInt(matches[1])
    col = parseInt(matches[2]) - 1
  } else {
    matches = s.match(/c(\d+)r(\d+)/)
    if (matches && matches.length == 3) {
      col = parseInt(matches[1]) - 1
      row = gridHeight - parseInt(matches[2])
    }
  }
  if (row < 0 || col < 0) {
    col = s.charCodeAt(0) - 'a'.charCodeAt(0)
    row = gridHeight - parseInt(s.substr(1))
  }
  if (isNaN(row) || isNaN(col) ||
      row < 0 || row >= gridHeight || col < 0 || col >= gridWidth) {
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
function parseEnum(clueLine) {
  let parse = {
    'enumLen': 0,
    'wordEndAfter': [],
    'hyphenAfter': [],
    'afterEnum': clueLine.length,
    'placeholder': '',
  };
  let enumLocation = clueLine.search(/\([1-9]+[0-9\-,\.'’\s]*\)/)
  if (enumLocation < 0) {
    // Look for the string 'word'/'letter'/? in parens.
    enumLocation = clueLine.search(/\([^)]*(word|letter|\?)[^)]*\)/i)
    if (enumLocation >= 0) {
      let enumEndLocation =
          enumLocation + clueLine.substr(enumLocation).indexOf(')')
      if (enumEndLocation <= enumLocation) {
        return parse
      }
      parse.afterEnum = adjustAfterEnum(clueLine, enumEndLocation + 1)
    }
    return parse
  }
  let enumEndLocation =
      enumLocation + clueLine.substr(enumLocation).indexOf(')')
  if (enumEndLocation <= enumLocation) {
    return parse
  }
  parse.afterEnum = adjustAfterEnum(clueLine, enumEndLocation + 1)
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
function parseClueLabel(clueLine) {
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
      throwErr('Missing matching ] in clue label in ' + clueLine)
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

function sameCells(cells1, cells2) {
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
function maybeRelocateClue(clueIndex, dir, clue) {
  if (!clue.startCell) {
    return clueIndex
  }
  if (!(clue.isOffNum && dir != 'X') &&
      !(clue.cells && clue.cells.length > 0 && dir == 'X')) {
    return clueIndex
  }
  const r = clue.startCell[0]
  const c = clue.startCell[1]
  let gridCell = grid[r][c]
  if (!gridCell.startsClueLabel) {
    return clueIndex
  }
  let replIndex = null
  let clueAtRepl = null
  if (dir == 'X') {
    if (gridCell.startsAcrossClue) {
      replIndex = 'A' + gridCell.startsClueLabel
      clueAtRepl = clues[replIndex]
      if (clueAtRepl && !clueAtRepl.clue &&
          sameCells(clue.cells, clueAtRepl.cells)) {
        return replIndex
      }
    }
    if (gridCell.startsDownClue) {
      replIndex = 'D' + gridCell.startsClueLabel
      clueAtRepl = clues[replIndex]
      if (clueAtRepl && !clueAtRepl.clue &&
          sameCells(clue.cells, clueAtRepl.cells)) {
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
  clueAtRepl = clues[replIndex]
  if (replIndex && clueAtRepl && !clueAtRepl.clue &&
      clueAtRepl.cells && clueAtRepl.cells.length > 0) {
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
function parseClue(dir, clueLine) {
  clueLine = clueLine.trim()
  let numCellsGiven = 0
  let startCell = null
  let cells = []
  while (clueLine.indexOf('#') == 0) {
    let cell = parseCellLocation(clueLine.substr(1));
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

  let clueLabelParse = parseClueLabel(clueLine)
  let clue = new Clue(dir + clueLabelParse.label)

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
    throwErr('Explicit dir ' + clueLabelParse.dir +
             ' does not match ' + dir + ' in clue: ' + clueLine)
  }
  clue.label = clueLabelParse.label
  clue.isOffNum = clueLabelParse.isOffNum
  let clueIndex = dir + clue.label
  if (clue.isOffNum) {
    let offNumIndex = dir + '#' + (nextNonNumId++)
    if (!offNumClueIndices[clue.label]) {
      offNumClueIndices[clue.label] = []
    }
    offNumClueIndices[clue.label].push(offNumIndex)
    clueIndex = offNumIndex
  }

  clueIndex = maybeRelocateClue(clueIndex, dir, clue)
  clue.index = clueIndex

  if (clue.cells.length > 0) {
    if (dir != 'X') {
      throwErr('Cells listed in non-nodir clue: ' + clueLine)
    }
    let prev = []
    for (let c of clue.cells) {
      let gridCell = grid[c[0]][c[1]]
      if (!gridCell.nodirClues) {
        gridCell.nodirClues = []
      }
      gridCell.nodirClues.push(clueIndex)
      if (prev.length > 0) {
        grid[prev[0]][prev[1]]['succ' + clueIndex] = {
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
    clueLabelParse = parseClueLabel(clueLine)
    clue.children.push(clueLabelParse)
    clueLine = clueLine.substr(clueLabelParse.skip)
  }

  let enumParse = parseEnum(clueLine)
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
function parseCellsOfOrphan(s) {
  let segments = []
  let cells = []
  let cellsOrClues = s.trim().split(' ')
  for (let cellOrClue of cellsOrClues) {
    if (!cellOrClue) {
      continue
    }
    let cellLocation = parseCellLocation(cellOrClue)
    if (!cellLocation) {
      let theClue = clues[maybeClueIndex(cellOrClue)]
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

function setClueSolution(ci) {
  let theClue = clues[ci]
  if (!theClue) {
    return;
  }
  if (theClue.solution || theClue.parentClueIndex) {
    return;
  }
  let clueIndices = getAllLinkedClueIndices(ci)
  let cells = []
  for (let clueIndex of clueIndices) {
    if (clues[clueIndex].cellsOfOrphan) {
      for (let rowcol of clues[clueIndex].cellsOfOrphan) {
        cells.push(rowcol)
      }
    } else {
      for (let rowcol of clues[clueIndex].cells) {
        cells.push(rowcol)
      }
    }
  }
  if (!cells || cells.length == 0) {
    return;
  }
  let solution = '';
  for (let cell of cells) {
    let c = stateCharToDisplayChar(grid[cell[0]][cell[1]].solution)
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
        s = s + solution[index++];
      } else {
        s = s + theClue.placeholder.charAt(i)
      }
    }
    solution = s;
  }
  theClue.solution = solution;
}

function parseAnno(anno, clueIndex) {
  let theClue = clues[clueIndex]
  anno = anno.trim()
  while (anno && anno.substr(0, 1) == '[') {
    let indexOfBrac = anno.indexOf(']')
    if (indexOfBrac <= 0) {
      break;
    }
    let inBrac = anno.substring(1, indexOfBrac).trim();
    let cellsOfOrphan = parseCellsOfOrphan(inBrac);
    if (!theClue.cellsOfOrphan &&
        cellsOfOrphan && cellsOfOrphan.cells.length > 0) {
      theClue.cellsOfOrphan = cellsOfOrphan.cells
      for (let segment of cellsOfOrphan.segments) {
        cellsToOrphan[JSON.stringify(segment)] = clueIndex
        numCellsToOrphan++
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
// identified by parseOverallDisplayMost(). Sets lastOrphan, if any.
// Sets cellsToOrphan[] for orphan clues for which revelations are provided.
function parseClueLists() {
  // Parse across, down, nodir clues
  let prev = null
  let firstClue = null
  let lastClue = null
  for (let clueDirection of ['A', 'D', 'X']) {
    let first, last
    if (clueDirection == 'A') {
      first = acrossFirstLine
      last = acrossLastLine
    } else if (clueDirection == 'D') {
      first = downFirstLine
      last = downLastLine
    } else {
      first = nodirFirstLine
      last = nodirLastLine
    }
    if (first < 0 || last < first) {
      continue
    }
    let filler = ''
    let startNewTable = false
    for (let l = first; l <= last; l++) {
      let clueLine = puzzleTextLines[l].trim();
      if (clueLine == '') {
        continue;
      }
      if (clueLine.substr(0, 3) == '---') {
        startNewTable = true
        continue;
      }
      let clue = parseClue(clueDirection, clueLine)
      if (clue.isFiller) {
        filler = filler + clueLine + '\n'
        continue
      }
      if (!clue.index) {
        throwErr('Could not parse clue: ' + clueLine);
      }
      if (clues[clue.index] && clues[clue.index].clue) {
        throwErr('Clue entry already exists for clue: ' + clueLine);
      }
      if (!firstClue) {
        firstClue = clue.index
      }
      lastClue = clue.index

      if (clues[clue.index]) {
        if (clue.cells.length > 0) {
          let theClue = clues[clue.index]
          if (theClue.cells.length > 0) {
            if (!sameCells(theClue.cells, clue.cells)) {
              throwErr('Grid, clue diff in cells for ' + clue.index)
            }
          }
        } else {
          // Take the cells from the parsing of the grid.
          clue.cells = clues[clue.index].cells
        }
      }
      clues[clue.index] = clue
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

      parseAnno(clue.anno, clue.index)

      if (clue.startCell) {
        let row = clue.startCell[0]
        let col = clue.startCell[1]
        grid[row][col].forcedClueLabel = clue.label
      }
      clue.prev = prev
      clue.next = null
      if (prev) {
        clues[prev].next = clue.index
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
        allClueIndices.push(clue.index) 
      }
    }
    if (filler) {
      throwErr('Filler line should not be at the end: ' + filler)
    }
  }
  if (firstClue && lastClue) {
    clues[firstClue].prev = lastClue
    clues[lastClue].next = firstClue
  }
  for (let clueIndex of allClueIndices) {
    if (!clues[clueIndex].parentClueIndex && isOrphan(clueIndex)) {
      lastOrphan = clueIndex
      break
    }
  }
}

function isOrphan(clueIndex) {
  let theClue = clues[clueIndex]
  return theClue && theClue.cells.length == 0;
}

function isOrphanWithReveals(clueIndex) {
  return isOrphan(clueIndex) && clues[clueIndex].cellsOfOrphan
}

function allCellsKnown(clueIndex) {
  let cis = getAllLinkedClueIndices(clueIndex)
  if (!cis || cis.length == 0) {
    return false
  }
  clueIndex = cis[0]
  let clue = clues[clueIndex]
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
    if (!clues[ci]) {
      return false
    }
    if (clues[ci].cells && clues[ci].cells.length) {
      numCells += clues[ci].cells.length
    } else if (clues[ci].cellsOfOrphan && clues[ci].cellsOfOrphan.length) {
      numCells += clues[ci].cellsOfOrphan.length
    } else {
      return false
    }
  }
  return numCells == clue.enumLen
}

// For each cell grid[i][j], set {across,down}ClueLabels using previously
// marked clue starts. Alse set clues[clueIndex].cells for across and down
// clues.
function setClueMemberships() {
  // Set across clue memberships
  for (let i = 0; i < gridHeight; i++) {
    let clueLabel = ''
    for (let j = 0; j < gridWidth; j++) {
      let gridCell = grid[i][j]
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
      if (!gridCell.startsAcrossClue && j > 0 && grid[i][j - 1].hasBarAfter) {
        clueLabel = '';
        continue
      }
      gridCell.acrossClueLabel = clueLabel
      let clueIndex = 'A' + clueLabel
      if (!clues[clueIndex]) {
        throwErr('Somehow did not find clues table entry for ' + clueIndex)
      }
      clues[clueIndex].cells.push([i, j])
    }
  }
  // Set down clue memberships
  for (let j = 0; j < gridWidth; j++) {
    let clueLabel = ''
    for (let i = 0; i < gridHeight; i++) {
      let gridCell = grid[i][j]
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
      if (!gridCell.startsDownClue && i > 0 && grid[i - 1][j].hasBarUnder) {
        clueLabel = '';
        continue
      }
      gridCell.downClueLabel = clueLabel
      let clueIndex = 'D' + clueLabel
      if (!clues[clueIndex]) {
        throwErr('Somehow did not find clues table entry for ' + clueIndex)
      }
      clues[clueIndex].cells.push([i, j])
    }
  }
}

// For clues that have "child" clues (indicated like, '2, 13, 14' for parent 2,
// child 13, child 14), save the parent-child relationships, and successor grid
// cells for last cells in component clues, and spilled-over hyphenAfter and
// wordEndAfter locations.
function processClueChildren() {
  for (let clueIndex of allClueIndices) {
    let clue = clues[clueIndex]
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
        if (!clues[childIndex]) {
          for (let otherDir of allDirections) {
            if (otherDir == clue.dir) {
              continue;
            }
            childIndex = otherDir + child.label
            if (clues[childIndex]) {
              break
            }
          }
        }
        if (child.dir) {
          childIndex = child.dir + child.label
        }
      } else {
        if (!offNumClueIndices[child.label] ||
            offNumClueIndices[child.label].length < 1) {
          throwErr('non-num child label ' + child.label + ' was not seen')
        }
        childIndex = offNumClueIndices[child.label][0]
      }
      if (!clues[childIndex] || childIndex == clueIndex) {
        throwErr('Invalid child ' + childIndex + ' in ' +
                 clue.cluelabel + clue.dir);
      }
      if (dupes[childIndex]) {
        throwErr('Duplicate child ' + childIndex + ' in ' +
                 clue.cluelabel + clue.dir);
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
      let childClue = clues[childIndex]
      childClue.parentClueIndex = clueIndex

      if (lastRowCol && childClue.cells.length > 0) {
        let cell = childClue.cells[0]
        let childDir = childClue.dir
        if (lastRowCol[0] == cell[0] && lastRowCol[1] == cell[1]) {
          if (childDir == lastRowColDir || childClue.cells.length == 1) {
            throwErr('loop in successor for ' + lastRowCol)
          }
          cell = childClue.cells[1]  // Advance to the next cell.
        }
        grid[lastRowCol[0]][lastRowCol[1]]['succ' + lastRowColDir] = {
          'cell': cell,
          'dir': childDir
        };
        grid[cell[0]][cell[1]]['pred' + childDir] = {
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
    if (hasDiagramlessCells) {
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
      let childLen = clues[childIndex].cells.length
      while (wordEndIndex < clue.wordEndAfter.length &&
             clue.wordEndAfter[wordEndIndex] < prevLen + childLen) {
        let pos = clue.wordEndAfter[wordEndIndex] - prevLen
        clues[childIndex].wordEndAfter.push(pos)
        wordEndIndex++
      }
      while (hyphenIndex < clue.hyphenAfter.length &&
             clue.hyphenAfter[hyphenIndex] < prevLen + childLen) {
        let pos = clue.hyphenAfter[hyphenIndex] - prevLen
        clues[childIndex].hyphenAfter.push(pos)
        hyphenIndex++
      }
      prevLen = prevLen + childLen
    }
  }
}

function roughlyStartsWith(s, prefix) {
  const punct = /[\s'.,-]*/gi
  let normS = s.trim().replace(/<[^>]*>/gi, '').replace(punct, '').trim().toUpperCase();
  let normP = prefix.trim().replace(punct, '').trim().toUpperCase();
  return normS.startsWith(normP);
}

// Copy clue solutions to annos if warranted.
// Place a trailing period and space at the end of clue full display labels that
// end in letter/digit. Wrap in a clickable span if all cells are not known.
function finalClueTweaks() {
  for (let clueIndex of allClueIndices) {
    let theClue = clues[clueIndex]
    setClueSolution(clueIndex)
    if (addSolutionToAnno && theClue.solution && !isOrphan(clueIndex) &&
        !roughlyStartsWith(theClue.anno, theClue.solution)) {
      // For orphans, we reveal in their placeholder blanks.
      theClue.anno = '<span class="solution">' + theClue.solution +
                     '</span>. ' + theClue.anno;
    }
    if (theClue.anno) {
      hasReveals = true
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
    if (!allCellsKnown(clueIndex)) {
      theClue.fullDisplayLabel = '<span class="clickable">' +
          '<span id="current-clue-label" ' +
          ' title="' + MARK_CLUE_TOOLTIP +
          '" onclick="toggleClueSolvedState(\'' + clueIndex + '\')">' +
          label + '</span></span>';
    } else {
      theClue.fullDisplayLabel = '<span id="current-clue-label">' +
          label + '</span>';
    }
  }
}

// Using hyphenAfter[] and wordEndAfter[] in clues, set
// {hyphen,wordEnd}{ToRight,Below} in grid[i][j]s.
function setGridWordEndsAndHyphens() {
  if (hasDiagramlessCells) {
    // Give up on this
    return
  }
  // Going across
  for (let i = 0; i < gridHeight; i++) {
    let clueLabel = ''
    let clueIndex = ''
    let positionInClue = -1
    for (let j = 0; j < gridWidth; j++) {
      let gridCell = grid[i][j]
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
        if (!clues[clueIndex]) {
          if (!offNumClueIndices[clueLabel]) {
            clueLabel = ''
            clueIndex = ''
            positionInClue = -1
            continue
          }
          for (ci of offNumClueIndices[clueLabel]) {
            if (ci.charAt(0) == 'A' || ci.charAt(0) == 'X') {
              clueIndex = ci
              break
            }
          }
        }
        if (!clues[clueIndex] || !clues[clueIndex].clue) {
          clueLabel = ''
          clueIndex = ''
          positionInClue = -1
          continue
        }
      }
      for (let wordEndPos of clues[clueIndex].wordEndAfter) {
        if (positionInClue == wordEndPos) {
          gridCell.wordEndToRight = true
          break
        }
      }
      for (let hyphenPos of clues[clueIndex].hyphenAfter) {
        if (positionInClue == hyphenPos) {
          gridCell.hyphenToRight = true
          break
        }
      }
    }
  }
  // Going down
  for (let j = 0; j < gridWidth; j++) {
    let clueLabel = ''
    let clueIndex = ''
    let positionInClue = -1
    for (let i = 0; i < gridHeight; i++) {
      let gridCell = grid[i][j]
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
        if (!clues[clueIndex]) {
          if (!offNumClueIndices[clueLabel]) {
            clueLabel = ''
            clueIndex = ''
            positionInClue = -1
            continue
          }
          for (ci of offNumClueIndices[clueLabel]) {
            if (ci.charAt(0) == 'D' || ci.charAt(0) == 'X') {
              clueIndex = ci
              break
            }
          }
        }
        if (!clues[clueIndex] || !clues[clueIndex].clue) {
          clueLabel = ''
          clueIndex = ''
          positionInClue = -1
          continue
        }
      }
      for (let wordEndPos of clues[clueIndex].wordEndAfter) {
        if (positionInClue == wordEndPos) {
          gridCell.wordEndBelow = true
          break
        }
      }
      for (let hyphenPos of clues[clueIndex].hyphenAfter) {
        if (positionInClue == hyphenPos) {
          gridCell.hyphenBelow = true
          break
        }
      }
    }
  }
}

function cmpGnavSpans(s1, s2) {
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

function extendsDiagramlessA(row, col) {
  let gridCell = grid[row][col]
  if (gridCell.isDiagramless) {
    return true
  }
  if (col > 0 && gridCell.isLight && !gridCell.acrossClueLabel) {
    return extendsDiagramlessA(row, col - 1)
  }
  return false
}
function extendsDiagramlessD(row, col) {
  let gridCell = grid[row][col]
  if (gridCell.isDiagramless) {
    return true
  }
  if (row > 0 && gridCell.isLight && !gridCell.downClueLabel) {
    return extendsDiagramlessD(row - 1, col)
  }
  return false
}

function setUpGnav() {
  let gnavSpans = []
  for (let ci in clues) {
    if (!clues.hasOwnProperty(ci)) {
      continue
    }
    if (!clues[ci].cells || clues[ci].cells.length == 0) {
      continue
    }
    let dir = (ci.charAt(0) == 'X') ? ci : ci.charAt(0)
    gnavSpans.push({
      'cells': clues[ci].cells,
      'dir': dir,
    })
  }
  // The following two loops add diagramless cells to gnav, and also set
  // up advancing typing across/down consecutive diagramless cells.
  for (let i = 0; i < gridHeight; i++) {
    let lastDiagramless = null
    for (let j = 0; j < gridWidth; j++) {
      if (extendsDiagramlessA(i, j)) {
        gnavSpans.push({
          'cells': [[i,j]],
          'dir': 'A',
        })
        if (lastDiagramless) {
          let lr = lastDiagramless[0]
          let lc = lastDiagramless[1]
          grid[lr][lc].succA = { 'cell': [i, j], 'dir': 'A'}
          grid[i][j].predA = { 'cell': [lr, lc], 'dir': 'A'}
        }
        lastDiagramless = [i, j]
      } else {
        lastDiagramless = null
      }
    }
  }
  for (let j = 0; j < gridWidth; j++) {
    let lastDiagramless = null
    for (let i = 0; i < gridHeight; i++) {
      if (extendsDiagramlessD(i, j)) {
        gnavSpans.push({
          'cells': [[i,j]],
          'dir': 'D',
        })
        if (lastDiagramless) {
          let lr = lastDiagramless[0]
          let lc = lastDiagramless[1]
          grid[lr][lc].succD = { 'cell': [i, j], 'dir': 'D'}
          grid[i][j].predD = { 'cell': [lr, lc], 'dir': 'D'}
        }
        lastDiagramless = [i, j]
      } else {
        lastDiagramless = null
      }
    }
  }
  gnavSpans.sort(cmpGnavSpans)

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
      grid[cell[0]][cell[1]]['next' + gnavSpans[idx].dir] = {
        'cell': gnavSpans[next].cells[0],
        'dir': gnavSpans[next].dir,
      }
      grid[cell[0]][cell[1]]['prev' + gnavSpans[idx].dir] = {
        'cell': gnavSpans[prev].cells[0],
        'dir': gnavSpans[prev].dir,
      }
    }
  }
}

function applyColorScheme() {
  let root = document.documentElement
  for (let c in colorScheme) {
    root.style.setProperty('--col-' + c, colorScheme[c])
  }
  let gridBackground = colorScheme['background']
}

function stripLineBreaks(s) {
  s = s.replace(/<br\s*\/?>/gi, " / ")
  return s.replace(/<\/br\s*>/gi, "")
}

function displayClues() {
  // Populate clues tables. Check that we have all clues
  let table = null
  let dir = ''
  for (let clueIndex of allClueIndices) {
    if (!clues[clueIndex].clue && !clues[clueIndex].parentClueIndex) {
      throwErr('Found no clue text nor a parent clue for ' + clueIndex)
    }
    let clueDir = clues[clueIndex].clueTableDir ||
                  clues[clueIndex].dir
    if (dir != clueDir) {
      if (clueDir == 'A') {
        table = acrossClues
        hasAcrossClues = true
      } else if (clueDir == 'D') {
        table = downClues
        hasDownClues = true
      } else if (clueDir == 'X') {
        table = nodirClues
        hasNodirClues = true
      } else {
        throwErr('Unexpected clue direction ' + clueDir + ' in ' + clueIndex)
      }
      dir = clueDir
    }
    if (clues[clueIndex].startNewTable) {
      let newPanel = document.createElement('div')
      newPanel.setAttributeNS(null, 'class', 'clues-box');
      newPanel.appendChild(document.createElement('hr'))
      let newTable = document.createElement('table')
      newPanel.appendChild(newTable)
      newPanel.appendChild(document.createElement('br'))

      let tableParent = table.parentElement
      tableParent.parentElement.insertBefore(newPanel, tableParent.nextSibling)
      table = newTable
    }
    if (clues[clueIndex].filler) {
      let tr = document.createElement('tr')
      let col = document.createElement('td')
      col.setAttributeNS(null, 'colspan', '2');
      col.setAttributeNS(null, 'class', 'filler');
      col.innerHTML = clues[clueIndex].filler
      tr.appendChild(col)
      table.appendChild(tr)
    }
    let tr = document.createElement('tr')
    let col1 = document.createElement('td')
    col1.innerHTML = clues[clueIndex].displayLabel

    let col1Chars = clues[clueIndex].displayLabel.replace(/&[^;]*;/g, '#')
    let col1NumChars = [...col1Chars].length
    if (col1Chars.substr(1, 1) == ',') {
      // Linked clue that begins with a single-letter/digit clue number. Indent!
      col1.style.textIndent =
        caseCheck(col1Chars.substr(0, 1)) ? '0.55ch' : '1ch'
      col1Chars = '0' + col1Chars
      col1NumChars++
    }
    if (!allCellsKnown(clueIndex)) {
      col1.setAttributeNS(null, 'class', 'clickable')
      col1.setAttributeNS(null, 'title', MARK_CLUE_TOOLTIP)
      col1.addEventListener('click', getClueStateToggler(clueIndex));
    }
    let col2 = document.createElement('td')
    col2.innerHTML = clues[clueIndex].clue
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

    if (isOrphan(clueIndex) && !clues[clueIndex].parentClueIndex) {
      let placeholder = ''
      let len = DEFAULT_ORPHAN_LEN
      if (clues[clueIndex].placeholder) {
        placeholder = clues[clueIndex].placeholder
        len = placeholder.length
      }
      addOrphanEntryUI(col2, false, len, placeholder, clueIndex)
      clues[clueIndex].orphanPlaceholder =
        col2.lastElementChild.firstElementChild;
      answersList.push({
        'input': clues[clueIndex].orphanPlaceholder,
        'isq': false,
      });
    }
    // If clue contains <br> tags, replace them with "/" for future renderings
    // in the "current clue" strip.
    if (clues[clueIndex].clue.indexOf('<') >= 0) {
      clues[clueIndex].clue = stripLineBreaks(clues[clueIndex].clue)
    }
    if (clues[clueIndex].anno) {
      let anno = document.createElement('span')
      anno.setAttributeNS(null, 'class', 'anno-text');
      anno.innerHTML = ' ' + clues[clueIndex].anno
      anno.style.display = 'none'
      revelationList.push(anno)
      col2.appendChild(anno)
      clues[clueIndex].annoSpan = anno
    }
    tr.appendChild(col1)
    tr.appendChild(col2)
    tr.addEventListener('click', getClueActivator(clueIndex));
    clues[clueIndex].clueTR = tr
    table.appendChild(tr)
  }
  if (cluesPanelLines > 0) {
    const ems = 1.40 * cluesPanelLines
    const emsStyle = '' + ems + 'em'
    acrossPanel.style.height = emsStyle
    downPanel.style.height = emsStyle
    if (nodirPanel) {
      nodirPanel.style.height = emsStyle
    }
  }
  if (hasAcrossClues) {
    acrossPanel.style.display = ''
  }
  if (hasDownClues) {
    downPanel.style.display = ''
  }
  if (hasNodirClues) {
    nodirPanel.style.display = ''
  }
}

// Needs to be called early, for correct sizing.
function setTextAreaCols() {
  const viewportDim = Math.min(getViewportWidth(), getViewportHeight())
  textAreaCols = Math.min(65, Math.max(30, Math.floor((viewportDim - 8) / 8)))
}

function computeGridSize() {
  const viewportDim = Math.min(getViewportWidth(), getViewportHeight())
  SQUARE_DIM = 31
  if (gridWidth <= 30 &&  // For jumbo grids, give up.
      (SQUARE_DIM + GRIDLINE) * gridWidth + GRIDLINE > viewportDim - 8) {
    SQUARE_DIM = Math.max(20,
      Math.floor((viewportDim - 8 - GRIDLINE) / gridWidth) - GRIDLINE)
  }
  SQUARE_DIM_BY2 = Math.floor((SQUARE_DIM + 1) / 2)
  NUMBER_START_Y = Math.floor(SQUARE_DIM / 3)
  LIGHT_START_X = 1.0 + SQUARE_DIM / 2.0
  LIGHT_START_Y = 1.925 + Math.floor((2 * SQUARE_DIM) / 3)
  HYPHEN_WIDTH = Math.max(7, Math.floor(SQUARE_DIM / 3) - 1)
  HYPHEN_WIDTH_BY2 = Math.floor((HYPHEN_WIDTH + 1) / 2)
  CIRCLE_RADIUS = 0.0 + SQUARE_DIM / 2.0
  boxWidth = (SQUARE_DIM * gridWidth) + ((gridWidth + 1) * GRIDLINE)
  boxHeight = (SQUARE_DIM * gridHeight) + ((gridHeight + 1) * GRIDLINE)
  let letterSize = Math.max(10, SQUARE_DIM_BY2)
  let numberSize = Math.max(7, Math.floor(SQUARE_DIM / 3) - 1)
  let arrowSize = Math.max(8, Math.floor(13 * SQUARE_DIM / 31))
  let root = document.documentElement
  root.style.setProperty('--sz-letter', letterSize + 'px')
  root.style.setProperty('--sz-number', numberSize + 'px')
  root.style.setProperty('--sz-arrow', arrowSize + 'px')
}

function displayGridBackground() {
  let svgWidth = boxWidth + (2 * offsetLeft)
  let svgHeight = boxHeight + (2 * offsetTop)
  svg.setAttributeNS(null, 'viewBox', '0 0 ' + svgWidth + ' ' + svgHeight)
  svg.setAttributeNS(null, 'width', svgWidth);
  svg.setAttributeNS(null, 'height', svgHeight);

  background.setAttributeNS(null, 'x', offsetLeft);
  background.setAttributeNS(null, 'y', offsetTop);
  background.setAttributeNS(null, 'width', boxWidth);
  background.setAttributeNS(null, 'height', boxHeight);
  background.setAttributeNS(null, 'fill', colorScheme['background']);
  svg.appendChild(background);
}

// Return a string encoding the current entries in the whole grid and
// also set the number of squares that have been filled.
function getGridStateAndNumFilled() {
  let state = '';
  let numFilled = 0
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      if (grid[i][j].notBlocked()) {
        if (langMaxCharCodes == 1) {
          state = state + grid[i][j].currentLetter
        } else {
          state = state + grid[i][j].currentLetter + '$'
        }
        if (grid[i][j].currentLetter != '0') {
          numFilled++
        }
      } else {
        state = state + '.'
      }
    }
  }
  numCellsFilled = numFilled
  return state;
}

// Update status, ensure answer fields are upper-case (when they have
// an enum), disable buttons as needed, and return the state.
function updateDisplayAndGetState() {
  let state = getGridStateAndNumFilled();
  statusNumFilled.innerHTML = numCellsFilled
  let ci = currentClueIndex
  if (clues[ci] && clues[ci].parentClueIndex) {
    ci = clues[ci].parentClueIndex
  }
  let revOrphan = isOrphanWithReveals(ci)
  checkButton.disabled = (activeCells.length == 0) && !revOrphan
  let theClue = clues[ci]
  let haveReveals = (activeCells.length > 0 && !hasUnsolvedCells) ||
    (theClue && (theClue.anno || theClue.solution || revOrphan));
  if (!haveReveals && numCellsToOrphan > 0 && activeCells.length > 0) {
    let orphanClue = cellsToOrphan[JSON.stringify(activeCells)];
    if (orphanClue) {
      let oc = clues[orphanClue]
      haveReveals =
        oc && (oc.anno || oc.solution || isOrphanWithReveals(orphanClue));
    }
  }
  revealButton.disabled = !haveReveals;
  clearButton.disabled = revealButton.disabled && activeCells.length == 0;
  return state
}

// Call updateDisplayAndGetState() and save state in cookie and location.hash.
function updateAndSaveState() {
  let state = updateDisplayAndGetState()
  for (let a of answersList) {
    state = state + STATE_SEP + a.input.value
  }

  // Keep cookie for these many days
  const KEEP_FOR_DAYS = 90

  let d = new Date();
  d.setTime(d.getTime() + (KEEP_FOR_DAYS * 24 * 60 * 60 * 1000));
  let expires = 'expires=' + d.toUTCString();
  document.cookie = puzzleId + '=' + state +
                    '; samesite=none; secure; ' + expires + ';path=/';

  if (savingURL) {
    // Also save the state in location.hash.
    location.hash = '#' + state
    savingURL.href = location.href
  }
}

function resetState() {
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      let gridCell = grid[i][j]
      if (gridCell.notBlocked()) {
        if (gridCell.prefill) {
          gridCell.currentLetter = gridCell.solution
        } else {
          gridCell.currentLetter = '0'
        }
        gridCell.textNode.nodeValue =
            stateCharToDisplayChar(gridCell.currentLetter)
      }
    }
  }
}

// Returns true upon success.
function parseState(state) {
  let parsedState = []
  state = state.trim()
  if (!state) { 
    return false
  }
  let index = 0
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      if (index >= state.length) {
        console.log('Not enough characters in saved state')
        return false
      }
      let letter = ''
      letter = state.charAt(index++)
      if (langMaxCharCodes > 1 && letter != '.') {
        let dollar = state.indexOf('$', index)
        if (dollar < 0) {
          console.log('Missing compound-char separator in saved state')
          return false
        }
        letter = letter + state.substring(index, dollar)
        index = dollar + 1
      }
      let gridCell = grid[i][j]
      if (gridCell.notBlocked()) {
        if (gridCell.prefill) {
          parsedState.push(gridCell.solution)
          continue
        }
        if (letter == '1') {
           if (!gridCell.isDiagramless) {
             console.log('Unexpected ⬛ in non-diagramless location');
             return false
           }
           parsedState.push('1')
        } else {
           if (!isValidStateChar(letter)) {
             console.log('Unexpected letter/digit ' + letter +
                         ' in state: ' + state);
             return false
           }
           parsedState.push(letter)
        }
      } else {
        if (letter != '.') {
          console.log('Unexpected letter ' + letter +
                      ' in state, expected .: ' + state);
          return false
        }
      }
    }
  }
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      let gridCell = grid[i][j]
      if (gridCell.notBlocked()) {
        console.assert(parsedState.length > 0, parsedState)
        gridCell.currentLetter = parsedState.shift();
        gridCell.textNode.nodeValue =
            stateCharToDisplayChar(gridCell.currentLetter)
      }
    }
  }
  console.assert(parsedState.length == 0, parsedState)

  state = state.replace(new RegExp(OLD_STATE_SEP, 'g'), STATE_SEP);
  // Also try to recover answers to questions and orphan-fills.
  if (state.substr(index, STATE_SEP.length) == STATE_SEP) {
    let parts = state.substr(index + STATE_SEP.length).split(STATE_SEP)
    if (parts.length == answersList.length) {
      for (let i = 0; i < parts.length; i++) {
        answersList[i].input.value = parts[i]
      }
    }
  }
  return true
}

// Restore state from cookie (or location.hash).
function restoreState() {
  resetState();
  let foundState = false
  try {
    foundState = parseState(decodeURIComponent(location.hash.substr(1)))
  } catch (e) { 
    foundState = false
  }
  if (foundState) {
    console.log('Found saved state in url')
  } else {
    let name = puzzleId + '=';
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        foundState = parseState(c.substring(name.length, c.length));
        if (foundState) {
          console.log('Found saved state in cookie')
        }
        break
      }
    }
  }
  if (!foundState) {
    console.log('No saved state available')
  }
  for (let ci of allClueIndices) {
    // When restoring state, we reveal annos for fully prefilled entries.
    updateClueState(ci, true, null)
  }
  updateAndSaveState()
}

function deactivateCurrentCell() {
  gridInputWrapper.style.display = 'none'
  for (let x of activeCells) {
    let gridCell = grid[x[0]][x[1]]
    let cellRect = gridCell.cellRect
    if (gridCell.colour) {
      cellRect.style.fill = gridCell.colour
    } else {
      cellRect.style.fill = colorScheme['cell']
    }
    if (!gridCell.prefill) {
      gridCell.cellText.style.fill = colorScheme['light-text']
    }
    if (gridCell.cellNum) {
      gridCell.cellNum.style.fill = colorScheme['light-label']
    }
    if (gridCell.cellCircle) {
      gridCell.cellCircle.style.stroke = colorScheme['circle']
    }
  }
  activeCells = [];
}

function deactivateCurrentClue() {
  for (let x of activeClues) {
    x.style.background = 'inherit'
  }
  activeClues = [];
  currentClueIndex = null
  currClue.innerHTML = ''
  currClue.style.background = 'transparent'
  currClue.style.top = '0'
  clearButton.disabled = true
  checkButton.disabled = true
  revealButton.disabled = true
}


function makeCurrentClueVisible() {
  // Check if grid input is visible.
  const inputPos = gridInput.getBoundingClientRect();
  if (inputPos.top < 0) {
    return
  }
  let windowH = getViewportHeight()
  if (!windowH || windowH <= 0) {
    return
  }
  const bPos = outermost.getBoundingClientRect();
  const gpPos = gridPanel.getBoundingClientRect();
  const cluePos = currClue.getBoundingClientRect();
  const clueParentPos = currClueParent.getBoundingClientRect();

  currClue.style.left = (gpPos.left - bPos.left) + 'px';

  let normalTop = 0;
  const clearance = 4;
  if (gpPos.top - clueParentPos.top < cluePos.height + clearance) {
    normalTop = (gpPos.top - clueParentPos.top) - (cluePos.height + clearance);
  }

  if (inputPos.bottom >= windowH) {
    currClue.style.top = normalTop + 'px';
    return
  }
  // gridInput is visible
  const top = cluePos.top
  const parentTop = clueParentPos.top
  // Reposition
  let newTop = 0
  if (parentTop >= 0) {
    // Parent is below viewport top: use normal positioning.
    currClue.style.top = normalTop + 'px';
    return
  }
  let adjustment = cluePos.height + clearance - inputPos.top;
  if (adjustment < 0) {
    adjustment = 0;
  }
  currClue.style.top = (0 - parentTop - adjustment) + 'px';
}

function gnavToInner(cell, dir) {
  currentRow = cell[0]
  currentCol = cell[1]
  currentDir = dir
  if (currentRow < 0 || currentRow >= gridHeight ||
      currentCol < 0 || currentCol >= gridWidth) {
    return null
  }
  let gridCell = grid[currentRow][currentCol]
  if (!gridCell.isLight && !gridCell.isDiagramless) {
    return null
  }

  gridInputWrapper.style.width = '' + SQUARE_DIM + 'px'
  gridInputWrapper.style.height = '' + (SQUARE_DIM - 2) + 'px'
  gridInputWrapper.style.left = '' + gridCell.cellLeft + 'px'
  gridInputWrapper.style.top = '' + gridCell.cellTop + 'px'
  gridInput.value = gridCell.prefill ? '' :
      stateCharToDisplayChar(gridCell.currentLetter)
  gridInputRarrow.style.display = 'none'
  gridInputDarrow.style.display = 'none'
  gridInputWrapper.style.display = ''
  gridInput.focus()
  // Try to place the cursor at the end
  if (gridInput.setSelectionRange) {
    let len = gridInput.value.length
    gridInput.setSelectionRange(len, len);
  }

  let activeClueIndex = ''
  let activeClueLabel = ''
  // If the current direction does not have an active clue, toggle direction
  if (currentDir == 'A' && !gridCell.isDiagramless &&
      !gridCell.acrossClueLabel &&
      !extendsDiagramlessA(currentRow, currentCol)) {
    toggleCurrentDir()
  } else if (currentDir == 'D' && !gridCell.isDiagramless &&
             !gridCell.downClueLabel &&
             !extendsDiagramlessD(currentRow, currentCol)) {
    toggleCurrentDir()
  } else if (currentDir.charAt(0) == 'X' &&
             (!gridCell.nodirClues ||
              !gridCell.nodirClues.includes(currentDir))) {
    toggleCurrentDir()
  }
  if (currentDir == 'A') {
    if (gridCell.acrossClueLabel) {
      activeClueLabel = gridCell.acrossClueLabel
      activeClueIndex = 'A' + activeClueLabel
    }
    gridInputRarrow.style.display = ''
  } else if (currentDir == 'D') {
    if (gridCell.downClueLabel) {
      activeClueLabel = gridCell.downClueLabel
      activeClueIndex = 'D' + activeClueLabel
    }
    gridInputDarrow.style.display = ''
  } else {
    // currentDir is actually a clueindex (for an X clue)
    activeClueIndex = currentDir
    activeClueLabel = currentDir.substr(1)
  }
  if (activeClueIndex != '') {
    if (!clues[activeClueIndex]) {
      activeClueIndex = ''
      if (offNumClueIndices[activeClueLabel]) {
        for (let ci of offNumClueIndices[activeClueLabel]) {
          if (ci.charAt(0) == 'X' ||
              ci.charAt(0) == activeClueIndex.charAt(0)) {
            activeClueIndex = ci
            break
          }
        }
      }
      if (!clues[activeClueIndex]) {
        activeClueIndex = ''
      }
    }
  }
  clearButton.disabled = false
  checkButton.disabled = false
  revealButton.disabled = hasUnsolvedCells

  if (activeClueIndex && clues[activeClueIndex]) {
    let clueIndices = getAllLinkedClueIndices(activeClueIndex)
    let parentIndex = clueIndices[0]
    for (let clueIndex of clueIndices) {
      for (let rowcol of clues[clueIndex].cells) {
        grid[rowcol[0]][rowcol[1]].cellRect.style.fill = colorScheme['active']
        activeCells.push(rowcol)
      }
    }
  } else {
    // No active clue, activate the last orphan clue.
    activeCells.push([currentRow, currentCol])
    activeClueIndex = lastOrphan
  }
  gridCell.cellRect.style.fill = colorScheme['input']
  if (!gridCell.prefill) {
    gridCell.cellText.style.fill = colorScheme['light-text-input']
  }
  if (gridCell.cellNum) {
    gridCell.cellNum.style.fill = colorScheme['light-label-input']
  }
  if (gridCell.cellCircle) {
    gridCell.cellCircle.style.stroke = colorScheme['circle-input']
  }
  return activeClueIndex
}

function activateCell(row, col) {
  deactivateCurrentCell();
  let clue = gnavToInner([row, col], currentDir)
  if (clue) {
    deactivateCurrentClue();
    cnavToInner(clue)
  }
  updateAndSaveState()
}

// For freezing row/col to deal with JS closure.
function getRowColActivator(row, col) {
  return function() {
    usingGnav = true
    activateCell(row, col);
  };
}
function getClueActivator(ci) {
  return function() {
    usingGnav = false
    cnavTo(ci);
  };
}

function getViewportHeight() {
  return window.innerHeight && document.documentElement.clientHeight ? 
    Math.min(window.innerHeight, document.documentElement.clientHeight) : 
    window.innerHeight || 
    document.documentElement.clientHeight || 
    document.getElementsByTagName('body')[0].clientHeight;
}

function getViewportWidth() {
  return window.innerWidth && document.documentElement.clientWidth ? 
    Math.min(window.innerWidth, document.documentElement.clientWidth) : 
    window.innerWidth || 
    document.documentElement.clientWidth || 
    document.getElementsByTagName('body')[0].clientWidth;
}

// Check if an element is visible, vertically.
function isVisible(elt) {
  const pos = elt.getBoundingClientRect();
  if (pos.bottom < 0) {
    return false
  }
  let windowH = getViewportHeight()
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
function getAllLinkedClueIndices(clueIndex) {
  let clueIndices = [clueIndex]
  if (clues[clueIndex]) {
    if (clues[clueIndex].parentClueIndex) {
      let parent = clues[clueIndex].parentClueIndex
      clueIndices = [parent].concat(clues[parent].childrenClueIndices)
    } else if (clues[clueIndex].childrenClueIndices) {
      clueIndices =
          clueIndices.concat(clues[clueIndex].childrenClueIndices)
    }
  }
  return clueIndices
}

// get HTML for back/forth buttons in current-clue.
function getCurrentClueButtons() {
  let lfunc = "cnavPrev()"
  let lfuncTip = "Previous clue"
  let rfunc = "cnavNext()"
  let rfuncTip = "Next clue"
  return '<span>' +
    '<button class="small-button" ' +
    'title="' + lfuncTip + '" onclick="' + lfunc + '">' +
    '&lsaquo;</button>&nbsp;' +
    '<button class="small-button" ' +
    'title="' + rfuncTip + '" onclick="' + rfunc + '">' +
    '&rsaquo;</button></span> ';
}

function cnavNext() {
  if (!currentClueIndex || !clues[currentClueIndex] ||
      !clues[currentClueIndex].next) {
    return
  }
  let next = clues[currentClueIndex].next
  if (gnavIsClueless()) {
    let jumps = 0
    while (jumps < allClueIndices.length && !isOrphan(next)) {
      jumps++
      next = clues[next].next
    }
  }
  cnavTo(next)
  if (usingGnav) {
    gridInput.focus()
  }
}
function cnavPrev() {
  if (!currentClueIndex || !clues[currentClueIndex] ||
      !clues[currentClueIndex].prev) {
    return
  }
  let prev = clues[currentClueIndex].prev
  if (gnavIsClueless()) {
    let jumps = 0
    while (jumps < allClueIndices.length && !isOrphan(prev)) {
      jumps++
      prev = clues[prev].prev
    }
  }
  cnavTo(prev)
  if (usingGnav) {
    gridInput.focus()
  }
}

// Select a clicked clue.
function cnavToInner(activeClueIndex, grabFocus = false) {
  let clueIndices = getAllLinkedClueIndices(activeClueIndex)
  let parentIndex = clueIndices[0]
  let gnav = null
  let clueAtActive = clues[activeClueIndex]
  if (clueAtActive && clueAtActive.cells && clueAtActive.cells.length > 0) {
    let dir = (activeClueIndex.charAt(0) == 'X') ? activeClueIndex :
              activeClueIndex.charAt(0)
    gnav = [clueAtActive.cells[0][0], clueAtActive.cells[0][1], dir]
  }
  curr = clues[parentIndex]
  if (!curr || !curr.clue) {
    activeClueIndex = lastOrphan
    parentIndex = lastOrphan
    curr = clues[parentIndex]
    if (!curr || !curr.clue) {
      return null
    }
    clueIndices = getAllLinkedClueIndices(parentIndex)
  }
  let orphan = isOrphan(parentIndex)
  if (orphan) {
    lastOrphan = parentIndex
  }
  let colour = orphan ? colorScheme['orphan'] : colorScheme['active'];
  for (let clueIndex of clueIndices) {
    let theClue = clues[clueIndex]
    if (theClue.anno || (orphan && theClue.cellsOfOrphan)) {
      revealButton.disabled = false
    }
    if (!theClue.clueTR) {
      continue
    }
    theClue.clueTR.style.background = colour
    if (grabFocus && cluesPanelLines > 0 &&
        isVisible(theClue.clueTR.parentElement)) {
      theClue.clueTR.scrollIntoView()
      gridInput.scrollIntoView()  // Else we may move away from the cell!
    }
    activeClues.push(theClue.clueTR)
  }
  currentClueIndex = activeClueIndex
  currClue.innerHTML = getCurrentClueButtons() +
    curr.fullDisplayLabel + curr.clue
  if (orphan) {
    let placeholder = ''
    let len = DEFAULT_ORPHAN_LEN
    if (clues[parentIndex].placeholder) {
      placeholder = clues[parentIndex].placeholder
      len = placeholder.length
    }
    addOrphanEntryUI(currClue, true, len, placeholder, parentIndex)
    copyOrphanEntryToCurr(parentIndex)
    if (grabFocus && !usingGnav && clues[parentIndex].clueTR) {
      let plIns = clues[parentIndex].clueTR.getElementsByTagName('input')
      if (plIns && plIns.length > 0) {
        plIns[0].focus()
      }
    }
  }
  currClue.style.background = colour
  updateClueState(parentIndex, false, null)
  makeCurrentClueVisible();
  return gnav
}

// The current gnav position is diagramless or does not have a known
// clue in the current direction.
function gnavIsClueless() {
  if (currentRow < 0 || currentCol < 0) {
    return false
  }
  let gridCell = grid[currentRow][currentCol]
  return (gridCell.isDiagramless ||
     (currentDir == 'A' &&
      (!gridCell.acrossClueLabel ||
       !clues['A' + gridCell.acrossClueLabel] ||
       !clues['A' + gridCell.acrossClueLabel].clue)) ||
     (currentDir == 'D' &&
      (!gridCell.downClueLabel ||
       !clues['D' + gridCell.downClueLabel] ||
       !clues['D' + gridCell.downClueLabel].clue)) ||
     (currentDir.charAt(0) == 'X' &&
      (!gridCell.nodirClues ||
       !gridCell.nodirClues.includes(currentDir))));
}

function cnavTo(activeClueIndex) {
  deactivateCurrentClue();
  let cellDir = cnavToInner(activeClueIndex, true)
  if (cellDir) {
    deactivateCurrentCell();
    gnavToInner([cellDir[0], cellDir[1]], cellDir[2])
  } else {
    // If the currently active cells had a known clue association, deactivate.
    if (!gnavIsClueless()) {
      deactivateCurrentCell();
    }
  }
  updateAndSaveState()
}

function copyOrphanEntry(clueIndex) {
  if (hideCopyPlaceholders || activeCells.length < 1 ||
      !clueIndex || !clues[clueIndex] || !clues[clueIndex].clueTR) {
    return
  }
  let ips = clues[clueIndex].clueTR.getElementsByTagName('input')
  if (ips.length != 1) {
    return
  }
  let entry = ips[0].value
  let letters = ''
  for (let i = 0; i < entry.length; i++) {
    let letter = entry[i]
    if (!caseCheck(letter)) {
      if (!allowDigits || letter < '0' || letter > '9') {
        continue;
      }
    }
    letters = letters + letter
  }
  if (letters.length < 1) {
    return
  }
  if (letters.length != activeCells.length) {
    if (!confirm('Are you sure you want to partially copy from ' +
                  letters.length + ' letters into ' + activeCells.length +
                  ' squares?')) {
      return
    }
  }
  let index = 0
  let row = -1
  let col = -1
  for (let i = 0; i < letters.length; i++) {
    if (index >= activeCells.length) {
      break;
    }
    let x = activeCells[index++]
    row = x[0]
    col = x[1]
    let gridCell = grid[row][col]
    if (gridCell.prefill) {
      continue
    }
    let letter = letters[i]
    let oldLetter = gridCell.currentLetter
    if (oldLetter != letter) {
      gridCell.currentLetter = letter
      let revealedChar = stateCharToDisplayChar(letter)
      gridCell.textNode.nodeValue = revealedChar
      if (row == currentRow && col == currentCol) {
        gridInput.value = revealedChar
      }
    }
  }
  if (index < activeCells.length) {
    // Advance to the next square.
    let x = activeCells[index]
    row = x[0]
    col = x[1]
  }
  if (row >= 0 && col >= 0) {
    activateCell(row, col)
  }
  updateActiveCluesState()
  updateAndSaveState()
}

// inCurr is set to true when this is called oninput in the currClue strip
// and false when called oninput in the clues table.
function updateOrphanEntry(clueIndex, inCurr) {
  if (!clueIndex || !clues[clueIndex] || !clues[clueIndex].clueTR ||
      !isOrphan(clueIndex) || clues[clueIndex].parentClueIndex) {
    return
  }
  let clueInputs = clues[clueIndex].clueTR.getElementsByTagName('input')
  if (clueInputs.length != 1) {
    console.log('Missing placeholder input for clue ' + clueIndex)
    return
  }
  let theInput = clueInputs[0]
  if (!inCurr) {
    let cursor = theInput.selectionStart
    theInput.value = theInput.value.toUpperCase().trimLeft()
    theInput.selectionEnd = cursor
    updateAndSaveState()
  }
  let curr = document.getElementById(CURR_ORPHAN_ID)
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
    updateAndSaveState()
  } else {
    theCurrInput.value = theInput.value
  }
}

// Copy placeholder value from clue table to the newly created curr clue.
function copyOrphanEntryToCurr(clueIndex) {
  if (!clueIndex || !clues[clueIndex] || !clues[clueIndex].clueTR ||
      !isOrphan(clueIndex) || clues[clueIndex].parentClueIndex) {
    return
  }
  let clueInputs = clues[clueIndex].clueTR.getElementsByTagName('input')
  if (clueInputs.length != 1) {
    console.log('Missing placeholder input for clue ' + clueIndex)
    return
  }
  let curr = document.getElementById(CURR_ORPHAN_ID)
  if (!curr) {
    return
  }
  let currInputs = curr.getElementsByTagName('input')
  if (clueInputs.length != 1) {
    return
  }
  currInputs[0].value = clueInputs[0].value
}

function addOrphanEntryUI(elt, inCurr, len, placeholder, clueIndex) {
  let html = '<span'
  if (inCurr) {
    html = html + ' id="' + CURR_ORPHAN_ID + '"'
  }
  html = html + ' class="nobr">' +
    '<input size="' + len + '" class="incluefill" placeholder="' +
    placeholder.replace(/\?/g, '·') +
    '" type="text" ' +
    'oninput="updateOrphanEntry(\'' + clueIndex + '\', ' + inCurr + ')" ' +
    'title="You can record your solution here before copying to squares" ' +
    'autocomplete="off" spellcheck="off"></input>'
  if (!hideCopyPlaceholders) {
    html = html + '<button title="Copy into currently highlighted squares" ' +
      'class="small-button">&#8690;</button>'
  }
  html = html + '</span>'
  elt.insertAdjacentHTML('beforeend', html)
  if (!hideCopyPlaceholders) {
    elt.lastElementChild.lastElementChild.addEventListener(
      'click', function(e) {
      copyOrphanEntry(clueIndex);
      e.stopPropagation();});
  }
}

function toggleCurrentDir() {
  // toggle direction
  if (currentRow < 0 || currentRow >= gridHeight ||
      currentCol < 0 || currentCol >= gridWidth) {
    return
  }
  let choices = []
  let gridCell = grid[currentRow][currentCol]
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
  while (i < choices.length && currentDir != choices[i]) {
    i++;
  }
  if (i >= choices.length) {
    i = -1
  }
  let newDir = choices[(i + 1) % choices.length]
  if (currentDir == newDir) {
    return
  }
  currentDir = newDir
}

function toggleCurrentDirAndActivate() {
  usingGnav = true
  toggleCurrentDir()
  activateCell(currentRow, currentCol)
}

// Handle navigation keys. Used by a listener, and also used to auto-advance
// after a cell is filled. Returns false only if a tab input was actually used.
function handleKeyUpInner(key) {
  if (key == 9) {
    return false;  // tab is handled on key-down already, as 221/219.
  }
  if (key == 221) {
    // ] or tab
    if (usingGnav) {
      if (currentRow < 0 || currentCol < 0 || !currentDir) {
        return false
      }
      if (!grid[currentRow][currentCol]['next' + currentDir]) {
        return false
      }
      let gnav = grid[currentRow][currentCol]['next' + currentDir]
      currentDir = gnav.dir
      activateCell(gnav.cell[0], gnav.cell[1])
    } else {
      if (!currentClueIndex || !clues[currentClueIndex] ||
          !clues[currentClueIndex].next) {
        return false
      }
      cnavTo(clues[currentClueIndex].next)
    }
    return true
  } else if (key == 219) {
    // [ or shift-tab
    if (usingGnav) {
      if (currentRow < 0 || currentCol < 0 || !currentDir) {
        return false
      }
      if (!grid[currentRow][currentCol]['prev' + currentDir]) {
        return false
      }
      let gnav = grid[currentRow][currentCol]['prev' + currentDir]
      currentDir = gnav.dir
      activateCell(gnav.cell[0], gnav.cell[1])
    } else {
      if (!currentClueIndex || !clues[currentClueIndex] ||
          !clues[currentClueIndex].prev) {
        return false
      }
      cnavTo(clues[currentClueIndex].prev)
    }
    return true
  }
  if (currentRow < 0 || currentRow >= gridHeight ||
      currentCol < 0 || currentCol >= gridWidth) {
    return false
  }

  usingGnav = true
  if (key == 8) {
    if (grid[currentRow][currentCol].currentLetter != '0' &&
        !grid[currentRow][currentCol].prefill) {
      return true
    }
    // backspace in an empty or prefilled cell
    retreatCursorInLight();
    return true
  }
  if (key == 13) {
    // Enter
    toggleCurrentDirAndActivate()
  } else if (key == 39) {
    // right arrow
    let col = currentCol + 1
    while (col < gridWidth &&
           !grid[currentRow][col].isLight &&
           !grid[currentRow][col].isDiagramless) {
      col++;
    }
    if (col < gridWidth) {
      activateCell(currentRow, col);
    }
  } else if (key == 37) {
    // left arrow
    let col = currentCol - 1
    while (col >= 0 &&
           !grid[currentRow][col].isLight &&
           !grid[currentRow][col].isDiagramless) {
      col--;
    }
    if (col >= 0) {
      activateCell(currentRow, col);
    }
  } else if (key == 40) {
    // down arrow
    let row = currentRow + 1
    while (row < gridHeight &&
           !grid[row][currentCol].isLight &&
           !grid[row][currentCol].isDiagramless) {
      row++;
    }
    if (row < gridHeight) {
      activateCell(row, currentCol);
    }
  } else if (key == 38) {
    // up arrow
    let row = currentRow - 1
    while (row >= 0 &&
           !grid[row][currentCol].isLight &&
           !grid[row][currentCol].isDiagramless) {
      row--;
    }
    if (row >= 0) {
      activateCell(row, currentCol);
    }
  }
  return true
}

function handleKeyUp(e) {
  let key = e.which || e.keyCode
  handleKeyUpInner(key)
}

// For tab/shift-tab, we intercept KeyDown
function handleTabKeyDown(e) {
  let key = e.which || e.keyCode
  if (key == 9) {
    // tab. replace with [ or ]
    key = e.shiftKey ? 219 : 221
    if (handleKeyUpInner(key)) {
      // Tab input got used already.
      e.preventDefault()
    }
  }
}

function advanceCursor() {
  // First check if there is successor
  let successorProperty = 'succ' + currentDir
  if (grid[currentRow][currentCol][successorProperty]) {
    let successor = grid[currentRow][currentCol][successorProperty]
    currentDir = successor.dir
    activateCell(successor.cell[0], successor.cell[1]);
    return
  }
  if (grid[currentRow][currentCol].isDiagramless) {
    return
  }
  if (currentDir == 'A') {
    if (currentCol + 1 < gridWidth &&
        grid[currentRow][currentCol + 1].acrossClueLabel ==
            grid[currentRow][currentCol].acrossClueLabel) {
      handleKeyUpInner(39);
    }
  } else if (currentDir == 'D') {
    if (currentRow + 1 < gridHeight &&
        grid[currentRow + 1][currentCol].downClueLabel ==
            grid[currentRow][currentCol].downClueLabel) {
      handleKeyUpInner(40);
    }
  }
}

function retreatCursorInLight() {
  if (currentDir == 'A' && currentCol - 1 >= 0 &&
      grid[currentRow][currentCol - 1].acrossClueLabel ==
        grid[currentRow][currentCol].acrossClueLabel) {
    activateCell(currentRow, currentCol - 1);
    return
  } else if (currentDir == 'D' && currentRow - 1 >= 0 &&
             grid[currentRow - 1][currentCol].downClueLabel ==
               grid[currentRow][currentCol].downClueLabel) {
    activateCell(currentRow - 1, currentCol);
    return
  }
  let predProperty = 'pred' + currentDir
  if (!grid[currentRow][currentCol][predProperty]) {
    return
  }
  let pred = grid[currentRow][currentCol][predProperty]
  currentDir = pred.dir
  activateCell(pred.cell[0], pred.cell[1]);
}

function toggleClueSolvedState(clueIndex) {
  if (allCellsKnown(clueIndex)) {
    console.log('toggleClueSolvedState() called on ' + clueIndex +
                ' with all cells known')
    return
  }
  let clue = clues[clueIndex]
  if (!clue || !clue.clueTR) {
    return
  }
  let cls = clue.clueTR.className
  let currLab = null
  if (clueIndex == currentClueIndex) {
    currLab = document.getElementById('current-clue-label')
  }
  if (cls == 'solved') {
    clue.clueTR.className = ''
    if (currLab) {
      currLab.className = ''
    }
  } else {
    clue.clueTR.className = 'solved'
    if (currLab) {
      currLab.className = 'solved'
    }
  }
}
function getClueStateToggler(ci) {
  return function(e) {
    toggleClueSolvedState(ci)
    e.stopPropagation()
  };
}

// Mark the clue as solved by setting its number's colour, if filled.
// If annoPrefilled is true and the clue is fully prefilled, reveal its anno.
// forceSolved can be passed as null or 'solved' or 'unsolved'.
function updateClueState(clueIndex, annoPrefilled, forceSolved) {
  let cis = getAllLinkedClueIndices(clueIndex)
  if (!cis || cis.length == 0) {
    return
  }
  clueIndex = cis[0]  // Use parent for a linked child
  let clue = clues[clueIndex]
  if (!clue) {
    return
  }
  let solved = false
  if (clue && clue.clueTR && clue.clueTR.className == 'solved') {
    solved = true
  }
  let numFilled = 0
  let numPrefilled = 0
  for (let ci of cis) {
    let theClue = clues[ci]
    if (!theClue.clueTR) {
      numFilled = 0
      break
    }
    let isFullRet = isFull(ci)
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
      if (allCellsKnown(clueIndex) && numPrefilled == clue.enumLen) {
        solved = true
      }
    }
  } else if (clue.annoSpan && clue.annoSpan.style.display == '') {
    solved = true
  } else if (allCellsKnown(clueIndex)) {
    solved = numFilled == clue.enumLen
  }
  if (solved && numFilled == numPrefilled && annoPrefilled &&
      (clue.annoSpan || clue.solution)) {
    revealClueAnno(clueIndex);
  }
  let cls = solved ? 'solved' : ''
  for (let ci of cis) {
    if (clues[ci].clueTR) {
      clues[ci].clueTR.setAttributeNS(null, 'class', cls);
    }
    if (ci == currentClueIndex) {
      let currLab = document.getElementById('current-clue-label')
      if (currLab) {
        currLab.setAttributeNS(null, 'class', cls);
      }
    }
  }
}

// Call updateClueState() on all clues active or crossing active cells.
function updateActiveCluesState() {
  let clueIndices = {}
  if (currentClueIndex) {
    let lci = getAllLinkedClueIndices(currentClueIndex)
    for (let ci of lci) {
      clueIndices[ci] = true
    }
  }
  for (let x of activeCells) {
    let gridCell = grid[x[0]][x[1]]
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
    updateClueState(ci, false, null)
  }
}

function handleGridInput() {
  usingGnav = true
  if (currentRow < 0 || currentRow >= gridHeight ||
      currentCol < 0 || currentCol >= gridWidth) {
    return
  }
  let gridCell = grid[currentRow][currentCol]
  if (!gridCell.isLight && !gridCell.isDiagramless) {
    return;
  }
  if (gridCell.prefill) {
    // Changes disallowed
    gridInput.value = ''
    advanceCursor()
    return
  }
  let newInput = gridInput.value
  let currDisplayChar = stateCharToDisplayChar(gridCell.currentLetter)
  if (gridCell.currentLetter != '0' &&
      newInput != currDisplayChar && langMaxCharCodes == 1) {
    // The "new" input may be before or after the old input.
    let index = newInput.indexOf(currDisplayChar)
    if (index == 0) {
      newInput = newInput.substr(1)
    }
  }
  let displayChar = newInput.substr(0, langMaxCharCodes)
  if (displayChar == ' ' && gridCell.isDiagramless) {
    // spacebar creates a blocked cell in a diagramless puzzle cell
    displayChar = BLOCK_CHAR
  } else {
    displayChar = displayChar.toUpperCase()
    if (!isValidDisplayChar(displayChar)) {
      displayChar = ''
    }
  }
  let stateChar = displayCharToStateChar(displayChar)
  let oldLetter = gridCell.currentLetter
  gridCell.currentLetter = stateChar
  gridCell.textNode.nodeValue = displayChar
  gridInput.value = displayChar
  if (oldLetter == '1' || stateChar == '1') {
    let gridCellSym = grid[gridHeight - 1 - currentRow][gridWidth - 1 - currentCol]
    if (gridCellSym.isDiagramless) {
      let symLetter = (stateChar == '1') ? '1' : '0'
      let symChar = (stateChar == '1') ? BLOCK_CHAR : ''
      gridCellSym.currentLetter = symLetter
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
    updateClueState(ci, false, null)
  }

  updateAndSaveState()

  if (isValidDisplayChar(displayChar) && langMaxCharCodes == 1) {
    advanceCursor()
  }
}

function getDeactivator() {
  return function() {
    deactivateCurrentCell()
    deactivateCurrentClue()
    usingGnav = false
  };
}

function createListeners() {
  gridInput.addEventListener('keyup', function(e) {handleKeyUp(e);});
  // Listen for tab/shift tab everywhere in the puzzle area.
  outermost.addEventListener('keydown', function(e) {handleTabKeyDown(e);});
  gridInput.addEventListener('input', handleGridInput);
  gridInputWrapper.addEventListener('click', toggleCurrentDirAndActivate);
  background.addEventListener('click', getDeactivator());
  // Clicking on the title will also unselect current clue (useful
  // for barred grids where background is not visible).
  document.getElementById('title').addEventListener(
    'click', getDeactivator());
  window.addEventListener('scroll', makeCurrentClueVisible);
  window.addEventListener('resize', makeCurrentClueVisible);
}

function displayGrid() {
  numCellsToFill = 0
  numCellsPrefilled = 0
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      let gridCell = grid[i][j]
      const cellGroup =
          document.createElementNS('http://www.w3.org/2000/svg', 'g');
      if (gridCell.notBlocked()) {
        numCellsToFill++
        if (gridCell.prefill) {
          numCellsPrefilled++
        }
        const cellRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const cellLeft = offsetLeft + GRIDLINE + j * (SQUARE_DIM + GRIDLINE);
        const cellTop = offsetTop + GRIDLINE + i * (SQUARE_DIM + GRIDLINE);
        cellRect.setAttributeNS(null, 'x', cellLeft);
        cellRect.setAttributeNS(null, 'y', cellTop);
        cellRect.setAttributeNS(null, 'width', SQUARE_DIM);
        cellRect.setAttributeNS(null, 'height', SQUARE_DIM);
        cellRect.setAttributeNS(null, 'class', 'cell');
        cellGroup.appendChild(cellRect)

        const cellText =
            document.createElementNS('http://www.w3.org/2000/svg', 'text');
        cellText.setAttributeNS(
            null, 'x',
            offsetLeft + LIGHT_START_X + j * (SQUARE_DIM + GRIDLINE));
        cellText.setAttributeNS(
            null, 'y', offsetTop + LIGHT_START_Y + i * (SQUARE_DIM + GRIDLINE));
        cellText.setAttributeNS(null, 'text-anchor', 'middle');
        cellText.setAttributeNS(null, 'editable', 'simple');
        let letter = '0'
        let cellClass = 'cell-text'
        if (gridCell.prefill) {
          letter = gridCell.solution
          cellClass = 'cell-text prefill'
        }
        cellText.setAttributeNS(null, 'class', cellClass);
        const text = document.createTextNode(letter);
        cellText.appendChild(text);
        cellGroup.appendChild(cellText)

        gridCell.currentLetter = letter;
        gridCell.textNode = text;
        gridCell.cellText = cellText;
        gridCell.cellRect = cellRect;
        gridCell.cellLeft = cellLeft;
        gridCell.cellTop = cellTop;

        cellText.addEventListener('click', getRowColActivator(i, j));
        cellRect.addEventListener('click', getRowColActivator(i, j));
      }
      if (gridCell.hasCircle) {
        const cellCircle =
            document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        cellCircle.setAttributeNS(
            null, 'cx',
            offsetLeft + CIRCLE_RADIUS + GRIDLINE + j *(SQUARE_DIM + GRIDLINE));
        cellCircle.setAttributeNS(
            null, 'cy', 
            offsetTop + CIRCLE_RADIUS + GRIDLINE + i * (SQUARE_DIM + GRIDLINE));
        cellCircle.setAttributeNS(null, 'class', 'cell-circle');
        cellCircle.setAttributeNS(null, 'r', CIRCLE_RADIUS);
        cellGroup.appendChild(cellCircle)
        cellCircle.addEventListener('click', getRowColActivator(i, j));
        gridCell.cellCircle = cellCircle
      }
      if ((gridCell.startsClueLabel && !gridCell.isDiagramless &&
           !hideInferredNumbers) || gridCell.forcedClueLabel) {
        const cellNum =
            document.createElementNS('http://www.w3.org/2000/svg', 'text');
        cellNum.setAttributeNS(
            null, 'x', offsetLeft + NUMBER_START_X + j*(SQUARE_DIM + GRIDLINE));
        cellNum.setAttributeNS(
            null, 'y', offsetTop + NUMBER_START_Y + i *(SQUARE_DIM + GRIDLINE));
        cellNum.setAttributeNS(null, 'class', 'cell-num');
        const numText = gridCell.forcedClueLabel ?
            gridCell.forcedClueLabel : gridCell.startsClueLabel;
        const num = document.createTextNode(numText)
        cellNum.appendChild(num);
        cellGroup.appendChild(cellNum)
        gridCell.cellNum = cellNum
      }
      svg.appendChild(cellGroup);
    }
  }

  // Set colours specified through exolve-colour.
  for (let cellColour of cellColours) {
    if (cellColour.length == 2) {
      let ci = cellColour[0]
      if (!clues[ci] || !clues[ci].cells) {
        continue
      }
      let colour = cellColour[1]
      for (let cell of clues[ci].cells) {
        grid[cell[0]][cell[1]].colour = colour
        grid[cell[0]][cell[1]].cellRect.style.fill = colour
      }
    } else {
      let row = cellColour[0]
      let col = cellColour[1]
      if (!grid[row][col].cellRect) {
        continue
      }
      let colour = cellColour[2]
      grid[row][col].colour = colour
      grid[row][col].cellRect.style.fill = colour
    }
  }

  // Bars/word-ends to the right and under; hyphens.
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      let gridCell = grid[i][j]
      const cellGroup =
          document.createElementNS('http://www.w3.org/2000/svg', 'g');
      let emptyGroup = true
      if (gridCell.wordEndToRight && (j + 1) < gridWidth &&
          grid[i][j + 1].isLight) {
        const wordEndRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        wordEndRect.setAttributeNS(
            null, 'x',
            offsetLeft + GRIDLINE +
            (j + 1) * (SQUARE_DIM + GRIDLINE) - SEP_WIDTH_BY2);
        wordEndRect.setAttributeNS(
            null, 'y', offsetTop + GRIDLINE + i * (SQUARE_DIM + GRIDLINE));
        wordEndRect.setAttributeNS(null, 'width', SEP_WIDTH);
        wordEndRect.setAttributeNS(null, 'height', SQUARE_DIM);
        wordEndRect.setAttributeNS(null, 'class', 'wordend');
        cellGroup.appendChild(wordEndRect)
        emptyGroup = false
      }
      if (gridCell.wordEndBelow && (i + 1) < gridHeight &&
          grid[i + 1][j].isLight) {
        const wordEndRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        wordEndRect.setAttributeNS(
            null, 'x', offsetLeft + GRIDLINE + j * (SQUARE_DIM + GRIDLINE));
        wordEndRect.setAttributeNS(
            null, 'y',
            offsetTop + GRIDLINE +
            (i + 1) * (SQUARE_DIM + GRIDLINE) - SEP_WIDTH_BY2);
        wordEndRect.setAttributeNS(null, 'width', SQUARE_DIM);
        wordEndRect.setAttributeNS(null, 'height', SEP_WIDTH);
        wordEndRect.setAttributeNS(null, 'class', 'wordend');
        cellGroup.appendChild(wordEndRect)
        emptyGroup = false
      }
      if (gridCell.hyphenToRight) {
        const hyphenRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hyphenRect.setAttributeNS(
            null, 'x',
            offsetLeft + GRIDLINE +
            (j + 1) * (SQUARE_DIM + GRIDLINE) - HYPHEN_WIDTH_BY2);
        hyphenRect.setAttributeNS(
            null, 'y', offsetTop + GRIDLINE + i * (SQUARE_DIM + GRIDLINE) +
            SQUARE_DIM_BY2 - SEP_WIDTH_BY2);
        let hw = (j + 1) < gridWidth ? HYPHEN_WIDTH : HYPHEN_WIDTH_BY2
        hyphenRect.setAttributeNS(null, 'width', hw);
        hyphenRect.setAttributeNS(null, 'height', SEP_WIDTH);
        hyphenRect.setAttributeNS(null, 'class', 'wordend');
        cellGroup.appendChild(hyphenRect)
        emptyGroup = false
      }
      if (gridCell.hyphenBelow) {
        const hyphenRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hyphenRect.setAttributeNS(
            null, 'x', offsetLeft + GRIDLINE + j * (SQUARE_DIM + GRIDLINE) +
            SQUARE_DIM_BY2 - SEP_WIDTH_BY2);
        hyphenRect.setAttributeNS(
            null, 'y',
            offsetTop + GRIDLINE +
            (i + 1) * (SQUARE_DIM + GRIDLINE) - HYPHEN_WIDTH_BY2);
        hyphenRect.setAttributeNS(null, 'width', SEP_WIDTH);
        let hh = (i + 1) < gridHeight ? HYPHEN_WIDTH : HYPHEN_WIDTH_BY2
        hyphenRect.setAttributeNS(null, 'height', hh);
        hyphenRect.setAttributeNS(null, 'class', 'wordend');
        cellGroup.appendChild(hyphenRect)
        emptyGroup = false
      }
      if (gridCell.hasBarAfter) {
        const barRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        barRect.setAttributeNS(
            null, 'x',
            offsetLeft + GRIDLINE +
            (j + 1) * (SQUARE_DIM + GRIDLINE) - BAR_WIDTH_BY2);
        barRect.setAttributeNS(
            null, 'y', offsetTop + GRIDLINE + i * (SQUARE_DIM + GRIDLINE));
        barRect.setAttributeNS(null, 'width', BAR_WIDTH);
        barRect.setAttributeNS(null, 'height', SQUARE_DIM);
        barRect.setAttributeNS(null, 'fill', colorScheme['background']);
        cellGroup.appendChild(barRect)
        emptyGroup = false
      }
      if (gridCell.hasBarUnder) {
        const barRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        barRect.setAttributeNS(
            null, 'x', offsetLeft + GRIDLINE + j * (SQUARE_DIM + GRIDLINE));
        barRect.setAttributeNS(
            null, 'y',
            GRIDLINE + offsetTop +
            (i + 1) * (SQUARE_DIM + GRIDLINE) - BAR_WIDTH_BY2);
        barRect.setAttributeNS(null, 'width', SQUARE_DIM);
        barRect.setAttributeNS(null, 'height', BAR_WIDTH);
        barRect.setAttributeNS(null, 'fill', colorScheme['background']);
        cellGroup.appendChild(barRect)
        emptyGroup = false
      }
      if (!emptyGroup) {
        svg.appendChild(cellGroup);
      }
    }
  }
  statusNumTotal.innerHTML = numCellsToFill
}

function displayNinas() {
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
  for (let nina of ninas) {
    // First resolve clue indices to cells.
    let nina2 = []
    for (let cellOrOther of nina) {
      if (!Array.isArray(cellOrOther) && clues[cellOrOther] &&
          clues[cellOrOther].cells) {
        nina2 = nina2.concat(clues[cellOrOther].cells)
      } else {
        nina2.push(cellOrOther)
      }
    }
    for (let cellOrClass of nina2) {
      if (!Array.isArray(cellOrClass)) {
        // span-class-specified nina
        const elts = document.getElementsByClassName(cellOrClass)
        if (!elts || elts.length == 0) {
          throwErr('Nina ' + cellOrClass +
                   ' is not a cell/clue location nor a class with html tags');
        }
        for (let x = 0; x < elts.length; x++) {
          ninaClassElements.push({
            'element': elts[x],
            'colour':  NINA_COLORS[ninaColorIndex],
          });
        }
        continue
      }    
      const row = cellOrClass[0]
      const col = cellOrClass[1]
      const ninaRect = document.createElement('div');
      ninaRect.style.left =  '' +  grid[row][col].cellLeft + 'px';
      ninaRect.style.top = '' + grid[row][col].cellTop + 'px';
      ninaRect.style.width = '' + SQUARE_DIM + 'px';
      ninaRect.style.height = '' + SQUARE_DIM + 'px';
      ninaRect.style.backgroundColor = NINA_COLORS[ninaColorIndex]
      ninaRect.setAttributeNS(null, 'class', 'nina');
      ninaRect.addEventListener('click', getRowColActivator(row, col));
      ninaGroup.appendChild(ninaRect);
    }
    ninaColorIndex = (ninaColorIndex + 1) % NINA_COLORS.length
  }
}

function showNinas() {
  for (const ec of ninaClassElements) {
    ec.element.style.backgroundColor = ec.colour;
  }
  ninaGroup.style.display = '';
  ninasButton.innerHTML = 'Hide ninas'
  showingNinas = true
}

function hideNinas() {
  for (const ec of ninaClassElements) {
    ec.element.style.backgroundColor = 'transparent';
  }
  ninaGroup.style.display = 'none';
  ninasButton.innerHTML = 'Show ninas'
  showingNinas = false
}

function toggleNinas() {
  if (showingNinas) {
    hideNinas()
  } else {
    if (!confirm('Are you sure you want to reveal the nina(s)!?')) {
      return
    }
    showNinas()
  }
}

function clearCell(row, col) {
  let gridCell = grid[row][col]
  let oldLetter = gridCell.currentLetter
  if (oldLetter != '0') {
    gridCell.currentLetter = '0'
    gridCell.textNode.nodeValue = ''
    if (row == currentRow && col == currentCol) {
      gridInput.value = ''
    }
  }
  if (oldLetter == '1') {
    let gridSymCell = grid[gridHeight - 1 - row][gridWidth - 1 - col]
    if (gridSymCell.isDiagramless) {
      gridSymCell.currentLetter = '0'
      gridSymCell.textNode.nodeValue = ''
    }
  }
}

// Returns a pair of numbers. The first number is  0 if not full, 1 if full,
// 2 if full entirely with prefills. The second number is the number of
// full cells.
function isFull(clueIndex) {
  let theClue = clues[clueIndex]
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
    let gridCell = grid[x[0]][x[1]]
    if (gridCell.prefill) {
      numPrefills++;
      continue
    }
    if (gridCell.currentLetter == '0') {
      return [0, 0];
    }
  }
  return (numPrefills == cells.length) ? [2, cells.length] : [1, cells.length];
}

function clearCurrent() {
  let clueIndices = []
  if (currentClueIndex) {
    clueIndices = getAllLinkedClueIndices(currentClueIndex)
    for (let clueIndex of clueIndices) {
      if (clues[clueIndex].annoSpan) {
        clues[clueIndex].annoSpan.style.display = 'none'
      }
    }
    if (isOrphan(currentClueIndex) && activeCells.length > 0) {
      // For determining crossers, use the current grid clue, if any.
      clueIndices = []
      if (usingGnav && currentRow >= 0 && currentCol >= 0) {
        let gridCell = grid[currentRow][currentCol]
        if (currentDir == 'A' && gridCell.acrossClueLabel) {
          clueIndices.push('A' + gridCell.acrossClueLabel)
        }
        if (currentDir == 'D' && gridCell.downClueLabel) {
          clueIndices.push('D' + gridCell.downClueLabel)
        }
      }
    }
  }
  let fullCrossers = []
  let others = []
  for (let x of activeCells) {
    let row = x[0]
    let col = x[1]
    let gridCell = grid[row][col]
    if (gridCell.prefill) {
      continue
    }
    if (gridCell.currentLetter == '0') {
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
      if (crosser && isFull(crosser)[0]) {
        fullCrossers.push([row, col])
      } else {
        others.push([row, col])
      }
    } else {
      others.push([row, col])
    }
  }
  for (let rc of others) {
    clearCell(rc[0], rc[1])
  }
  if (others.length == 0) {
    for (let rc of fullCrossers) {
      clearCell(rc[0], rc[1])
    }
  }
  updateActiveCluesState()
  if (currentClueIndex) {
    updateClueState(currentClueIndex, false, 'unsolved')
  }
  updateAndSaveState()
  if (usingGnav) {
    gridInput.focus()
  }
}

function clearAll() {
  let message = 'Are you sure you want to clear every entry!?'
  let clearingPls = false
  if (lastOrphan) {
    if (numCellsFilled == numCellsPrefilled) {
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
    if (usingGnav) {
      gridInput.focus()
    }
    return
  }
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      let gridCell = grid[row][col]
      if (!gridCell.isLight && !gridCell.isDiagramless) {
        continue
      }
      if (gridCell.prefill) {
        continue
      }
      gridCell.currentLetter = '0'
      gridCell.textNode.nodeValue = ''
      if (row == currentRow && col == currentCol) {
        gridInput.value = ''
      }
    }
  }
  for (let a of answersList) {
    if (a.isq) {
      a.input.value = ''
    } else {
      break
    }
  }
  for (let a of revelationList) {
    a.style.display = 'none'
  }
  hideNinas()

  for (let ci of allClueIndices) {
    updateClueState(ci, false, 'unsolved')
    if (clearingPls && isOrphan(ci) && clues[ci].orphanPlaceholder) {
      clues[ci].orphanPlaceholder.value = ''
    }
  }
  if (clearingPls && currClue) {
    let clueInputs = currClue.getElementsByTagName('input')
    if (clueInputs.length == 1) {
      clueInputs[0].value = ''
    }
  }
  updateAndSaveState()
  if (usingGnav) {
    gridInput.focus()
  }
}

function checkCurrent() {
  let resetActiveCells = false
  if (activeCells.length == 0 && currentClueIndex &&
      !allCellsKnown(currentClueIndex)) {
    let clueIndices = getAllLinkedClueIndices(currentClueIndex)
    if (clueIndices.length > 0 && isOrphanWithReveals(clueIndices[0])) {
      for (let rowcol of clues[clueIndices[0]].cellsOfOrphan) {
        activeCells.push(rowcol)
      }
      resetActiveCells = true
    }
  }
  let allCorrectNum = 0
  for (let x of activeCells) {
    let row = x[0]
    let col = x[1]
    let gridCell = grid[row][col]
    let oldLetter = gridCell.currentLetter
    if (oldLetter == gridCell.solution) {
      allCorrectNum++
      continue
    }
    allCorrectNum = 0
    gridCell.currentLetter = '0'
    gridCell.textNode.nodeValue = ''
    if (row == currentRow && col == currentCol) {
      gridInput.value = ''
    }
    if (oldLetter == '1') {
      let gridSymCell = grid[gridHeight - 1 - row][gridWidth - 1 - col]
      if (gridSymCell.isDiagramless) {
        gridSymCell.currentLetter = '0'
        gridSymCell.textNode.nodeValue = ''
      }
    }
  }
  let neededAllCorrectNum = -1  // revealCurrent() will not get triggered
  if (resetActiveCells) {
    if (activeCells.length > 0) {
      neededAllCorrectNum = activeCells.length
    }
    activeCells = []
  } else if (currentClueIndex) {
    let ci = currentClueIndex
    let theClue = clues[ci]
    if (theClue && theClue.parentClueIndex) {
      ci = theClue.parentClueIndex
      theClue = clues[ci]
    }
    if (!isOrphan(ci) && allCellsKnown(ci)) {
      neededAllCorrectNum = theClue.enumLen
    } else if (activeCells.length > 0 && numCellsToOrphan > 0) {
      let orphanClueForCells = cellsToOrphan[JSON.stringify(activeCells)];
      if (orphanClueForCells &&
          clues[orphanClueForCells].cellsOfOrphan.length ==
            activeCells.length) {
        neededAllCorrectNum = activeCells.length
      }
    }
  }
  if (allCorrectNum == neededAllCorrectNum) {
    revealCurrent()  // calls updateAndSaveState()
  } else {
    updateActiveCluesState()
    updateAndSaveState()
  }
  if (usingGnav) {
    gridInput.focus()
  }
}

function checkAll() {
  if (!confirm('Are you sure you want to clear mistakes everywhere!?')) {
    if (usingGnav) {
      gridInput.focus()
    }
    return
  }
  let allCorrect = true
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      let gridCell = grid[row][col]
      if (!gridCell.isLight && !gridCell.isDiagramless) {
        continue
      }
      if (gridCell.currentLetter == gridCell.solution) {
        continue
      }
      allCorrect = false
      gridCell.currentLetter = '0'
      gridCell.textNode.nodeValue = ''
      if (row == currentRow && col == currentCol) {
        gridInput.value = ''
      }
    }
  }
  if (allCorrect) {
    revealAll()  // calls updateAndSaveState()
  } else {
    for (let ci of allClueIndices) {
      updateClueState(ci, false, null)
    }
    updateAndSaveState()
  }
  if (usingGnav) {
    gridInput.focus()
  }
}

function revealClueAnno(ci) {
  let clueIndices = getAllLinkedClueIndices(ci);
  for (let clueIndex of clueIndices) {
    let theClue = clues[clueIndex]
    if (theClue.annoSpan) {
      theClue.annoSpan.style.display = ''
    }
    if (theClue.orphanPlaceholder) {
      if (theClue.solution) {
        theClue.orphanPlaceholder.value = theClue.solution
        if (clueIndex == currentClueIndex) {
          copyOrphanEntryToCurr(clueIndex)
        }
      }
    }
  }
}

function revealCurrent() {
  // If active cells are present and usingGnav, we reveal only those (the
  // current clue might be pointing to a random orphan).
  let clueIndexForAnnoReveal = null
  let addCellsFromOrphanClue = null
  if (usingGnav && activeCells.length > 0) {
    if (currentClueIndex && !isOrphan(currentClueIndex)) {
      clueIndexForAnnoReveal = currentClueIndex
    }
    if (currentClueIndex && activeCells.length > 1 &&
        (isOrphan(currentClueIndex) || !allCellsKnown(currentClueIndex)) &&
        numCellsToOrphan > 0) {
      let orphanClueForCells = cellsToOrphan[JSON.stringify(activeCells)];
      if (orphanClueForCells) {
        deactivateCurrentClue();
        cnavToInner(orphanClueForCells)
        clueIndexForAnnoReveal = orphanClueForCells
        addCellsFromOrphanClue = clues[orphanClueForCells]
      }
    }
  } else if (currentClueIndex) {
    clueIndexForAnnoReveal = currentClueIndex
    let parentClueIndex =
      clues[currentClueIndex].parentClueIndex || currentClueIndex
    if (isOrphanWithReveals(parentClueIndex)) {
      deactivateCurrentCell();
      addCellsFromOrphanClue = clues[parentClueIndex]
    }
  }
  if (clueIndexForAnnoReveal) {
    revealClueAnno(clueIndexForAnnoReveal)
  }
  if (addCellsFromOrphanClue) {
    let activeCellsSet = {}
    for (let rowcol of activeCells) {
      activeCellsSet[JSON.stringify(rowcol)] = true
    }
    for (let rowcol of addCellsFromOrphanClue.cellsOfOrphan) {
      let gridCell = grid[rowcol[0]][rowcol[1]]
      if (!activeCellsSet[JSON.stringify(rowcol)]) {
        gridCell.cellRect.style.fill = colorScheme['active']
        activeCells.push(rowcol)
      }
    }
  }
  for (let x of activeCells) {
    let row = x[0]
    let col = x[1]
    let gridCell = grid[row][col]
    if (gridCell.prefill) {
      continue
    }
    let oldLetter = gridCell.currentLetter
    let letter = gridCell.solution
    if (letter && oldLetter != letter) {
      gridCell.currentLetter = letter
      let revealedChar = stateCharToDisplayChar(letter)
      gridCell.textNode.nodeValue = revealedChar
      if (row == currentRow && col == currentCol) {
        gridInput.value = revealedChar
      }
    }
    if (oldLetter == '1' || letter == '1') {
      let gridSymCell = grid[gridHeight - 1 - row][gridWidth - 1 - col]
      if (gridSymCell.isDiagramless) {
        let symLetter = (letter == '1') ? '1' : '0'
        let symChar = (letter == '1') ? BLOCK_CHAR : ''
        gridSymCell.currentLetter = symLetter
        gridSymCell.textNode.nodeValue = symChar
      }
    }
  }
  updateActiveCluesState()
  if (currentClueIndex) {
    updateClueState(currentClueIndex, false, 'solved')
  }
  updateAndSaveState()
  if (usingGnav) {
    gridInput.focus()
  }
}

function revealAll() {
  if (!confirm('Are you sure you want to reveal the whole solution!?')) {
    if (usingGnav) {
      gridInput.focus()
    }
    return
  }
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      let gridCell = grid[row][col]
      if (!gridCell.isLight && !gridCell.isDiagramless) {
        continue
      }
      if (gridCell.prefill) {
        continue
      }
      if (gridCell.currentLetter != gridCell.solution) {
        gridCell.currentLetter = gridCell.solution
        let revealedChar = stateCharToDisplayChar(gridCell.solution)
        gridCell.textNode.nodeValue = revealedChar
        if (row == currentRow && col == currentCol) {
          gridInput.value = revealedChar
        }
      }
    }
  }
  for (let a of answersList) {
    if (a.ans) {
      a.input.value = a.ans
    }
  }
  for (let a of revelationList) {
    a.style.display = ''
  }
  showNinas()
  for (let ci of allClueIndices) {
    revealClueAnno(ci);
    updateClueState(ci, false, 'solved')
  }
  updateAndSaveState()
  if (usingGnav) {
    gridInput.focus()
  }
}

function scratchPadInput() {
  let scratchPad = document.getElementById('scratchpad')
  let cursor = scratchPad.selectionStart
  scratchPad.value = scratchPad.value.toUpperCase()
  scratchPad.selectionEnd = cursor
}

function scratchPadShuffle() {
  let scratchPad = document.getElementById('scratchpad')
  let text = scratchPad.value
  let start = scratchPad.selectionStart
  let end = scratchPad.selectionEnd
  if (end <= start) {
    start = 0
    end = text.length
  }
  let indices = []
  let toShuffle = []
  for (let i = start; i < end; i++) {
    if (caseCheck(text[i])) {
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
  scratchPad.value = textArray.join('')
}

function submitSolution() {
  let message = 'Are you sure you are ready to submit!?';
  let state = updateDisplayAndGetState()
  if (numCellsFilled != numCellsToFill) {
    message = 'Are you sure you want to submit an INCOMPLETE solution!?';
  }
  if (!confirm(message)) {
    return
  }
  let fullSubmitURL = submitURL + '&' + submitKeys[0] + '=' +
                      encodeURIComponent(state)
  for (let i = 0; i < answersList.length; i++) {
    if (!answersList[i].isq) {
      break
    }
    fullSubmitURL = fullSubmitURL + '&' + submitKeys[i + 1] + '=' +
      encodeURIComponent(answersList[i].input.value)
  }
  document.body.style.cursor = 'wait'
  window.location.replace(fullSubmitURL)
}

function displayButtons() {
  clearButton.setAttributeNS(
    null, 'title',
    'Note: clear crossers from full clues with a second click');
  if (lastOrphan) {
    clearAllButton.setAttributeNS(
      null, 'title',
      'Note: second click clears all placeholder entries in clues ' +
      'without known cells');
  }
  clearButton.disabled = true
  if (!hasUnsolvedCells) {
    checkButton.style.display = ''
    checkAllButton.style.display = ''
    revealAllButton.style.display = ''

    checkButton.disabled = true
  }
  if (!hasUnsolvedCells || hasReveals) {
    revealButton.style.display = ''
    revealButton.disabled = true
  }
  if (ninas.length > 0) {
    ninasButton.style.display = ''
  }
  if (submitURL) {
    submitButton.style.display = ''
  }
  let scratchPad = document.getElementById('scratchpad')
  scratchPad.cols = Math.max(30, Math.floor(textAreaCols * 3 / 4))
}

function toggleShowControls() {
  let e = document.getElementById('control-keys-list')
  if (e.style.display == 'none') {
    e.style.display = ''
  } else {
    e.style.display = 'none'
  }
}

function createPuzzle(inWidget=false) {
  init(inWidget)

  parseOverallDisplayMost()
  parseAndDisplayPrelude()
  parseAndDisplayExplanations()
  checkIdAndConsistency()

  parseGrid()
  markClueStartsUsingGrid()
  setClueMemberships()
  parseClueLists()

  processClueChildren()
  finalClueTweaks()
  setGridWordEndsAndHyphens();
  setUpGnav()

  applyColorScheme()

  computeGridSize()

  displayClues()
  displayGridBackground()
  createListeners()
  displayGrid()
  displayNinas()
  displayButtons()

  parseAndDisplayRelabel()
  parseAndDisplayPS()

  restoreState()

  if (typeof customizePuzzle === 'function') {
    customizePuzzle()
  }
}

// ------ End functions.

