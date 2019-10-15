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

const VERSION = 'Exolve v0.32 October 14 2019'

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
let nonNumClueIndices = {}

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

let currentRow = -1
let currentCol = -1
let currentDirectionIsAcross = true
let currentClueIndex = null
let activeCells = [];
let activeClues = [];
let numCellsToFill = 0

let allClueIndices = []
let orphanClueIndices = []
// For the orhpan-clues widget.
let posInOrphanClueIndices = 0

const BLOCK_CHAR = '⬛';
const ACTIVE_COLOUR = 'mistyrose'
const ORPHAN_CLUES_COLOUR = 'white'
const TRANSPARENT_WHITE = 'rgba(255,255,255,0.0)'

let nextPuzzleTextLine = 0

const STATE_SEP = 'eexxoollvvee'

// Variables set by exolve-option
let hideInferredNumbers = false
let cluesPanelLines = -1

// Variables set in init().
let puzzleTextLines;
let numPuzzleTextLines;
let svg;
let gridInputWrapper;
let gridInput;
let questions;
let background;
let acrossClues;
let downClues;
let nodirClues;
let acrossPanel;
let downPanel;
let nodirPanel;
let currentClue;
let currentClueParent;
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

  currentClue = document.getElementById('current-clue')
  currentClueParent = document.getElementById('current-clue-parent')
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

