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

const VERSION = 'Exolve v0.62 April 5 2020'

// ------ Begin globals.

let puzzleId = 'exolve-grid'

let gridWidth = 0
let gridHeight = 0
let boxWidth = 0
let boxHeight = 0

let gridFirstLine = -1
let gridLastLine = -1
let preludeFirstLine = -1
let preludeLastLine = -1
let acrossFirstLine = -1
let acrossLastLine = -1
let downFirstLine = -1
let downLastLine = -1
let nodirFirstLine = -1
let nodirLastLine = -1
let explanationsFirstLine = -1
let explanationsLastLine = -1

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
let hasSomeAnnos = false
let hasAcrossClues = false
let hasDownClues = false
let hasNodirClues = false
// Clues labeled non-numerically (like [A] a clue...) use this to create a
// unique clueIndex.
let nextNonNumId = 1
let offNumClueIndices = {}

const MAX_GRID_SIZE = 100
const SQUARE_DIM = 31
const SQUARE_DIM_BY2 = 16
const GRIDLINE = 1
const BAR_WIDTH = 3
const BAR_WIDTH_BY2 = 2
const SEP_WIDTH = 2
const SEP_WIDTH_BY2 = 1.5
const HYPHEN_WIDTH = 9
const HYPHEN_WIDTH_BY2 = 5
const CIRCLE_RADIUS = 0.0 + SQUARE_DIM / 2.0

const NUMBER_START_X = 2
const NUMBER_START_Y = 10
const LIGHT_START_X = 16.5
const LIGHT_START_Y = 21.925

let answersList = []
let revelationList = []

// State of navigation
let currentRow = -1
let currentCol = -1
let currentDir = 'A'
let currentClueIndex = null
let usingGnav = true
let lastOrphan = null
let activeCells = [];
let activeClues = [];

let numCellsToFill = 0
let numCellsFilled = 0
let numCellsPrefilled = 0

let allClueIndices = []
const CURR_ORPHAN_ID = 'curr-orphan'
const DEFAULT_ORPHAN_LEN = 10

const BLOCK_CHAR = '⬛';
// We have special meanings for 0 (unfilled) and 1 (block in diagramless cell)
// in solution states. For crosswords with digits, we use these to stand for
// 0 and 1 respectively, in solution states.
const DIGIT0 = '-'
const DIGIT1 = '~'
const ACTIVE_COLOUR = 'mistyrose'
const ORPHAN_COLOUR = 'linen'
const TRANSPARENT_WHITE = 'rgba(255,255,255,0.0)'
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
let offsetLeft = 0
let offsetTop = 0

// Variables set in init().
let puzzleTextLines;
let numPuzzleTextLines;
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

// Set up globals, version number and user agent in bug link.
function init() {
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
  savingURL = document.getElementById('saving-url')

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

// Parse a nina line, which consists of cell locations of the nina specified
// using "chess notation" (a1 = bottom-left, etc.). Convert the cell locations
// to [row col] and push an array of these locations to the global ninas array.
function parseNina(s) {
  let nina = []
  let cellsOrClasses = s.split(' ')
  for (let cellOrClass of cellsOrClasses) {
    let cellLocation = parseCellLocation(cellOrClass)
    if (!cellLocation) {
      // Must be a class name, for a span-class-specified nina
      nina.push(cellOrClass)
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
    if (!colour) {
      colour = c
      continue;
    }
    let cellLocation = parseCellLocation(c)
    if (!cellLocation) {
      addError('Could not parse cell location in: ' + c)
      return
    } else {
      cellColours.push(cellLocation.concat(colour))
    }
  }
}

function getAnswerListener(answer) {
  return function() {
    let cursor = answer.selectionStart
    answer.value = answer.value.toUpperCase().trimLeft()
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
        addError('Could not find open-paren strangely')
        return
      }
      rawQ = s.substr(0, beforeEnum)
      afterEnum++
      hideEnum = true
    }
  }

  let correctAnswer = s.substr(afterEnum).trim()
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
  const TEXTAREA_COLS = 68
  let rows = Math.floor(inputLen / TEXTAREA_COLS)
  if (rows * TEXTAREA_COLS < inputLen) {
    rows++
  }
  let cols = (rows > 1) ? TEXTAREA_COLS : inputLen

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
  answer.setAttributeNS(null, 'maxlength', '' + inputLen);
  answer.setAttributeNS(null, 'autocomplete', 'off');
  answer.setAttributeNS(null, 'spellcheck', 'false');
  question.appendChild(answer)
  questions.appendChild(question)
  answer.addEventListener('input', getAnswerListener(answer));
}

function parseSubmit(s) {
  let parts = s.split(' ')
  if (s.length < 2) {
    addError('Submit section must have a URL and a param name for the solution')
    return
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
    let kv = spart.split(':')
    if (kv.length != 2) {
      addError('Expected exolve-option: key:value, got: ' + spart)
      return
    }
    if (kv[0] == 'clues-panel-lines') {
      cluesPanelLines = parseInt(kv[1])
      if (isNaN(cluesPanelLines)) {
        addError('Unexpected val in exolve-option: clue-panel-lines: ' + kv[1])
      }
      continue
    }
    if (kv[0] == 'offset-left') {
      offsetLeft = parseInt(kv[1])
      if (isNaN(offsetLeft)) {
        addError('Unexpected val in exolve-option: offset-left: ' + kv[1])
      }
      continue
    }
    if (kv[0] == 'offset-top') {
      offsetTop = parseInt(kv[1])
      if (isNaN(offsetTop)) {
        addError('Unexpected val in exolve-option: offset-top: ' + kv[1])
      }
      continue
    }
    if (kv[0] == 'grid-background') {
      gridBackground = kv[1]
      continue
    }
    addError('Unexpected exolve-option: ' + spart)
    return
  }
}

// The overall parser for the puzzle text. Also takes care of parsing and
// displaying all exolve-* sections except prelude, grid, across, down (for
// these, it just captures where the start and end lines are).
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
            'By ' + sectionAndValue.value
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
      boxWidth = (SQUARE_DIM * gridWidth) + gridWidth + 1
    } else if (sectionAndValue.section == 'height') {
      gridHeight = parseInt(sectionAndValue.value)
      boxHeight = (SQUARE_DIM * gridHeight) + gridHeight + 1
    } else if (sectionAndValue.section == 'prelude') {
      preludeFirstLine = firstLine
      preludeLastLine = lastLine
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
    } else if (sectionAndValue.section == 'explanations') {
      explanationsFirstLine = firstLine
      explanationsLastLine = lastLine
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

// Append an error message to the errors div. Scuttle everything by seting
// gridWidth to 0.
function addError(error) {
  document.getElementById('errors').innerHTML =
      document.getElementById('errors').innerHTML + '<br/>' +
      error;
  gridWidth = 0
}

// Run some checks for serious problems with grid id, dimensions, etc. If found,
// abort with error.
function checkIdAndConsistency() {
  if (puzzleId.match(/[^a-zA-Z\d-]/)) {
    addError('Puzzle id should only have alphanumeric characters or -: ' +
             puzzleId)
    return
  }
  if (gridWidth < 1 || gridWidth > MAX_GRID_SIZE ||
      gridHeight < 1 || gridHeight > MAX_GRID_SIZE) {
    addError('Bad/missing width/height');
    return
  } else if (gridFirstLine < 0 || gridLastLine < gridFirstLine ||
             gridHeight != gridLastLine - gridFirstLine + 1) {
    addError('Mismatched width/height');
    return
  }
  for (let i = 0; i < gridHeight; i++) {
    let lineW = puzzleTextLines[i + gridFirstLine].toUpperCase().
                    replace(/[^A-Z.0-9]/g, '').length
    if (gridWidth != lineW) {
      addError('Width in row ' + i + ' is ' + lineW + ', not ' + gridWidth);
      return
    }
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
      addError('Have ' + submitKeys.length + ' submit paramater keys, need ' +
               numKeys);
      return
    }
  }
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
  if (c >= 'A' && c <= 'Z') {
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
  if (c >= 'A' && c <= 'Z') {
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
  for (let i = 0; i < gridHeight; i++) {
    grid[i] = new Array(gridWidth)
    let gridLine = puzzleTextLines[i + gridFirstLine].
                       replace(/\s/g, '').toUpperCase()
    let gridLineIndex = 0
    for (let j = 0; j < gridWidth; j++) {
      grid[i][j] = {};
      grid[i][j].solution = gridLine.charAt(gridLineIndex).toUpperCase()
      // Deal with . and 0 and 1 in second pass
      grid[i][j].isLight = false
      if (grid[i][j].solution != '.') {
        if (grid[i][j].solution != '0' &&
            !isValidDisplayChar(grid[i][j].solution)) {
          addError('Bad grid entry: ' + grid[i][j].solution);
          gridWidth = 0
          return
        }
        grid[i][j].isLight = true
      }
      grid[i][j].hasBarAfter = false
      grid[i][j].hasBarUnder = false
      grid[i][j].hasCircle = false
      grid[i][j].isDiagramless = false
      grid[i][j].prefill = false
      gridLineIndex++
      let thisChar = ''
      while (gridLineIndex < gridLine.length &&
             (thisChar = gridLine.charAt(gridLineIndex)) &&
             (thisChar == '|' ||
              thisChar == '_' ||
              thisChar == '+' ||
              thisChar == '@' ||
              thisChar == '*' ||
              thisChar == '!' ||
              thisChar == ' ')) {
        if (thisChar == '|') {
          grid[i][j].hasBarAfter = true
        } else if (thisChar == '_') {
          grid[i][j].hasBarUnder = true
        } else if (thisChar == '+') {
          grid[i][j].hasBarAfter = true
          grid[i][j].hasBarUnder = true
        } else if (thisChar == '@') {
          grid[i][j].hasCircle = true
        } else if (thisChar == '*') {
          grid[i][j].isDiagramless = true
        } else if (thisChar == '!') {
          grid[i][j].prefill = true
        } else if (thisChar == ' ') {
        } else {
          addError('Should not happen! thisChar = ' + thisChar);
          return
        }
        gridLineIndex++
      }
      if (grid[i][j].isLight && grid[i][j].solution != '0' &&
          !grid[i][j].prefill) {
        allEntriesAre0s = false
      }
    }
  }
  // We use two passes to be able to detect if 0 means blank cell or digit 0.
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      if (grid[i][j].isLight) {
        if (grid[i][j].solution == '0') {
          if (allEntriesAre0s && !grid[i][j].prefill) {
            hasUnsolvedCells = true
          } else {
            grid[i][j].solution = DIGIT0;
          }
        } else if (grid[i][j].solution == '1') {
          grid[i][j].solution = DIGIT1;
        }
      }
      if (grid[i][j].isDiagramless && grid[i][j].solution == '.') {
        grid[i][j].solution = '1'
      }
      if (grid[i][j].prefill && !grid[i][j].isLight) {
        addError('Pre-filled cell (' + i + ',' + j + ') not a light: ')
        return
      }
      if (grid[i][j].isDiagramless) {
        hasDiagramlessCells = true
      }
      if (grid[i][j].isLight && !grid[i][j].prefill &&
          grid[i][j].solution != '0') {
        hasSolvedCells = true
      }
    }
  }
  if (hasDiagramlessCells) {
    hideCopyPlaceholders = true
  }
  if (hasUnsolvedCells && hasSolvedCells) {
    addError('Either all or no solutions should be provided')
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
      if (startsAcrossClue(i, j)) {
        grid[i][j].startsAcrossClue = true
        grid[i][j].startsClueLabel = '' + nextClueNumber
        clues['A' + nextClueNumber] =  {'cells': [], 'clueDirection': 'A'}
      }
      if (startsDownClue(i, j)) {
        grid[i][j].startsDownClue = true
        grid[i][j].startsClueLabel = '' + nextClueNumber
        clues['D' + nextClueNumber] =  {'cells': [], 'clueDirection': 'D'}
      }
      if (grid[i][j].startsClueLabel) {
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

// Parse a cell location in "chess notation" (a1 = bottom-left, etc.) and
// return a two-element array [row, col].
function parseCellLocation(s) {
  s = s.trim()
  let col = s.charCodeAt(0) - 'a'.charCodeAt(0)
  let row = gridHeight - parseInt(s.substr(1))
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
  let enumLocation = clueLine.search(/\([1-9]+[0-9\-,'’\s]*\)/)
  if (enumLocation < 0) {
    // Look for the the string 'word'/'letter'/? in parens.
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
// error
// isFiller
// clueLabel
// isOffNum
// dir
// hasChildren
// skip
function parseClueLabel(clueLine) {
  let parse = {};
  parse.dir = ''
  parse.hasChilden = false
  parse.skip = 0
  numberParts = clueLine.match(/^\s*[1-9]\d*/)
  if (numberParts && numberParts.length == 1) {
    let clueNum = parseInt(numberParts[0])
    parse.clueLabel = '' + clueNum
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
      parse.error = 'Missing matching ] in clue label in ' + clueLine
      return parse
    }
    parse.clueLabel = clueLine.substring(pastBracOpen, bracEnd).trim()
    if (parse.clueLabel.charAt(parse.clueLabel.length - 1) == '.') {
       // strip trailing period
       parse.clueLabel =
           parse.clueLabel.substr(0, parse.clueLabel.length - 1).trim()
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
  // Consume trailing period if it is there.
  periodParts = clueLine.match(/^\s*\./)
  if (periodParts && periodParts.length == 1) {
    parse.hasChildren = false
    parse.skip += periodParts[0].length
    clueLine = clueLine.substr(periodParts[0].length)
  }
  return parse
}

// Parse a single clue.
// Return an object with the following properties:
// clueIndex
// clueLabel
// isOffNum
// children[]  (raw parseClueLabel() resutls, not yet clueIndices)
// clue
// enumLen
// hyphenAfter[] (0-based indices)
// wordEndAfter[] (0-based indices)
// placeholder
// startCell optional, used in diagramless+unsolved and off-numeric labels
// cells[] optionally filled, if all clue cells are specified in the clue
// anno (the part after the enum, if present)
// isFiller
// error
function parseClue(dir, clueLine) {
  let parse = {'cells': []};
  clueLine = clueLine.trim()
  let numCellsGiven = 0
  while (clueLine.indexOf('#') == 0) {
    let cell = parseCellLocation(clueLine.substr(1));
    if (!cell) {
      break
    }
    if (numCellsGiven == 0) {
      parse.startCell = cell
    }  
    clueLine = clueLine.replace(/^#[a-z][0-9]*\s*/, '')
    numCellsGiven += 1
    if (numCellsGiven == 2) {
      parse.cells.push(parse.startCell)
      parse.cells.push(cell)
    } else if (numCellsGiven > 2) {
      parse.cells.push(cell)
    }
  }

  let clueLabelParse = parseClueLabel(clueLine)
  if (clueLabelParse.error) {
    parse.error = clueLabelParse.error
    return parse
  }
  if (clueLabelParse.isFiller) {
    parse.isFiller = true
    return parse
  }
  if (clueLabelParse.dir && clueLabelParse.dir != dir) {
    parse.error = 'Explicit dir ' + clueLabelParse.dir +
                  ' does not match ' + dir + ' in clue: ' + clueLine
    return parse
  }
  parse.clueLabel = clueLabelParse.clueLabel
  parse.isOffNum = clueLabelParse.isOffNum
  let clueIndex = dir + parse.clueLabel
  if (parse.isOffNum) {
    let offNumIndex = dir + '#' + (nextNonNumId++)
    if (!offNumClueIndices[parse.clueLabel]) {
      offNumClueIndices[parse.clueLabel] = []
    }
    offNumClueIndices[parse.clueLabel].push(offNumIndex)
    clueIndex = offNumIndex
  }
  parse.clueIndex = clueIndex

  if (parse.cells.length > 0) {
    if (dir != 'X') {
      parse.error = 'Cells listed in non-nodir clue: ' + clueLine
      return parse
    }
    let prev = []
    for (let c of parse.cells) {
      if (!grid[c[0]][c[1]].nodirClues) {
        grid[c[0]][c[1]].nodirClues = []
      }
      grid[c[0]][c[1]].nodirClues.push(clueIndex)
      if (prev.length > 0) {
        grid[prev[0]][prev[1]]['succ' + clueIndex] = {
          'cell': c,
          'dir': clueIndex
        }
        grid[c[0]][c[1]]['pred' + clueIndex] = {
          'cell': prev,
          'dir': clueIndex
        }
      }
      prev = c
    }
  }

  clueLine = clueLine.substr(clueLabelParse.skip)
  parse.children = []
  while (clueLabelParse.hasChildren) {
    clueLabelParse = parseClueLabel(clueLine)
    if (clueLabelParse.error) {
      parse.error = 'Error in linked clue number/label: ' + clueLabelParse.error
      return parse
    }
    parse.children.push(clueLabelParse)
    clueLine = clueLine.substr(clueLabelParse.skip)
  }

  let enumParse = parseEnum(clueLine)
  parse.enumLen = enumParse.enumLen
  parse.hyphenAfter = enumParse.hyphenAfter
  parse.wordEndAfter = enumParse.wordEndAfter
  parse.placeholder = enumParse.placeholder
  parse.clue = clueLine.substr(0, enumParse.afterEnum).trim()
  parse.anno = clueLine.substr(enumParse.afterEnum).trim()

  return parse
}

// Parse across and down clues from their exolve sections previously
// identified by parseOverallDisplayMost().
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
      let clueParse = parseClue(clueDirection, clueLine)
      if (clueParse.error) {
        addError('Clue parsing error in: ' + clueLine + ': ' + clueParse.error);
        return
      }
      if (clueParse.isFiller) {
        filler = filler + clueLine + '\n'
        continue
      }
      if (!clueParse.clueIndex) {
        addError('Could not parse clue: ' + clueLine);
        return
      }
      if (clues[clueParse.clueIndex] && clues[clueParse.clueIndex].clue) {
        addError('Clue entry already exists for clue: ' + clueLine);
        return
      }
      if (!firstClue) {
        firstClue = clueParse.clueIndex
      }
      lastClue = clueParse.clueIndex
      if (!clues[clueParse.clueIndex]) {
        clues[clueParse.clueIndex] =  {}
      }
      clues[clueParse.clueIndex].cells = clueParse.cells
      clues[clueParse.clueIndex].clue = clueParse.clue
      clues[clueParse.clueIndex].clueLabel = clueParse.clueLabel
      clues[clueParse.clueIndex].isOffNum = clueParse.isOffNum
      clues[clueParse.clueIndex].displayLabel = clueParse.clueLabel
      clues[clueParse.clueIndex].clueDirection = clueDirection
      clues[clueParse.clueIndex].fullDisplayLabel = clueParse.clueLabel
      if (clueDirection != 'X' && clueParse.clueLabel) {
        clues[clueParse.clueIndex].fullDisplayLabel =
            clues[clueParse.clueIndex].fullDisplayLabel +
            clueDirection.toLowerCase()
      }
      clues[clueParse.clueIndex].children = clueParse.children
      clues[clueParse.clueIndex].childrenClueIndices = []
      clues[clueParse.clueIndex].enumLen = clueParse.enumLen
      clues[clueParse.clueIndex].hyphenAfter = clueParse.hyphenAfter
      clues[clueParse.clueIndex].wordEndAfter = clueParse.wordEndAfter
      clues[clueParse.clueIndex].placeholder = clueParse.placeholder
      clues[clueParse.clueIndex].anno = clueParse.anno
      if (clueParse.anno) {
        hasSomeAnnos = true
      }
      if (clueParse.startCell) {
        let row = clueParse.startCell[0]
        let col = clueParse.startCell[1]
        grid[row][col].startsClueLabel = clueParse.clueLabel
        grid[row][col].forcedClueLabel = true
        if (clueDirection == 'A') {
          grid[row][col].startsAcrossClue = true
        } else if (clueDirection == 'D') {
          grid[row][col].startsDownClue = true
        }
      }
      clues[clueParse.clueIndex].prev = prev
      clues[clueParse.clueIndex].next = null
      if (prev) {
        clues[prev].next = clueParse.clueIndex
      }
      prev = clueParse.clueIndex
      if (filler) {
        clues[clueParse.clueIndex].filler = filler
        filler = ''
      }
      if (startNewTable) {
        clues[clueParse.clueIndex].startNewTable = true
        startNewTable = false
      }

      if (clueParse.clue) {
        allClueIndices.push(clueParse.clueIndex) 
      }
    }
    if (filler) {
      addError('Filler line should not be at the end: ' + filler)
      return
    }
  }
  if (firstClue && lastClue) {
    clues[firstClue].prev = lastClue
    clues[lastClue].next = firstClue
  }
}

function isOrphan(clueIndex) {
  return clues[clueIndex] &&
         (!clues[clueIndex].cells || !clues[clueIndex].cells.length);
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
    if (!clues[ci] || !clues[ci].cells || !clues[ci].cells.length) {
      return false
    }
    numCells += clues[ci].cells.length
  }
  return numCells == clue.enumLen
}

// For each cell grid[i][j], set {across,down}ClueLabels using previously
// marked clue starts. Sets lastOrphan, if any.
function setClueMemberships() {
  // Set across clue memberships
  for (let i = 0; i < gridHeight; i++) {
    let clueLabel = ''
    for (let j = 0; j < gridWidth; j++) {
      if (grid[i][j].startsAcrossClue) {
        clueLabel = grid[i][j].startsClueLabel
      }
      if (!clueLabel) {
        continue
      }
      if (!grid[i][j].isLight || grid[i][j].isDiagramless) {
        clueLabel = '';
        continue
      }
      if (!grid[i][j].startsAcrossClue && j > 0 && grid[i][j - 1].hasBarAfter) {
        clueLabel = '';
        continue
      }
      grid[i][j].acrossClueLabel = clueLabel
      let clueIndex = 'A' + clueLabel
      if (!clues[clueIndex]) {
        clueIndex = 'X' + clueLabel
      }
      if (!clues[clueIndex]) {
        if (!offNumClueIndices[clueLabel]) {
          clueLabel = ''
          continue
        }
        clueIndex = ''
        for (ci of offNumClueIndices[clueLabel]) {
          if (ci.charAt(0) == 'A' || ci.charAt(0) == 'X') {
            clueIndex = ci
            break
          }
        }
        if (!clueIndex) {
          clueLabel = ''
          continue
        }
      }
      clues[clueIndex].cells.push([i, j])
    }
  }
  // Set down clue memberships
  for (let j = 0; j < gridWidth; j++) {
    let clueLabel = ''
    for (let i = 0; i < gridHeight; i++) {
      if (grid[i][j].startsDownClue) {
        clueLabel = grid[i][j].startsClueLabel
      }
      if (!clueLabel) {
        continue
      }
      if (!grid[i][j].isLight || grid[i][j].isDiagramless) {
        clueLabel = '';
        continue
      }
      if (!grid[i][j].startsDownClue && i > 0 && grid[i - 1][j].hasBarUnder) {
        clueLabel = '';
        continue
      }
      grid[i][j].downClueLabel = clueLabel
      let clueIndex = 'D' + clueLabel
      if (!clues[clueIndex]) {
        clueIndex = 'X' + clueLabel
      }
      if (!clues[clueIndex]) {
        if (!offNumClueIndices[clueLabel]) {
          clueLabel = ''
          continue
        }
        clueIndex = ''
        for (ci of offNumClueIndices[clueLabel]) {
          if (ci.charAt(0) == 'D' || ci.charAt(0) == 'X') {
            clueIndex = ci
            break
          }
        }
        if (!clueIndex) {
          clueLabel = ''
          continue
        }
      }
      clues[clueIndex].cells.push([i, j])
    }
  }
  for (let clueIndex of allClueIndices) {
    if (!clues[clueIndex].parentClueIndex && isOrphan(clueIndex)) {
      lastOrphan = clueIndex
      break
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
    let lastRowColDir = clue.clueDirection
    dupes = {}
    const allDirections = ['A', 'D', 'X']
    for (let child of clue.children) {
      if (child.error) {
        addError('Bad child ' + child + ' in ' +
                 clue.cluelabel + clue.clueDirection);
        return
      }
      // Direction could be the same as the direction of the parent. Or,
      // if there is no such clue, then direction could be the other direction.
      // The direction could also be explicitly specified with a 'd' or 'a'
      // suffix.
      let childIndex = clue.clueDirection + child.clueLabel
      if (!child.isOffNum) {
        if (!clues[childIndex]) {
          for (let otherDir of allDirections) {
            if (otherDir == clue.clueDirection) {
              continue;
            }
            childIndex = otherDir + child.clueLabel
            if (clues[childIndex]) {
              break
            }
          }
        }
        if (child.dir) {
          childIndex = child.dir + child.clueLabel
        }
      } else {
        if (!offNumClueIndices[child.clueLabel] ||
            offNumClueIndices[child.clueLabel].length < 1) {
          addError('non-num child label ' + child.clueLabel + ' was not seen')
          return
        }
        childIndex = offNumClueIndices[child.clueLabel][0]
      }
      if (!clues[childIndex] || childIndex == clueIndex) {
        addError('Invalid child ' + childIndex + ' in ' +
                 clue.cluelabel + clue.clueDirection);
        return
      }
      if (dupes[childIndex]) {
        addError('Duplicate child ' + childIndex + ' in ' +
                 clue.cluelabel + clue.clueDirection);
        return
      }
      dupes[childIndex] = true
      if (child.clueLabel) {
        clue.displayLabel = clue.displayLabel + ', ' + child.clueLabel
        if (child.dir && child.dir != clue.clueDirection) {
          clue.displayLabel = clue.displayLabel + child.dir.toLowerCase()
        }
        clue.fullDisplayLabel = clue.fullDisplayLabel + ', ' + child.clueLabel
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
        let childDir = childClue.clueDirection
        if (lastRowCol[0] == cell[0] && lastRowCol[1] == cell[1]) {
          if (childDir == lastRowColDir || childClue.cells.length == 1) {
            addError('loop in successor for ' + lastRowCol)
            return
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
      lastRowColDir = childClue.clueDirection
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

// Place a trailing period and space at the end of clue full display labels that
// end in letter/digit. Wrap in a clickable span if all cells are not known.
function fixFullDisplayLabels() {
  for (let clueIndex of allClueIndices) {
    if (!clues[clueIndex].fullDisplayLabel) {
      continue
    }
    let label = clues[clueIndex].fullDisplayLabel
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
      clues[clueIndex].fullDisplayLabel = '<span class="clickable">' +
          '<span id="current-clue-label" ' +
          ' title="' + MARK_CLUE_TOOLTIP +
          '" onclick="toggleClueSolvedState(\'' + clueIndex + '\')">' +
          label + '</span></span>';
    } else {
      clues[clueIndex].fullDisplayLabel = '<span id="current-clue-label">' +
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
      if (!grid[i][j].acrossClueLabel) {
        clueLabel = ''
        clueIndex = ''
        positionInClue = -1
        continue
      }
      if (clueLabel == grid[i][j].acrossClueLabel) {
        positionInClue++
      } else {
        clueLabel = grid[i][j].acrossClueLabel
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
          grid[i][j].wordEndToRight = true
          break
        }
      }
      for (let hyphenPos of clues[clueIndex].hyphenAfter) {
        if (positionInClue == hyphenPos) {
          grid[i][j].hyphenToRight = true
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
      if (!grid[i][j].downClueLabel) {
        clueLabel = ''
        clueIndex = ''
        positionInClue = -1
        continue
      }
      if (clueLabel == grid[i][j].downClueLabel) {
        positionInClue++
      } else {
        clueLabel = grid[i][j].downClueLabel
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
          grid[i][j].wordEndBelow = true
          break
        }
      }
      for (let hyphenPos of clues[clueIndex].hyphenAfter) {
        if (positionInClue == hyphenPos) {
          grid[i][j].hyphenBelow = true
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
  if (grid[row][col].isDiagramless) {
    return true
  }
  if (col > 0 && grid[row][col].isLight && !grid[row][col].acrossClueLabel) {
    return extendsDiagramlessA(row, col - 1)
  }
  return false
}
function extendsDiagramlessD(row, col) {
  if (grid[row][col].isDiagramless) {
    return true
  }
  if (row > 0 && grid[row][col].isLight && !grid[row][col].downClueLabel) {
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
      addError('Found no clue text nor a parent clue for ' + clueIndex)
      return
    }
    if (dir != clues[clueIndex].clueDirection) {
      if (clues[clueIndex].clueDirection == 'A') {
        table = acrossClues
        hasAcrossClues = true
      } else if (clues[clueIndex].clueDirection == 'D') {
        table = downClues
        hasDownClues = true
      } else if (clues[clueIndex].clueDirection == 'X') {
        table = nodirClues
        hasNodirClues = true
      } else {
        addError('Unexpected clue direction ' +
                 clues[clueIndex].clueDirection + ' in ' + clueIndex)
        return
      }
      dir = clues[clueIndex].clueDirection
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
    if (col1Chars.substr(1,1) == ',') {
      // Linked clue that begins with a single-digit clue number. Indent!
      col1.style.textIndent = '1ch'
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
      // spaces and equal number of commas use 4
      let col1Spaces = col1Chars.split(' ').length - 1
      let indent = col1Spaces * 2 * 4
      // digits use 8
      let col1Digits = col1Chars.replace(/[^0-9]*/g, '').length
      indent = indent + (col1Digits * 8)
      // letters use 11
      let col1Letters = col1Chars.replace(/[^a-zA-Z]*/g, '').length
      indent = indent + (col1Letters * 11)
      let rem = col1Chars.length - col1Letters - col1Digits - (2 * col1Spaces);
      if (rem > 0) {
        indent = indent + (rem * 14)
      }
      if (indent < 4) {
        indent = 4
      }
      col2.style.textIndent = '' + indent + 'px'
    }

    if (isOrphan(clueIndex) && !clues[clueIndex].parentClueIndex) {
      let placeholder = ''
      let len = DEFAULT_ORPHAN_LEN
      if (clues[clueIndex].placeholder) {
        placeholder = clues[clueIndex].placeholder
        len = placeholder.length
      }
      addOrphanEntryUI(col2, false, len, placeholder, clueIndex)
      answersList.push({
        'input': col2.lastElementChild.firstElementChild,
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
  background.setAttributeNS(null, 'fill', gridBackground);
  svg.appendChild(background);
}

// Return a string encoding the current entries in the whole grid and
// also set the number of squares that have been filled.
function getGridStateAndNumFilled() {
  let state = '';
  let numFilled = 0
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      if (grid[i][j].isLight || grid[i][j].isDiagramless) {
        state = state + grid[i][j].currentLetter
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
  checkButton.disabled = (activeCells.length == 0)
  revealButton.disabled = (activeCells.length == 0) &&
                          (!currentClueIndex ||
                           !clues[currentClueIndex] ||
                           !clues[currentClueIndex].anno)
  clearButton.disabled = revealButton.disabled
  submitButton.disabled = (numCellsFilled != numCellsToFill)
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
  document.cookie = puzzleId + '=' + state + ';' + expires + ';path=/';

  // Also save the state in location.hash.
  location.hash = '#' + state
  if (savingURL) {
    savingURL.href = location.href
  }
}

// Restore state from cookie (or location.hash).
function restoreState() {
  let state = decodeURIComponent(location.hash.substr(1))
  if (!state) {
    let name = puzzleId + '=';
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        state = c.substring(name.length, c.length);
      }
    }
  }
  state = state.trim()
  let error = false
  if (state == '') { 
    console.log('No saved state available')
    error = true
  } else if (state.length < (gridWidth * gridHeight)) {
    console.log('Not enough characters in state')
    error = true
  }
  let index = 0
  for (let i = 0; i < gridHeight && !error; i++) {
    for (let j = 0; j < gridWidth && !error; j++) {
      letter = state.charAt(index++);
      if (grid[i][j].isLight || grid[i][j].isDiagramless) {
        if (grid[i][j].prefill) {
          grid[i][j].currentLetter = grid[i][j].solution
          continue
        }
        if (letter == '1') {
           if (!grid[i][j].isDiagramless) {
             console.log('Unexpected ⬛ in non-diagramless location');
             error = true
             break
           }
           grid[i][j].currentLetter = '1'
        } else {
           if (!isValidStateChar(letter)) {
             console.log('Unexpected letter/digit ' + letter + ' in state');
             error = true
             break
           }
           grid[i][j].currentLetter = letter
        }
      } else {
        if (letter != '.') {
          console.log('Unexpected letter ' + letter + ' in state, expected .');
          error = true
          break
        }
      }
    }
  }
  if (error) {
    for (let i = 0; i < gridHeight; i++) {
      for (let j = 0; j < gridWidth; j++) {
        if (grid[i][j].isLight || grid[i][j].isDiagramless) {
          if (grid[i][j].prefill) {
            grid[i][j].currentLetter = grid[i][j].solution
          } else {
            grid[i][j].currentLetter = '0'
          }
        }
      }
    }
  } else {
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
  }
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      if (grid[i][j].isLight || grid[i][j].isDiagramless) {
        grid[i][j].textNode.nodeValue =
            stateCharToDisplayChar(grid[i][j].currentLetter)
      }
    }
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
    let cellRect = grid[x[0]][x[1]].cellRect
    if (grid[x[0]][x[1]].colour) {
      cellRect.style.fill = grid[x[0]][x[1]].colour
    } else {
      cellRect.style.fill = 'white'
    }
  }
  activeCells = [];
}

function deactivateCurrentClue() {
  for (let x of activeClues) {
    x.style.background = 'white'
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
  if (inputPos.bottom >= windowH) {
    currClue.style.top = '0'
    return
  }
  // gridInput is visible
  const cluePos = currClue.getBoundingClientRect();
  const top = cluePos.top
  const clueParentPos = currClueParent.getBoundingClientRect();
  const parentTop = clueParentPos.top
  // Reposition
  let newTop = 0
  // If parent is below viewport top, go back to standard position.
  if (parentTop >= 0) {
    currClue.style.top = '0'
    return
  }
  currClue.style.top = '' + (0 - parentTop) + 'px';
}

function gnavToInner(cell, dir) {
  currentRow = cell[0]
  currentCol = cell[1]
  currentDir = dir
  if (currentRow < 0 || currentRow >= gridHeight ||
      currentCol < 0 || currentCol >= gridWidth) {
    return null
  }
  if (!grid[currentRow][currentCol].isLight &&
      !grid[currentRow][currentCol].isDiagramless) {
    return null
  }

  gridInputWrapper.style.width = '' + SQUARE_DIM + 'px'
  gridInputWrapper.style.height = '' + SQUARE_DIM + 'px'
  gridInputWrapper.style.left =
    '' + grid[currentRow][currentCol].cellLeft + 'px'
  gridInputWrapper.style.top =
    '' + grid[currentRow][currentCol].cellTop + 'px'
  gridInput.value = grid[currentRow][currentCol].prefill ? '' :
      stateCharToDisplayChar(grid[currentRow][currentCol].currentLetter)
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
  if (currentDir == 'A' && !grid[currentRow][currentCol].isDiagramless &&
      !grid[currentRow][currentCol].acrossClueLabel &&
      !extendsDiagramlessA(currentRow, currentCol)) {
    toggleCurrentDir()
  } else if (currentDir == 'D' && !grid[currentRow][currentCol].isDiagramless &&
             !grid[currentRow][currentCol].downClueLabel &&
             !extendsDiagramlessD(currentRow, currentCol)) {
    toggleCurrentDir()
  } else if (currentDir.charAt(0) == 'X' &&
             (!grid[currentRow][currentCol].nodirClues ||
              !grid[currentRow][currentCol].nodirClues.includes(currentDir))) {
    toggleCurrentDir()
  }
  if (currentDir == 'A') {
    if (grid[currentRow][currentCol].acrossClueLabel) {
      activeClueLabel = grid[currentRow][currentCol].acrossClueLabel
      activeClueIndex = 'A' + activeClueLabel
    }
    gridInputRarrow.style.display = ''
  } else if (currentDir == 'D') {
    if (grid[currentRow][currentCol].downClueLabel) {
      activeClueLabel = grid[currentRow][currentCol].downClueLabel
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
        grid[rowcol[0]][rowcol[1]].cellRect.style.fill = ACTIVE_COLOUR
        activeCells.push(rowcol)
      }
    }
    return activeClueIndex
  } else {
    // No active clue, activate the last orphan clue.
    grid[currentRow][currentCol].cellRect.style.fill = ACTIVE_COLOUR
    activeCells.push([currentRow, currentCol])
    return lastOrphan
  }
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
  if (clues[clueIndex].parentClueIndex) {
    let parent = clues[clueIndex].parentClueIndex
    clueIndices = [parent].concat(clues[parent].childrenClueIndices)
  } else if (clues[clueIndex].childrenClueIndices) {
    clueIndices =
        clueIndices.concat(clues[clueIndex].childrenClueIndices)
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
function cnavToInner(activeClueIndex) {
  let clueIndices = getAllLinkedClueIndices(activeClueIndex)
  let parentIndex = clueIndices[0]
  let gnav = null
  if (clues[activeClueIndex] && clues[activeClueIndex].cells &&
      clues[activeClueIndex] && clues[activeClueIndex].cells.length > 0) {
    let dir = (activeClueIndex.charAt(0) == 'X') ? activeClueIndex :
              activeClueIndex.charAt(0)
    gnav = [clues[activeClueIndex].cells[0][0],
            clues[activeClueIndex].cells[0][1],
            dir]
  }
  curr = clues[parentIndex]
  if (!curr || !curr.clue) {
    activeClueIndex = lastOrphan
    parentIndex = lastOrphan
    curr = clues[parentIndex]
    if (!curr || !curr.clue) {
      addError('Grid light has no clue, and there are no orphan clues in the ' +
               'clue list')
      return null
    }
    clueIndices = getAllLinkedClueIndices(parentIndex)
  }
  let orphan = isOrphan(parentIndex)
  if (orphan) {
    lastOrphan = parentIndex
  }
  let colour = orphan ? ORPHAN_COLOUR : ACTIVE_COLOUR;
  for (let clueIndex of clueIndices) {
    if (clues[clueIndex].anno) {
      // Even in unsolved grids, annos may be present as hints
      revealButton.disabled = false
    }
    if (!clues[clueIndex].clueTR) {
      continue
    }
    clues[clueIndex].clueTR.style.background = colour
    if (cluesPanelLines > 0 &&
        isVisible(clues[clueIndex].clueTR.parentElement)) {
      clues[clueIndex].clueTR.scrollIntoView()
      gridInput.scrollIntoView()  // Else we may move away from the cell!
    }
    activeClues.push(clues[clueIndex].clueTR)
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
    updateOrphanEntry(parentIndex, false /* need to copy to curr */)
    if (!usingGnav && clues[parentIndex].clueTR) {
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
  return currentRow >= 0 && currentCol >= 0 &&
    (grid[currentRow][currentCol].isDiagramless ||
     (currentDir == 'A' &&
      (!grid[currentRow][currentCol].acrossClueLabel ||
       !clues['A' + grid[currentRow][currentCol].acrossClueLabel].clue)) ||
     (currentDir == 'D' &&
      (!grid[currentRow][currentCol].downClueLabel ||
       !clues['D' + grid[currentRow][currentCol].downClueLabel].clue)) ||
     (currentDir.charAt(0) == 'X' &&
      (!grid[currentRow][currentCol].nodirClues ||
       !grid[currentRow][currentCol].nodirClues.includes(currentDir))));
}

function cnavTo(activeClueIndex) {
  deactivateCurrentClue();
  let cellDir = cnavToInner(activeClueIndex)
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
    if (letter < 'A' || letter > 'Z') {
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
    if (grid[row][col].prefill) {
      continue
    }
    let letter = letters[i]
    let oldLetter = grid[row][col].currentLetter
    if (oldLetter != letter) {
      grid[row][col].currentLetter = letter
      let revealedChar = stateCharToDisplayChar(letter)
      grid[row][col].textNode.nodeValue = revealedChar
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

// inCurr is set to true when this is called oninput in the currClue strip.
function updateOrphanEntry(clueIndex, inCurr) {
  if (!clueIndex || !clues[clueIndex] || !clues[clueIndex].clueTR ||
      !isOrphan(clueIndex) || clues[clueIndex].parentClueIndex) {
    return
  }
  let clueInputs = clues[clueIndex].clueTR.getElementsByTagName('input')
  if (clueInputs.length != 1) {
    addError('Missing placeholder input for clue ' + clueIndex)
    return
  }
  if (!inCurr) {
    let cursor = clueInputs[0].selectionStart
    clueInputs[0].value = clueInputs[0].value.toUpperCase().trimLeft()
    clueInputs[0].selectionEnd = cursor
    updateAndSaveState()
  }
  let curr = document.getElementById(CURR_ORPHAN_ID)
  if (!curr) {
    return
  }
  let currInputs = curr.getElementsByTagName('input')
  if (clueInputs.length != 1) {
    return
  }
  if (inCurr) {
    let cursor = currInputs[0].selectionStart
    currInputs[0].value = currInputs[0].value.toUpperCase().trimLeft()
    currInputs[0].selectionEnd = cursor
    clueInputs[0].value = currInputs[0].value
    updateAndSaveState()
  } else {
    currInputs[0].value = clueInputs[0].value
  }
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
  if (grid[currentRow][currentCol].acrossClueLabel ||
      grid[currentRow][currentCol].succA ||
      grid[currentRow][currentCol].predA) {
    choices.push('A')
  }
  if (grid[currentRow][currentCol].downClueLabel ||
      grid[currentRow][currentCol].succD ||
      grid[currentRow][currentCol].predD) {
    choices.push('D')
  }
  if (grid[currentRow][currentCol].nodirClues) {
    choices = choices.concat(grid[currentRow][currentCol].nodirClues)
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
    if (retreatCursorIfPred()) {
      // retreated across linked clue!
      return true
    }
    if (currentDir == 'A') {
      key = 37  // left
    } else if (currentDir == 'D') {
      key = 38  // up
    } else {
      return true
    }
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

function retreatCursorIfPred() {
  let predProperty = 'pred' + currentDir
  if (!grid[currentRow][currentCol][predProperty]) {
    return false
  }
  let pred = grid[currentRow][currentCol][predProperty]
  currentDir = pred.dir
  activateCell(pred.cell[0], pred.cell[1]);
  return true
}

function toggleClueSolvedState(clueIndex) {
  if (allCellsKnown(clueIndex)) {
    addError('toggleClueSolvedState() called on ' + clueIndex +
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
// if annoPrefilled is true and the clue is fully prefilled, reveal its anno.
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
    if (!clues[ci].clueTR) {
      numFilled = 0
      break
    }
    let isFullRet = isFull(ci)
    if (!isFullRet) {
      numFilled = 0
      break
    }
    numFilled += clues[ci].cells.length
    if (isFullRet == 2) {
      numPrefilled += clues[ci].cells.length
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
  if (solved && numFilled == numPrefilled && annoPrefilled && clue.annoSpan) {
    clue.annoSpan.style.display = ''
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
    let row = x[0]
    let col = x[1]
    if (grid[row][col].acrossClueLabel) {
      let ci = 'A' + grid[row][col].acrossClueLabel
      clueIndices[ci] = true
    }
    if (grid[row][col].downClueLabel) {
      let ci = 'D' + grid[row][col].downClueLabel
      clueIndices[ci] = true
    }
    if (grid[row][col].nodirClues) {
      for (let ci of grid[row][col].nodirClues) {
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
  if (!grid[currentRow][currentCol].isLight &&
      !grid[currentRow][currentCol].isDiagramless) {
    return;
  }
  if (grid[currentRow][currentCol].prefill) {
    // Changes disallowed
    gridInput.value = ''
    advanceCursor()
    return
  }
  let newInput = gridInput.value
  let currDisplayChar =
      stateCharToDisplayChar(grid[currentRow][currentCol].currentLetter)
  if (grid[currentRow][currentCol].currentLetter != '0' &&
      newInput != currDisplayChar) {
    // The "new" input may be before or after the old input.
    let index = newInput.indexOf(currDisplayChar)
    if (index == 0) {
      newInput = newInput.substr(1)
    }
  }
  let displayChar = newInput.substr(0, 1)
  if (displayChar == ' ' && grid[currentRow][currentCol].isDiagramless) {
    // spacebar creates a blocked cell in a diagramless puzzle cell
    displayChar = BLOCK_CHAR
  } else {
    displayChar = displayChar.toUpperCase()
    if (!isValidDisplayChar(displayChar)) {
      displayChar = ''
    }
  }
  let stateChar = displayCharToStateChar(displayChar)
  let oldLetter = grid[currentRow][currentCol].currentLetter
  grid[currentRow][currentCol].currentLetter = stateChar
  grid[currentRow][currentCol].textNode.nodeValue = displayChar
  gridInput.value = displayChar
  if (oldLetter == '1' || stateChar == '1') {
    let symRow = gridHeight - 1 - currentRow
    let symCol = gridWidth - 1 - currentCol
    if (grid[symRow][symCol].isDiagramless) {
      let symLetter = (stateChar == '1') ? '1' : '0'
      let symChar = (stateChar == '1') ? BLOCK_CHAR : ''
      grid[symRow][symCol].currentLetter = symLetter
      grid[symRow][symCol].textNode.nodeValue = symChar
    }
  }

  let cluesAffected = []
  let label = grid[currentRow][currentCol].acrossClueLabel
  if (label) {
    cluesAffected.push('A' + label)
  }
  label = grid[currentRow][currentCol].downClueLabel
  if (label) {
    cluesAffected.push('D' + label)
  }
  let otherClues = grid[currentRow][currentCol].nodirClues
  if (otherClues) {
    cluesAffected = cluesAffected.concat(otherClues)
  }
  for (ci of cluesAffected) {
    updateClueState(ci, false, null)
  }

  updateAndSaveState()

  if (isValidDisplayChar(displayChar)) {
    advanceCursor()
  }
}

function getDeactivator() {
  return function() {
    deactivateCurrentCell()
    deactivateCurrentClue()
  };
}

function createListeners() {
  gridInput.addEventListener('keyup', function(e) {handleKeyUp(e);});
  // Listen for tab/shift tab everywhere in the puzzle area.
  const outer = document.getElementById('outermost-stack')
  outer.addEventListener('keydown', function(e) {handleTabKeyDown(e);});
  gridInput.addEventListener('input', handleGridInput);
  gridInputWrapper.addEventListener('click', toggleCurrentDirAndActivate);
  background.addEventListener('click', getDeactivator());
  // Clicking on the title will also unselect current clue (useful
  // for barred grids where background is not visible).
  document.getElementById('title').addEventListener(
    'click', getDeactivator());
  window.addEventListener('scroll', makeCurrentClueVisible);
}

function displayGrid() {
  numCellsToFill = 0
  numCellsPrefilled = 0
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      const cellGroup =
          document.createElementNS('http://www.w3.org/2000/svg', 'g');
      if (grid[i][j].isLight || grid[i][j].isDiagramless) {
        numCellsToFill++
        if (grid[i][j].prefill) {
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
        if (grid[i][j].prefill) {
          letter = grid[i][j].solution
          cellClass = 'cell-text prefill'
        }
        cellText.setAttributeNS(null, 'class', cellClass);
        const text = document.createTextNode(letter);
        cellText.appendChild(text);
        cellGroup.appendChild(cellText)

        grid[i][j].currentLetter = letter;
        grid[i][j].textNode = text;
        grid[i][j].cellText = cellText;
        grid[i][j].cellRect = cellRect;
        grid[i][j].cellLeft = cellLeft;
        grid[i][j].cellTop = cellTop;

        cellText.addEventListener('click', getRowColActivator(i, j));
        cellRect.addEventListener('click', getRowColActivator(i, j));
      }
      if (grid[i][j].hasCircle) {
        const cellCircle =
            document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        cellCircle.setAttributeNS(
            null, 'cx',
            offsetLeft + CIRCLE_RADIUS + GRIDLINE + j *(SQUARE_DIM + GRIDLINE));
        cellCircle.setAttributeNS(
            null, 'cy', 
            offsetTop + CIRCLE_RADIUS + GRIDLINE + i * (SQUARE_DIM + GRIDLINE));
        cellCircle.setAttributeNS(null, 'r', CIRCLE_RADIUS);
        cellCircle.setAttributeNS(null, 'stroke', 'gray');
        cellCircle.setAttributeNS(null, 'fill', TRANSPARENT_WHITE);
        cellGroup.appendChild(cellCircle)
        cellCircle.addEventListener('click', getRowColActivator(i, j));
      }
      if (grid[i][j].startsClueLabel && !grid[i][j].isDiagramless &&
          (!hideInferredNumbers || grid[i][j].forcedClueLabel)) {
        const cellNum =
            document.createElementNS('http://www.w3.org/2000/svg', 'text');
        cellNum.setAttributeNS(
            null, 'x', offsetLeft + NUMBER_START_X + j*(SQUARE_DIM + GRIDLINE));
        cellNum.setAttributeNS(
            null, 'y', offsetTop + NUMBER_START_Y + i *(SQUARE_DIM + GRIDLINE));
        cellNum.setAttributeNS(null, 'class', 'cell-num');
        const num = document.createTextNode(grid[i][j].startsClueLabel)
        cellNum.appendChild(num);
        cellGroup.appendChild(cellNum)
      }
      svg.appendChild(cellGroup);
    }
  }

  // Set colours specified through exolve-colour.
  for (let cellColour of cellColours) {
    let row = cellColour[0]
    let col = cellColour[1]
    let colour = cellColour[2]
    grid[row][col].colour = colour
    grid[row][col].cellRect.style.fill = colour
  }

  // Bars/word-ends to the right and under; hyphens.
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      const cellGroup =
          document.createElementNS('http://www.w3.org/2000/svg', 'g');
      let emptyGroup = true
      if (grid[i][j].wordEndToRight && (j + 1) < gridWidth &&
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
      if (grid[i][j].wordEndBelow && (i + 1) < gridHeight &&
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
      if (grid[i][j].hyphenToRight) {
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
      if (grid[i][j].hyphenBelow) {
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
      if (grid[i][j].hasBarAfter) {
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
        barRect.setAttributeNS(null, 'fill', gridBackground);
        cellGroup.appendChild(barRect)
        emptyGroup = false
      }
      if (grid[i][j].hasBarUnder) {
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
        barRect.setAttributeNS(null, 'fill', gridBackground);
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
    for (let cellOrClass of nina) {
      if (!Array.isArray(cellOrClass)) {
        // span-class-specified nina
        const elts = document.getElementsByClassName(cellOrClass)
        if (!elts || elts.length == 0) {
          addError('Nina ' + cellOrClass +
                   ' is not a cell location nor a class with html tags');
          return
        }
        for (const elt of elts) {
          ninaClassElements.push({
            'element': elt,
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
  let oldLetter = grid[row][col].currentLetter
  if (oldLetter != '0') {
    grid[row][col].currentLetter = '0'
    grid[row][col].textNode.nodeValue = ''
    if (row == currentRow && col == currentCol) {
      gridInput.value = ''
    }
  }
  if (oldLetter == '1') {
    let symRow = gridHeight - 1 - row
    let symCol = gridWidth - 1 - col
    if (grid[symRow][symCol].isDiagramless) {
      grid[symRow][symCol].currentLetter = '0'
      grid[symRow][symCol].textNode.nodeValue = ''
    }
  }
}

// Returns 0 if not full. 1 if full, 2 if full entirely with prefills.
function isFull(clueIndex) {
  if (!clues[clueIndex] || !clues[clueIndex].cells ||
      clues[clueIndex].cells.length < 1) {
    return 0;
  }
  let numPrefills = 0;
  for (let x of clues[clueIndex].cells) {
    let row = x[0]
    let col = x[1]
    if (grid[row][col].prefill) {
      numPrefills++;
      continue
    }
    if (grid[row][col].currentLetter == '0') {
      return 0;
    }
  }
  return (numPrefills == clues[clueIndex].cells.length) ? 2 : 1;
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
        if (currentDir == 'A' && grid[currentRow][currentCol].acrossClueLabel) {
          clueIndices.push('A' + grid[currentRow][currentCol].acrossClueLabel)
        }
        if (currentDir == 'D' && grid[currentRow][currentCol].downClueLabel) {
          clueIndices.push('D' + grid[currentRow][currentCol].downClueLabel)
        }
      }
    }
  }
  let fullCrossers = []
  let others = []
  for (let x of activeCells) {
    let row = x[0]
    let col = x[1]
    if (grid[row][col].prefill) {
      continue
    }
    if (grid[row][col].currentLetter == '0') {
      continue
    }
    if (grid[row][col].acrossClueLabel && grid[row][col].downClueLabel) {
      let across = 'A' + grid[row][col].acrossClueLabel
      let down = 'D' + grid[row][col].downClueLabel
      let crosser = ''
      if (clueIndices.includes(across) && !clueIndices.includes(down)) {
        crosser = down
      } else if (!clueIndices.includes(across) && clueIndices.includes(down)) {
        crosser = across
      }
      if (crosser && isFull(crosser)) {
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
  if (lastOrphan && numCellsFilled == numCellsPrefilled) {
    message = 'Are you sure you want to clear every entry including all the ' +
              'placeholder entries!?'
    clearingPls = true
  }
  if (!confirm(message)) {
    if (usingGnav) {
      gridInput.focus()
    }
    return
  }
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      if (!grid[row][col].isLight && !grid[row][col].isDiagramless) {
        continue
      }
      if (grid[row][col].prefill) {
        continue
      }
      grid[row][col].currentLetter = '0'
      grid[row][col].textNode.nodeValue = ''
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
    if (clearingPls && isOrphan(ci) && clues[ci].clueTR) {
      let clueInputs = clues[ci].clueTR.getElementsByTagName('input')
      if (clueInputs.length != 1) {
        continue
      }
      clueInputs[0].value = ''
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
  let allCorrect = true
  for (let x of activeCells) {
    let row = x[0]
    let col = x[1]
    let oldLetter = grid[row][col].currentLetter
    if (oldLetter == grid[row][col].solution) {
      continue
    }
    allCorrect = false
    grid[row][col].currentLetter = '0'
    grid[row][col].textNode.nodeValue = ''
    if (row == currentRow && col == currentCol) {
      gridInput.value = ''
    }
    if (oldLetter == '1') {
      let symRow = gridHeight - 1 - row
      let symCol = gridWidth - 1 - col
      if (grid[symRow][symCol].isDiagramless) {
        grid[symRow][symCol].currentLetter = '0'
        grid[symRow][symCol].textNode.nodeValue = ''
      }
    }
  }
  if (allCorrect) {
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
      if (!grid[row][col].isLight && !grid[row][col].isDiagramless) {
        continue
      }
      if (grid[row][col].currentLetter == grid[row][col].solution) {
        continue
      }
      allCorrect = false
      grid[row][col].currentLetter = '0'
      grid[row][col].textNode.nodeValue = ''
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

function revealCurrent() {
  for (let x of activeCells) {
    let row = x[0]
    let col = x[1]
    if (grid[row][col].prefill) {
      continue
    }
    let oldLetter = grid[row][col].currentLetter
    let letter = grid[row][col].solution
    if (letter && oldLetter != letter) {
      grid[row][col].currentLetter = letter
      let revealedChar = stateCharToDisplayChar(letter)
      grid[row][col].textNode.nodeValue = revealedChar
      if (row == currentRow && col == currentCol) {
        gridInput.value = revealedChar
      }
    }
    if (oldLetter == '1' || letter == '1') {
      let symRow = gridHeight - 1 - row
      let symCol = gridWidth - 1 - col
      if (grid[symRow][symCol].isDiagramless) {
        let symLetter = (letter == '1') ? '1' : '0'
        let symChar = (letter == '1') ? BLOCK_CHAR : ''
        grid[symRow][symCol].currentLetter = symLetter
        grid[symRow][symCol].textNode.nodeValue = symChar
      }
    }
  }
  if (currentClueIndex) {
    let clueIndices = getAllLinkedClueIndices(currentClueIndex)
    for (let clueIndex of clueIndices) {
      if (clues[clueIndex].annoSpan) {
        clues[clueIndex].annoSpan.style.display = ''
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
      if (!grid[row][col].isLight && !grid[row][col].isDiagramless) {
        continue
      }
      if (grid[row][col].prefill) {
        continue
      }
      if (grid[row][col].currentLetter != grid[row][col].solution) {
        grid[row][col].currentLetter = grid[row][col].solution
        let revealedChar = stateCharToDisplayChar(grid[row][col].solution)
        grid[row][col].textNode.nodeValue = revealedChar
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
    if (text[i] >= 'A' && text[i] <= 'Z') {
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
  if (!confirm('Are you sure you are ready to submit!?')) {
    return
  }
  let state = updateDisplayAndGetState()
  let fullSubmitURL = submitURL + '&' + submitKeys[0] + '=' +
                      encodeURIComponent(state)
  for (let i = 0; i < answersList.length; i++) {
    if (!answersList[i].isq) {
      break
    }
    fullSubmitURL = fullSubmitURL + '&' + submitKeys[i + 1] + '=' +
      encodeURIComponent(answersList[i].input.value.toUpperCase())
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
    submitButton.disabled = true
  }
  if (!hasUnsolvedCells || hasSomeAnnos) {
    revealButton.style.display = ''
    revealButton.disabled = true
  }
  if (ninas.length > 0) {
    ninasButton.style.display = ''
  }
  if (submitURL) {
    submitButton.style.display = ''
  }
}

function toggleShowControls() {
  let e = document.getElementById('control-keys-list')
  if (e.style.display == 'none') {
    e.style.display = ''
  } else {
    e.style.display = 'none'
  }
}

function createPuzzle() {
  init();

  parseOverallDisplayMost();
  parseAndDisplayPrelude();
  parseAndDisplayExplanations();
  checkIdAndConsistency();
  parseGrid();
  markClueStartsUsingGrid();
  parseClueLists();

  setClueMemberships();
  processClueChildren();
  fixFullDisplayLabels()
  setGridWordEndsAndHyphens();
  setUpGnav();

  displayClues();
  displayGridBackground();
  createListeners();
  displayGrid();
  displayNinas();
  displayButtons();

  restoreState();

  if (typeof customizePuzzle === 'function') {
    customizePuzzle()
  }
}

// ------ End functions.