// Parse a question line and create the question element for it (which includes
// an input box for the answer). The solution answer may be provided after the
// last ')'.
function parseQuestion(s) {
  let enumParse = parseEnum(s)
  let inputLen = enumParse.len + enumParse.hyphenAfter.length +
                 enumParse.wordEndAfter.length

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
    'hasEnum': (inputLen > 0),
  });
  if (!hideEnum) {
    let answerValue = ''
    let wordEndIndex = 0
    let hyphenIndex = 0
    for (let i = 0; i < enumParse.len; i++) {
      answerValue = answerValue + '?'
      if (wordEndIndex < enumParse.wordEndAfter.length &&
              i == enumParse.wordEndAfter[wordEndIndex]) {
        answerValue = answerValue + ' '
        wordEndIndex++
      }
      if (hyphenIndex < enumParse.hyphenAfter.length &&
              i == enumParse.hyphenAfter[hyphenIndex]) {
        answerValue = answerValue + '-'
        hyphenIndex++
      }
    }
    answer.setAttributeNS(null, 'placeholder', '' + answerValue);
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
  answer.addEventListener('input', updateAndSaveState);
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
    let kv = spart.split(':')
    if (kv.length != 2) {
      addError('Expected exolve-option: key:value, got: ' + spart)
      return
    }
    if (kv[0] == 'clues-panel-lines') {
      cluesPanelLines = parseInt(kv[1])
      if (isNaN(cluesPanelLines)) {
        addError('Unexpected value in exolve-option: clue-panel-lines: ' + kv[1])
      }
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
  if (gridWidth < 1 || gridWidth > 25 || gridHeight < 1 || gridHeight > 25) {
    addError('Bad/missing width/height');
    return
  } else if (gridFirstLine < 0 || gridLastLine < gridFirstLine ||
             gridHeight != gridLastLine - gridFirstLine + 1) {
    addError('Mismatched width/height');
    return
  }
  for (let i = 0; i < gridHeight; i++) {
    let lineW = puzzleTextLines[i + gridFirstLine].toUpperCase().
                    replace(/[^A-Z.0]/g, '').length
    if (gridWidth != lineW) {
      addError('Width in row ' + i + ' is ' + lineW + ', not ' + gridWidth);
      return
    }
  }
  if (submitURL && submitKeys.length != answersList.length + 1) {
    addError('Have ' + submitKeys.length + ' submit paramater keys, need ' +
             (answersList.length + 1));
    return
  }
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
  for (let i = 0; i < gridHeight; i++) {
    grid[i] = new Array(gridWidth)
    let gridLine = puzzleTextLines[i + gridFirstLine].
                       replace(/\s/g, '').toUpperCase()
    let gridLineIndex = 0
    for (let j = 0; j < gridWidth; j++) {
      grid[i][j] = {};
      let letter = gridLine.charAt(gridLineIndex);
      if (letter != '.') {
        grid[i][j].isLight = true
        if (letter != '0') {
          letter = letter.toUpperCase()
          if (letter < 'A' || letter > 'Z') {
            addError('Bad grid entry: ' + letter);
            gridWidth = 0
            return
          }
          grid[i][j].solution = letter
        }
      } else {
        grid[i][j].isLight = false
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
      if (grid[i][j].isDiagramless && letter == '.') {
        grid[i][j].solution = '1'
      }
      if (grid[i][j].prefill &&
          (!grid[i][j].isLight || letter < 'A' || letter > 'Z')) {
        addError('Bad pre-filled cell (' + i + ',' + j +
                 ') with letter: ' + letter)
        return
      }
      if (grid[i][j].isDiagramless) {
        hasDiagramlessCells = true
      }
      if (letter == '0') {
        hasUnsolvedCells = true
      }
      if (letter >= 'A' && letter <= 'Z' && !grid[i][j].prefill) {
        hasSolvedCells = true
      }
    }
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
        clues['A' + nextClueNumber] =  {'cells': []}
      }
      if (startsDownClue(i, j)) {
        grid[i][j].startsDownClue = true
        grid[i][j].startsClueLabel = '' + nextClueNumber
        clues['D' + nextClueNumber] =  {'cells': []}
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
// len
// hyphenAfter[] (0-based indices)
// wordEndAfter[] (0-based indices)
// afterEnum index after enum
function parseEnum(clueLine) {
  let parse = {
    'len': 0,
    'wordEndAfter': [],
    'hyphenAfter': [],
    'afterEnum': clueLine.length,
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
    parse.len = parse.len + nextPart
    enumLeft = enumLeft.replace(/\s*\d+\s*/, '')
    let nextSymbol = enumLeft.substr(0, 1)
    if (nextSymbol == '-') {
      parse.hyphenAfter.push(parse.len - 1)
      enumLeft = enumLeft.substr(1)
    } else if (nextSymbol == ',') {
      parse.wordEndAfter.push(parse.len - 1)
      enumLeft = enumLeft.substr(1)
    } else if (nextSymbol == '\'') {
      enumLeft = enumLeft.substr(1)
    } else if (enumLeft.indexOf('’') == 0) {
      // Fancy apostrophe
      enumLeft = enumLeft.substr('’'.length)
    } else {
      break;
    }
  }
  return parse
}

// Parse a clue label from the start of clueLine.
// Return an object with the following properties:
// error
// clueLabel
// isNonNum
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
    parse.isNonNum = false
    parse.skip = numberParts[0].length
  } else {
    let bracOpenParts = clueLine.match(/^\s*\[/)
    if (!bracOpenParts || bracOpenParts.length != 1) {
      parse.error = 'Missing leading [ in non-numeric clue label in ' + clueLine
      return
    }
    let pastBracOpen = bracOpenParts[0].length
    let bracEnd = clueLine.indexOf(']')
    if (bracEnd < 0) {
      parse.error = 'Missing matching ] in clue label in ' + clueLine
      return
    }
    parse.clueLabel = clueLine.substring(pastBracOpen, bracEnd).trim()
    let temp = parseInt(parse.clueLabel)
    if (!isNaN(temp)) {
      parse.error = 'Numeric label not allowed in []: ' + clueLabel
      return
    }
    if (parse.clueLabel.charAt(parse.clueLabel.length - 1) == '.') {
       // strip trailing period
       parse.clueLabel = parse.clueLabel.substr(0, parse.clueLabel.length - 1).trim()
    }
    parse.isNonNum = true
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
// isNonNum
// children[]  (raw parseClueLabel() resutls, not yet clueIndices)
// clue
// len
// hyphenAfter[] (0-based indices)
// wordEndAfter[] (0-based indices)
// startCell[] optional, used in diagramless+unsolved and nonth -numeric labels
// anno (the part after the enum, if present)
function parseClue(dir, clueLine) {
  let parse = {};
  clueLine = clueLine.trim()
  if (clueLine.indexOf('#') == 0) {
    let startCell = parseCellLocation(clueLine.substr(1));
    if (startCell) {
      parse.startCell = startCell
    }  
    clueLine = clueLine.replace(/^#[a-z][0-9]*\s*/, '')
  }

  let clueLabelParse = parseClueLabel(clueLine)
  if (clueLabelParse.error) {
    addError(clueLabelParse.error)
    return
  }
  if (clueLabelParse.dir && clueLabelParse.dir != dir) {
    addError('Explicit dir ' + clueLabelParse.dir + ' does not match ' + dir + ' in clue: ' + clueLine)
    return
  }
  parse.clueLabel = clueLabelParse.clueLabel
  parse.isNonNum = clueLabelParse.isNonNum
  let clueIndex = dir + parse.clueLabel
  if (parse.isNonNum) {
    let nonNumIndex = dir + '#' + (nextNonNumId++)
    if (!nonNumClueIndices[parse.clueLabel]) {
      nonNumClueIndices[parse.clueLabel] = []
    }
    nonNumClueIndices[parse.clueLabel].push(nonNumIndex)
    clueIndex = nonNumIndex
  }
  parse.clueIndex = clueIndex

  clueLine = clueLine.substr(clueLabelParse.skip)
  parse.children = []
  while (clueLabelParse.hasChildren) {
    clueLabelParse = parseClueLabel(clueLine)
    if (clueLabelParse.error) {
      addError('Error in linked clue number/label: ' + clueLabelParse.error)
      return
    }
    parse.children.push(clueLabelParse)
    clueLine = clueLine.substr(clueLabelParse.skip)
  }

  let enumParse = parseEnum(clueLine)
  parse.len = enumParse.len
  parse.hyphenAfter = enumParse.hyphenAfter
  parse.wordEndAfter = enumParse.wordEndAfter
  parse.clue = clueLine.substr(0, enumParse.afterEnum).trim()
  parse.anno = clueLine.substr(enumParse.afterEnum).trim()

  return parse
}

// Parse across and down clues from their exolve sections previously
// identified by parseOverallDisplayMost().
function parseClueLists() {
  // Parse across, down, nodir clues
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
    let prev = null
    for (let l = first; l <= last; l++) {
      let clueLine = puzzleTextLines[l].trim();
      if (clueLine == '') {
        continue;
      }
      let clueParse = parseClue(clueDirection, clueLine)
      if (!clueParse.clueIndex) {
        addError('Could not parse clue: ' + clueLine);
        return
      }
      if (clues[clueParse.clueIndex] && clues[clueParse.clueIndex].clue) {
        addError('Clue entry already exists for clue: ' + clueLine);
        return
      }
      if (!clues[clueParse.clueIndex]) {
        clues[clueParse.clueIndex] =  {'cells': []}
      }
      clues[clueParse.clueIndex].clue = clueParse.clue
      clues[clueParse.clueIndex].clueLabel = clueParse.clueLabel
      clues[clueParse.clueIndex].isNonNum = clueParse.isNonNum
      clues[clueParse.clueIndex].displayLabel = clueParse.clueLabel
      clues[clueParse.clueIndex].clueDirection = clueDirection
      clues[clueParse.clueIndex].fullDisplayLabel = clueParse.clueLabel
      if (clueDirection != 'X' && clueParse.clueLabel) {
        clues[clueParse.clueIndex].fullDisplayLabel =
           clues[clueParse.clueIndex].fullDisplayLabel + clueDirection.toLowerCase()
      }
      clues[clueParse.clueIndex].children = clueParse.children
      clues[clueParse.clueIndex].childrenClueIndices = []
      clues[clueParse.clueIndex].len = clueParse.len
      clues[clueParse.clueIndex].hyphenAfter = clueParse.hyphenAfter
      clues[clueParse.clueIndex].wordEndAfter = clueParse.wordEndAfter
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
    }
  }
  for (let clueIndex in clues) {
    if (!clues.hasOwnProperty(clueIndex)) {
      continue
    }
    if (!clues[clueIndex].clue) {
      // A clue whose existence was inferred from the grid, but no actual
      // clue was provided, hopefully deliberately.
      continue
    }
    allClueIndices.push(clueIndex) 
  }
}

// For each cell grid[i][j], set {across,down}ClueLabels using previously
// marked clue starts. Adds clues to orphanClueIndices[] if warranted.
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
        if (!nonNumClueIndices[clueLabel]) {
          clueLabel = ''
          continue
        }
        clueIndex = ''
        for (ci of nonNumClueIndices[clueLabel]) {
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
        if (!nonNumClueIndices[clueLabel]) {
          clueLabel = ''
          continue
        }
        clueIndex = ''
        for (ci of nonNumClueIndices[clueLabel]) {
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
    if (!clues[clueIndex].cells || !clues[clueIndex].len ||
        !clues[clueIndex].cells.length) {
      orphanClueIndices.push(clueIndex) 
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
    // We also need to note the successor of he last cell from the parent
    // to the first child, and then from the first child to the next, etc.
    let lastRowCol = null
    if (clue.cells.length > 0) {
      lastRowCol = clue.cells[clue.cells.length - 1]
      // If we do not know the enum of this clue (likely a diagramless puzzle),
      // do not set successors.
      if (!clue.len || clue.len <= 0) {
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
      if (!child.isNonNum) {
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
        if (!nonNumClueIndices[child.clueLabel] ||
            nonNumClueIndices[child.clueLabel].length < 1) {
          addError('non-num child label ' + child.clueLabel + ' was not seen')
          return
        }
        childIndex = nonNumClueIndices[child.clueLabel][0]
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
          clue.fullDisplayLabel = clue.fullDisplayLabel + childIndex.charAt(0).toLowerCase()
        }
      }
      clue.childrenClueIndices.push(childIndex)
      let childClue = clues[childIndex]
      childClue.parentClueIndex = clueIndex

      if (lastRowCol && childClue.cells.length > 0) {
        let cell = childClue.cells[0]
        if (lastRowCol[0] == cell[0] && lastRowCol[1] == cell[1]) {
          addError('loop in successor for ' + lastRowCol)
          return
        } else {
          grid[lastRowCol[0]][lastRowCol[1]]['successor' + lastRowColDir] = {
            'cell': cell,
            'direction': childClue.clueDirection
          };
        }
      }

      lastRowCol = null
      if (childClue.cells.length > 0) {
        lastRowCol = childClue.cells[childClue.cells.length - 1]
        if (!childClue.len || childClue.len <= 0) {
          lastRowCol = null
        }
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
// are not empty.
function fixFullDisplayLabels() {
  for (let clueIndex of allClueIndices) {
    if (clues[clueIndex].fullDisplayLabel) {
      clues[clueIndex].fullDisplayLabel = clues[clueIndex].fullDisplayLabel + '. '
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
          if (!nonNumClueIndices[clueLabel]) {
            clueLabel = ''
            clueIndex = ''
            positionInClue = -1
            continue
          }
          for (ci of nonNumClueIndices[clueLabel]) {
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
        if (positionInClue == wordEndPos && j < gridWidth - 1) {
          grid[i][j].wordEndToRight = true
          break
        }
      }
      for (let hyphenPos of clues[clueIndex].hyphenAfter) {
        if (positionInClue == hyphenPos && j < gridWidth - 1) {
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
          if (!nonNumClueIndices[clueLabel]) {
            clueLabel = ''
            clueIndex = ''
            positionInClue = -1
            continue
          }
          for (ci of nonNumClueIndices[clueLabel]) {
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
        if (positionInClue == wordEndPos && i < gridHeight - 1) {
          grid[i][j].wordEndBelow = true
          break
        }
      }
      for (let hyphenPos of clues[clueIndex].hyphenAfter) {
        if (positionInClue == hyphenPos && i < gridHeight - 1) {
          grid[i][j].hyphenBelow = true
          break
        }
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
  for (let clueIndex of allClueIndices) {
    if (!clues[clueIndex].clue && !clues[clueIndex].parentClueIndex) {
      addError('Found no clue text nor a parent clue for ' + clueIndex)
      return
    }
    let table = null
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
      addError('Unexpected clue direction ' + clues[clueIndex].clueDirection + ' in ' + clueIndex)
      return
    }
    let tr = document.createElement('tr')
    let col1 = document.createElement('td')
    col1.innerHTML = clues[clueIndex].displayLabel
    let col2 = document.createElement('td')
    col2.innerHTML = clues[clueIndex].clue

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
    if (clues[clueIndex].cells.length > 0) {
      let i = clues[clueIndex].cells[0][0]
      let j = clues[clueIndex].cells[0][1]
      tr.addEventListener('click', getRowColDirActivator(
          i, j, clues[clueIndex].clueDirection));
    } else {
      // Fully diagramless. Just select clue.
      tr.addEventListener('click', getClueSelector(clueIndex));
    }
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
  svg.setAttributeNS(null, 'viewBox', '0 0 ' + boxWidth + ' ' + boxHeight)
  svg.setAttributeNS(null, 'width', boxWidth);
  svg.setAttributeNS(null, 'height', boxHeight);

  background.setAttributeNS(null, 'x', 0);
  background.setAttributeNS(null, 'y', 0);
  background.setAttributeNS(null, 'width', boxWidth);
  background.setAttributeNS(null, 'height', boxHeight);
  background.setAttributeNS(null, 'class', 'background');
  svg.appendChild(background);
}

// Return a string encoding the current entries in the whole grid and
// also the number of squares that have been filled.
function getGridStateAndNumFilled() {
  let state = '';
  let numFilled = 0
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      if (grid[i][j].isLight || grid[i][j].isDiagramless) {
        let letter = grid[i][j].currentLetter.trim()
        if (letter == '') {
           state = state + '0'
        } else {
           state = state + letter
           numFilled++
        }
      } else {
        state = state + '.'
      }
    }
  }
  return [state, numFilled];
}

// Update status, ensure answer fields are upper-case (when they have
// an enum), disable buttons as needed, and return the state.
function updateDisplayAndGetState() {
  let stateAndFilled = getGridStateAndNumFilled();
  let state = stateAndFilled[0]
  let numFilled = stateAndFilled[1]
  statusNumFilled.innerHTML = numFilled
  for (let a of answersList) {
    if (a.hasEnum) {
      a.input.value = a.input.value.toUpperCase()
    }
  }
  clearButton.disabled = (activeCells.length == 0)
  checkButton.disabled = (activeCells.length == 0)
  revealButton.disabled = (activeCells.length == 0)
  submitButton.disabled = (numFilled != numCellsToFill)
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
    for(let i = 0; i < ca.length; i++) {
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
        if (letter == '0') {
           grid[i][j].currentLetter = ''
        } else if (letter == '1') {
           if (!grid[i][j].isDiagramless) {
             console.log('Unexpected ⬛ in non-diagramless location');
             error = true
             break
           }
           grid[i][j].currentLetter = '1'
        } else {
           if (letter < 'A' || letter > 'Z') {
             console.log('Unexpected letter ' + letter + ' in state');
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
            continue
          }
          grid[i][j].currentLetter = ''
        }
      }
    }
  } else {
    // Also try to recover answers to questions
    if (state.substr(index, STATE_SEP.length) == STATE_SEP) {
      let parts = state.substr(index + STATE_SEP.length).split(STATE_SEP)
      if (parts.length == answersList.length) {
        for (let i = 0; i < parts.length; i++) {
          answersList[i].input.value = parts[i]
        }
      }
    }
  }
  let numFilled = 0
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      if (grid[i][j].isLight || grid[i][j].isDiagramless) {
        if (grid[i][j].currentLetter == '1') {
          grid[i][j].textNode.nodeValue = BLOCK_CHAR
        } else {
          grid[i][j].textNode.nodeValue = grid[i][j].currentLetter
        }
        if (grid[i][j].currentLetter != '') {
          numFilled++
        }
      }
    }
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
  for (let x of activeClues) {
    x.style.background = 'white'
  }
  activeCells = [];
  activeClues = [];
  currentClueIndex = null
  currentClue.innerHTML = ''
  currentClue.style.background = 'transparent'
  currentClue.style.top = '0'
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
    currentClue.style.top = '0'
    return
  }
  // gridInput is visible
  const cluePos = currentClue.getBoundingClientRect();
  const top = cluePos.top
  const clueParentPos = currentClueParent.getBoundingClientRect();
  const parentTop = clueParentPos.top
  // Reposition
  let newTop = 0
  // If parent is below viewport top, go back to standard position.
  if (parentTop >= 0) {
    currentClue.style.top = '0'
    return
  }
  currentClue.style.top = '' + (0 - parentTop) + 'px';
}

function activateCell(row, col) {
  deactivateCurrentCell();

  currentRow = row
  currentCol = col
  if (row < 0 || row >= gridHeight || col < 0 || col >= gridWidth) {
    return
  }
  if (!grid[row][col].isLight &&
      !grid[row][col].isDiagramless) {
    return;
  }

  gridInputWrapper.style.width = '' + SQUARE_DIM + 'px'
  gridInputWrapper.style.height = '' + SQUARE_DIM + 'px'
  gridInputWrapper.style.left = '' + grid[row][col].cellLeft + 'px'
  gridInputWrapper.style.top = '' + grid[row][col].cellTop + 'px'
  gridInput.value = grid[row][col].prefill ? '' : grid[row][col].currentLetter
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
  if (currentDirectionIsAcross && !grid[row][col].isDiagramless &&
      !grid[row][col].acrossClueLabel &&
      grid[row][col].downClueLabel) {
    currentDirectionIsAcross = false;
  }
  if (!currentDirectionIsAcross && !grid[row][col].isDiagramless &&
      !grid[row][col].downClueLabel &&
      grid[row][col].acrossClueLabel) {
    currentDirectionIsAcross = true;
  }
  if (currentDirectionIsAcross) {
    if (grid[row][col].acrossClueLabel) {
      activeClueLabel = grid[row][col].acrossClueLabel
      activeClueIndex = 'A' + activeClueLabel
    }
  } else {
    if (grid[row][col].downClueLabel) {
      activeClueLabel = grid[row][col].downClueLabel
      activeClueIndex = 'D' + activeClueLabel
    }
  }
  if (activeClueIndex != '') {
    if (!clues[activeClueIndex]) {
      activeCluwIndex = ''
      if (nonNumClueIndices[activeClueLabel]) {
        for (let ci of nonNumClueIndices[activeClueLabel]) {
          if (ci.charAt(0) == 'X' || ci.charAt(0) == activeClueIndex.charAt(0)) {
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
    selectClue(activeClueIndex)
  } else {
    // No active clue, activate just the cell and show all potential clues.
    showOrphanCluesAsActive()
    grid[row][col].cellRect.style.fill = ACTIVE_COLOUR
    activeCells.push([row, col])
  }
}

// For freezing row/col to deal with JS closure.
function getRowColActivator(row, col) {
  return function() { activateCell(row, col); };
}
function getRowColDirActivator(row, col, dir) {
  return function() {
    if (dir == 'A') {
      currentDirectionIsAcross = true
    } else {
      currentDirectionIsAcross = false
    } 
    activateCell(row, col);
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

// For freezing clueIndex to deal with JS closure.
function getClueSelector(clueIndex) {
  return function() {
    deactivateCurrentCell();
    selectClue(clueIndex);
  };
}
// Select a clicked clue.
function selectClue(activeClueIndex) {
  let clueIndices = getAllLinkedClueIndices(activeClueIndex)
  let indexForCurr = clueIndices[0]
  for (let clueIndex of clueIndices) {
    if (clues[clueIndex].anno) {
      // Even in unsolved grids, annos may be present as hints
      revealButton.disabled = false
    }
    for (let rowcol of clues[clueIndex].cells) {
      grid[rowcol[0]][rowcol[1]].cellRect.style.fill = ACTIVE_COLOUR
      activeCells.push(rowcol)
    }
    if (!clues[clueIndex].clueTR) {
      continue
    }
    clues[clueIndex].clueTR.style.background = ACTIVE_COLOUR
    if (cluesPanelLines > 0 &&
        isVisible(clues[clueIndex].clueTR.parentElement)) {
      clues[clueIndex].clueTR.scrollIntoView()
      gridInput.scrollIntoView()  // Else we may move away from the cell!
    }
    activeClues.push(clues[clueIndex].clueTR)
  }
  curr = clues[indexForCurr]
  if (!curr || !curr.clue) {
    showOrphanCluesAsActive()
    return
  }
  currentClueIndex = activeClueIndex
  currentClue.innerHTML = curr.fullDisplayLabel + curr.clue
  currentClue.style.background = ACTIVE_COLOUR;
  makeCurrentClueVisible();
}

function orphanCluesBrowse(incr) {
  if (orphanClueIndices.length <= 0) {
    return
  }
  posInOrphanClueIndices =
    (posInOrphanClueIndices + incr) % orphanClueIndices.length
  if (posInOrphanClueIndices < 0) {
    posInOrphanClueIndices += orphanClueIndices.length
  }
  showOrphanCluesAsActive()
}

// From a click in a  diagramless cell or a cell without a known clue
// association, show "current-clue" as a browsable widget with all clues.
function showOrphanCluesAsActive() {
  if (posInOrphanClueIndices >= orphanClueIndices.length) {
    return
  }
  let clueIndex = orphanClueIndices[posInOrphanClueIndices]
  let displayedClue = clues[clueIndex].fullDisplayLabel + clues[clueIndex].clue
  if (clues[clueIndex].parentClueIndex) {
    let parent = clues[clueIndex].parentClueIndex
    displayedClue = clues[parent].fullDisplayLabel + clues[parent].clue
  }
  currentClue.innerHTML =
    '<span>' +
    '<button class="small-button" onclick="orphanCluesBrowse(-1)">&lsaquo;</button>' +
    '<span title="You have to figure out which clue to use"> CLUES </span>' +
    '<button class="small-button" onclick="orphanCluesBrowse(1)">&rsaquo;</button>' +
    '</span> ' +
    displayedClue
  currentClue.style.background = ORPHAN_CLUES_COLOUR;
  makeCurrentClueVisible();
}

function toggleCurrentDirection() {
  // toggle direction
  if (currentRow < 0 || currentRow >= gridHeight ||
      currentCol < 0 || currentCol >= gridWidth) {
    return
  }
  if ((!grid[currentRow][currentCol].acrossClueLabel ||
       !grid[currentRow][currentCol].downClueLabel) &&
      !grid[currentRow][currentCol].isDiagramless) {
    return
  }
  currentDirectionIsAcross = !currentDirectionIsAcross
  activateCell(currentRow, currentCol)
}

// Handle navigation keys. Used by a listener, and also used to auto-advance
// after a cell is filled.
function handleKeyUpInner(key) {
  if (currentRow < 0 || currentRow >= gridHeight ||
      currentCol < 0 || currentCol >= gridWidth) {
    return
  }
  if (key == 8) {
    if (grid[currentRow][currentCol].currentLetter != '' &&
        !grid[currentRow][currentCol].prefill) {
      return
    }
    // backspace in an empty or prefilled cell
    if (currentDirectionIsAcross) {
      key = 37  // left
    } else {
      key = 38  // up
    }
  }
  if (key == 13) {
    // Enter
    toggleCurrentDirection()
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
  } else if (key == 221) {
    // ] or tab
    if (currentClueIndex && clues[currentClueIndex] &&
        clues[currentClueIndex].next) {
      let next = clues[currentClueIndex].next
      let cells = clues[next].cells
      if (cells && cells.length > 0) {
        activateCell(cells[0][0], cells[0][1])
      }
    }
  } else if (key == 219) {
    // [ or shift-tab
    if (currentClueIndex && clues[currentClueIndex] &&
        clues[currentClueIndex].prev) {
      let prev = clues[currentClueIndex].prev
      let cells = clues[prev].cells
      if (cells && cells.length > 0) {
        activateCell(cells[0][0], cells[0][1])
      }
    }
  }
}

function handleKeyUp(e) {
  let key = e.which || e.keyCode
  handleKeyUpInner(key)
}

// For tab/shift-tab in grid-input, we intercept KeyDown
function handleTabKeyDown(e) {
  let key = e.which || e.keyCode
  if (key == 9) {
    e.preventDefault()
    // tab. replace with [ or ]
    key = e.shiftKey ? 219 : 221
    handleKeyUpInner(key)
  }
}

function advanceCursor() {
  // First check if there is successor
  let successorProperty = 'successor' + (currentDirectionIsAcross ? 'A' : 'D')
  if (grid[currentRow][currentCol][successorProperty]) {
    let successor = grid[currentRow][currentCol][successorProperty]
    currentDirectionIsAcross = (successor.direction == 'A')
    activateCell(successor.cell[0], successor.cell[1]);
    return
   }
  if (currentDirectionIsAcross) {
    if (currentCol + 1 < gridWidth &&
        grid[currentRow][currentCol + 1].acrossClueLabel ==
            grid[currentRow][currentCol].acrossClueLabel) {
      handleKeyUpInner(39);
    }
  } else {
    if (currentRow + 1 < gridHeight &&
        grid[currentRow + 1][currentCol].downClueLabel ==
            grid[currentRow][currentCol].downClueLabel) {
      handleKeyUpInner(40);
    }
  }
}

function handleGridInput() {
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
  if (grid[currentRow][currentCol].currentLetter != '' &&
      newInput != grid[currentRow][currentCol].currentLetter) {
    // The "new" input may be before or after the old input.
    let index = newInput.indexOf(grid[currentRow][currentCol].currentLetter)
    if (index == 0) {
      newInput = newInput.substr(1)
    }
  }
  let keyChar = newInput.substr(0, 1)
  if (keyChar == ' ' && grid[currentRow][currentCol].isDiagramless) {
    // spacebar creates a blocked cell in a diagramless puzzle cell
    keyChar = BLOCK_CHAR
  } else {
    keyChar = keyChar.toUpperCase()
    if (keyChar < 'A' || keyChar > 'Z') {
      // Clear away any random input other than A-Z.
      keyChar = ''
    }
  }
  let letter = keyChar
  if (letter == BLOCK_CHAR) {
    letter = '1'
  }
  let oldLetter = grid[currentRow][currentCol].currentLetter
  grid[currentRow][currentCol].currentLetter = letter
  grid[currentRow][currentCol].textNode.nodeValue = keyChar
  gridInput.value = keyChar
  if (oldLetter == '1' || letter == '1') {
    let symRow = gridHeight - 1 - currentRow
    let symCol = gridWidth - 1 - currentCol
    if (grid[symRow][symCol].isDiagramless) {
      let symLetter = (letter == '1') ? '1' : ''
      let symChar = (letter == '1') ? BLOCK_CHAR : ''
      grid[symRow][symCol].currentLetter = symLetter
      grid[symRow][symCol].textNode.nodeValue = symChar
    }
  }
  updateAndSaveState()

  if (((letter >= 'A' && letter <= 'Z') || letter == '1') &&
      !grid[currentRow][currentCol].isDiagramless) {
    advanceCursor()
  }
}

function createListeners() {
  gridInput.addEventListener('keyup', function(e) {handleKeyUp(e);});
  gridInput.addEventListener('keydown', function(e) {handleTabKeyDown(e);});
  gridInput.addEventListener('input', handleGridInput);
  gridInput.addEventListener('click', toggleCurrentDirection);
  background.addEventListener('click', getRowColActivator(-1, -1));
  // Clicking on the title will also unselect current clue (useful
  // for barred grids where background is not visible).
  document.getElementById('title').addEventListener('click', getRowColActivator(-1, -1));
  window.addEventListener('scroll', makeCurrentClueVisible);
}

function displayGrid() {
  numCellsToFill = 0
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      const cellGroup =
          document.createElementNS('http://www.w3.org/2000/svg', 'g');
      if (grid[i][j].isLight || grid[i][j].isDiagramless) {
        numCellsToFill++
        const cellRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const cellLeft = GRIDLINE + j * (SQUARE_DIM + GRIDLINE);
        const cellTop = GRIDLINE + i * (SQUARE_DIM + GRIDLINE);
        cellRect.setAttributeNS(
            null, 'x', GRIDLINE + j * (SQUARE_DIM + GRIDLINE));
        cellRect.setAttributeNS(
            null, 'y', GRIDLINE + i * (SQUARE_DIM + GRIDLINE));
        cellRect.setAttributeNS(null, 'width', SQUARE_DIM);
        cellRect.setAttributeNS(null, 'height', SQUARE_DIM);
        cellRect.setAttributeNS(null, 'class', 'cell');
        cellGroup.appendChild(cellRect)

        const cellText =
            document.createElementNS('http://www.w3.org/2000/svg', 'text');
        cellText.setAttributeNS(
            null, 'x', LIGHT_START_X + j * (SQUARE_DIM + GRIDLINE));
        cellText.setAttributeNS(
            null, 'y', LIGHT_START_Y + i * (SQUARE_DIM + GRIDLINE));
        cellText.setAttributeNS(null, 'text-anchor', 'middle');
        cellText.setAttributeNS(null, 'editable', 'simple');
        let letter = ''
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
            null, 'cx', CIRCLE_RADIUS + GRIDLINE + j * (SQUARE_DIM + GRIDLINE));
        cellCircle.setAttributeNS(
            null, 'cy', CIRCLE_RADIUS + GRIDLINE + i * (SQUARE_DIM + GRIDLINE));
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
            null, 'x', NUMBER_START_X + j * (SQUARE_DIM + GRIDLINE));
        cellNum.setAttributeNS(
            null, 'y', NUMBER_START_Y + i * (SQUARE_DIM + GRIDLINE));
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
      if (grid[i][j].wordEndToRight) {
        const wordEndRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        wordEndRect.setAttributeNS(
            null, 'x',
            GRIDLINE + (j + 1) * (SQUARE_DIM + GRIDLINE) - SEP_WIDTH_BY2);
        wordEndRect.setAttributeNS(
            null, 'y', GRIDLINE + i * (SQUARE_DIM + GRIDLINE));
        wordEndRect.setAttributeNS(null, 'width', SEP_WIDTH);
        wordEndRect.setAttributeNS(null, 'height', SQUARE_DIM);
        wordEndRect.setAttributeNS(null, 'class', 'wordend');
        cellGroup.appendChild(wordEndRect)
        emptyGroup = false
      }
      if (grid[i][j].wordEndBelow) {
        const wordEndRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        wordEndRect.setAttributeNS(
            null, 'x', GRIDLINE + j * (SQUARE_DIM + GRIDLINE));
        wordEndRect.setAttributeNS(
            null, 'y',
            GRIDLINE + (i + 1) * (SQUARE_DIM + GRIDLINE) - SEP_WIDTH_BY2);
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
            GRIDLINE + (j + 1) * (SQUARE_DIM + GRIDLINE) - HYPHEN_WIDTH_BY2);
        hyphenRect.setAttributeNS(
            null, 'y', GRIDLINE + i * (SQUARE_DIM + GRIDLINE) +
            SQUARE_DIM_BY2 - SEP_WIDTH_BY2);
        hyphenRect.setAttributeNS(null, 'width', HYPHEN_WIDTH);
        hyphenRect.setAttributeNS(null, 'height', SEP_WIDTH);
        hyphenRect.setAttributeNS(null, 'class', 'wordend');
        cellGroup.appendChild(hyphenRect)
        emptyGroup = false
      }
      if (grid[i][j].hyphenBelow) {
        const hyphenRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hyphenRect.setAttributeNS(
            null, 'x', GRIDLINE + j * (SQUARE_DIM + GRIDLINE) +
            SQUARE_DIM_BY2 - SEP_WIDTH_BY2);
        hyphenRect.setAttributeNS(
            null, 'y',
            GRIDLINE + (i + 1) * (SQUARE_DIM + GRIDLINE) - HYPHEN_WIDTH_BY2);
        hyphenRect.setAttributeNS(null, 'width', SEP_WIDTH);
        hyphenRect.setAttributeNS(null, 'height', HYPHEN_WIDTH);
        hyphenRect.setAttributeNS(null, 'class', 'wordend');
        cellGroup.appendChild(hyphenRect)
        emptyGroup = false
      }
      if (grid[i][j].hasBarAfter) {
        const barRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        barRect.setAttributeNS(
            null, 'x',
            GRIDLINE + (j + 1) * (SQUARE_DIM + GRIDLINE) - BAR_WIDTH_BY2);
        barRect.setAttributeNS(
            null, 'y', GRIDLINE + i * (SQUARE_DIM + GRIDLINE));
        barRect.setAttributeNS(null, 'width', BAR_WIDTH);
        barRect.setAttributeNS(null, 'height', SQUARE_DIM);
        barRect.setAttributeNS(null, 'class', 'background');
        cellGroup.appendChild(barRect)
        emptyGroup = false
      }
      if (grid[i][j].hasBarUnder) {
        const barRect =
            document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        barRect.setAttributeNS(
            null, 'x', GRIDLINE + j * (SQUARE_DIM + GRIDLINE));
        barRect.setAttributeNS(
            null, 'y',
            GRIDLINE + (i + 1) * (SQUARE_DIM + GRIDLINE) - BAR_WIDTH_BY2);
        barRect.setAttributeNS(null, 'width', SQUARE_DIM);
        barRect.setAttributeNS(null, 'height', BAR_WIDTH);
        barRect.setAttributeNS(null, 'class', 'background');
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

function clearCurrent() {
  for (let x of activeCells) {
    let row = x[0]
    let col = x[1]
    if (grid[row][col].prefill) {
      continue
    }
    let oldLetter = grid[row][col].currentLetter
    if (oldLetter != '') {
      grid[row][col].currentLetter = ''
      grid[row][col].textNode.nodeValue = ''
      if (row == currentRow && col == currentCol) {
        gridInput.value = ''
      }
    }
    if (oldLetter == '1') {
      let symRow = gridHeight - 1 - row
      let symCol = gridWidth - 1 - col
      if (grid[symRow][symCol].isDiagramless) {
        grid[symRow][symCol].currentLetter = ''
        grid[symRow][symCol].textNode.nodeValue = ''
      }
    }
  }
  if (currentClueIndex) {
    let clueIndices = getAllLinkedClueIndices(currentClueIndex)
    for (let clueIndex of clueIndices) {
      if (clues[clueIndex].annoSpan) {
        clues[clueIndex].annoSpan.style.display = 'none'
      }
    }
  }
  updateAndSaveState()
}

function clearAll() {
  if (!confirm('Are you sure you want to clear the whole grid!?')) {
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
      grid[row][col].currentLetter = ''
      grid[row][col].textNode.nodeValue = ''
      if (row == currentRow && col == currentCol) {
        gridInput.value = ''
      }
    }
  }
  for (let a of answersList) {
    a.input.value = ''
  }
  for (let a of revelationList) {
    a.style.display = 'none'
  }
  hideNinas()
  updateAndSaveState()
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
    grid[row][col].currentLetter = ''
    grid[row][col].textNode.nodeValue = ''
    if (row == currentRow && col == currentCol) {
      gridInput.value = ''
    }
    if (oldLetter == '1') {
      let symRow = gridHeight - 1 - row
      let symCol = gridWidth - 1 - col
      if (grid[symRow][symCol].isDiagramless) {
        grid[symRow][symCol].currentLetter = ''
        grid[symRow][symCol].textNode.nodeValue = ''
      }
    }
  }
  if (allCorrect) {
    revealCurrent()  // calls updateAndSaveState()
  } else {
    updateAndSaveState()
  }
}

function checkAll() {
  if (!confirm('Are you sure you want to clear mistakes everywhere!?')) {
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
      grid[row][col].currentLetter = ''
      grid[row][col].textNode.nodeValue = ''
      if (row == currentRow && col == currentCol) {
        gridInput.value = ''
      }
    }
  }
  if (allCorrect) {
    revealAll()  // calls updateAndSaveState()
  } else {
    updateAndSaveState()
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
      let char = letter
      if (char == '1') {
        char = BLOCK_CHAR
      }  
      grid[row][col].textNode.nodeValue = char
      if (row == currentRow && col == currentCol) {
        gridInput.value = char
      }
    }
    if (oldLetter == '1' || letter == '1') {
      let symRow = gridHeight - 1 - row
      let symCol = gridWidth - 1 - col
      if (grid[symRow][symCol].isDiagramless) {
        let symLetter = (letter == '1') ? '1' : ''
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
  updateAndSaveState()
}

function revealAll() {
  if (!confirm('Are you sure you want to reveal the whole solution!?')) {
    return
  }
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridHeight; col++) {
      if (!grid[row][col].isLight && !grid[row][col].isDiagramless) {
        continue
      }
      if (grid[row][col].prefill) {
        continue
      }
      if (grid[row][col].currentLetter != grid[row][col].solution) {
        grid[row][col].currentLetter = grid[row][col].solution
        let char = grid[row][col].solution
        if (char == '1') {
          char = BLOCK_CHAR
        }  
        grid[row][col].textNode.nodeValue = char
        if (row == currentRow && col == currentCol) {
          gridInput.value = char
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
  updateAndSaveState()
}

function scratchPadInput() {
  let scratchPad = document.getElementById('scratchpad')
  scratchPad.value = scratchPad.value.toUpperCase()
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
     fullSubmitURL = fullSubmitURL + '&' + submitKeys[i + 1] + '=' +
                   encodeURIComponent(answersList[i].input.value.toUpperCase())
  }
  document.body.style.cursor = 'wait'
  window.location.replace(fullSubmitURL)
}

function displayButtons() {
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

