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

const VERSION = 'exolve v0.13 July 29 2019'

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
let submitURL = null
let submitKeys = []
let hasDiagramlessCells = false
let hasUnsolvedCells = false

const SQUARE_DIM = 31
const SQUARE_DIM_BY2 = 16
const GRIDLINE = 1
const BAR_WIDTH = 4
const BAR_WIDTH_BY2 = 2.5
const SEP_WIDTH = 2
const SEP_WIDTH_BY2 = 1.5
const HYPHEN_WIDTH = 9
const HYPHEN_WIDTH_BY2 = 5
const CIRCLE_RADIUS = 0.0 + SQUARE_DIM / 2.0

const NUMBER_START_X = 3
const NUMBER_START_Y = 11
const LIGHT_START_X = 16.5
const LIGHT_START_Y = 21.925

let answersList = []
let revelationList = []

let currentRow = -1
let currentCol = -1
let currentDirectionIsAcross = true
let activeCells = [];
let activeClues = [];
let numCellsToFill = 0

const BLOCK_CHAR = '⬛';
const ACTIVE_COLOUR = 'mistyrose'
const TRANSPARENT_WHITE = 'rgba(255,255,255,0.0)'

let nextPuzzleTextLine = 0

const STATE_SEP = 'eexxoollvvee'

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
let currentClue;
let currentClueParent;
let ninaGroup;
let statusNumFilled;
let statusNumTotal;
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
  puzzleTextLines = puzzleText.trim().split('\n');
  numPuzzleTextLines = puzzleTextLines.length

  svg = document.getElementById('grid');
  gridInputWrapper = document.getElementById('grid-input-wrapper');
  gridInput = document.getElementById('grid-input');
  questions = document.getElementById('questions');

  background =
    document.createElementNS('http://www.w3.org/2000/svg', 'rect');

  acrossClues = document.getElementById('across')
  downClues = document.getElementById('down')

  currentClue = document.getElementById('current-clue')
  currentClueParent = document.getElementById('current-clue-parent')
  ninaGroup = document.getElementById('nina-group')

  statusNumFilled = document.getElementById('status-num-filled')
  statusNumTotal = document.getElementById('status-num-total')

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

// Parse a question line and create the question element for it (which includes
// an input box for the answer). The solution answer may be provided after the
// last ')'.
function parseQuestion(s) {
  let enumParse = parseEnum(s)
  let inputLen = enumParse.len + enumParse.hyphenAfter.length +
                 enumParse.wordEndAfter.length
  let correctAnswer = s.substr(enumParse.afterEnum).trim()

  const question = document.createElement('div')
  question.setAttributeNS(null, 'class', 'question');
  const questionText = document.createElement('span')
  questionText.innerHTML = s.substr(0, enumParse.afterEnum)
  question.appendChild(questionText)
  question.appendChild(document.createElement('br'))
  const answer = document.createElement('input')
  answer.setAttributeNS(null, 'class', 'answer');
  answersList.push({
    'ans': correctAnswer,
    'input': answer,
    'hasEnum': (inputLen > 0),
  });
  if (inputLen == 0) {
    inputLen = '30'
  } else {
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
    answer.setAttributeNS(null, 'minlength', '' + inputLen);
  }
  answer.setAttributeNS(null, 'class', 'answer');
  answer.setAttributeNS(null, 'type', 'text');
  answer.setAttributeNS(null, 'maxlength', '' + inputLen);
  answer.setAttributeNS(null, 'size', '' + inputLen);
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
//   startsClueNumber
//   startsAcrossClue
//   startsDownClue
//   inAcrossClue: #
//   inDownClue: #
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
          hasSolvedCells = true
        }
      } else {
        grid[i][j].isLight = false
      }
      grid[i][j].hasBarAfter = false
      grid[i][j].hasBarUnder = false
      grid[i][j].hasCircle = false
      grid[i][j].isDiagramless = false
      gridLineIndex++
      let thisChar = ''
      while (gridLineIndex < gridLine.length &&
             (thisChar = gridLine.charAt(gridLineIndex)) &&
             (thisChar == '|' ||
              thisChar == '_' ||
              thisChar == '+' ||
              thisChar == '@' ||
              thisChar == '*' ||
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
      if (grid[i][j].isDiagramless) {
        hasDiagramlessCells = true
      }
      if (letter == '0') {
        hasUnsolvedCells = true
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

// Sets starts{Across,Down}Clue (boolean) and startsClueNumber (#) in
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
        grid[i][j].startsClueNumber = nextClueNumber
      }
      if (startsDownClue(i, j)) {
        grid[i][j].startsDownClue = true
        grid[i][j].startsClueNumber = nextClueNumber
      }
      if (grid[i][j].startsClueNumber) {
        nextClueNumber++
      }
    }
  }
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
      parse.afterEnum = enumEndLocation + 1
    }
    return parse
  }
  let enumEndLocation =
      enumLocation + clueLine.substr(enumLocation).indexOf(')')
  if (enumEndLocation <= enumLocation) {
    return parse
  }
  parse.afterEnum = enumEndLocation + 1
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

// Parse a single clue.
// Return an object with the following properties:
// clueIndex
// clueNumber
// children[]  (raw strings, not yet clueIndices)
// clue
// len
// hyphenAfter[] (0-based indices)
// wordEndAfter[] (0-based indices)
// startCell[] optional, used only in diagramless+unsolved
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
  parse.clueNumber = parseInt(clueLine)
  let clueIndex = dir + parse.clueNumber
  parse.clueIndex = clueIndex

  clueLine = clueLine.replace(/^\d*\s*/, '')
  parse.children = []
  while (clueLine.indexOf(',') == 0) {
    let child = clueLine.substr(1).trim().match(/[1-9]\d*[aAdD]?/)
    if (!child || child.length != 1) {
      break;
    }
    parse.children.push(child[0])
    clueLine = clueLine.replace(/^,\s*[1-9]\d*[aAdD]?\s*/, '')
  }

  let enumParse = parseEnum(clueLine)
  parse.len = enumParse.len
  parse.hyphenAfter = enumParse.hyphenAfter
  parse.wordEndAfter = enumParse.wordEndAfter
  parse.clue = clueLine.substr(0, enumParse.afterEnum)
  parse.anno = clueLine.substr(enumParse.afterEnum).trim()

  return parse
}

function checkClueLists() {
  if (acrossFirstLine < 0 || acrossLastLine < acrossFirstLine) {
    addError('Bad # across clues');
    return
  }
  if (downFirstLine < 0 || downLastLine < downFirstLine) {
    addError('Bad # down clues');
    return
  }
}

// Parse across and down clues from their exolve sections previously
// identified by parseOverallDisplayMost().
function parseClueLists() {
  // Parse across and down clues
  for (let clueDirection of ['A', 'D']) {
    let first, last
    if (clueDirection == 'A') {
      first = acrossFirstLine
      last = acrossLastLine
    } else {
      first = downFirstLine
      last = downLastLine
    }
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
      if (clues[clueParse.clueIndex]) {
        addError('Clue entry already exists for clue: ' + clueLine);
        return
      }
      clues[clueParse.clueIndex] =  {'cells': []}
      clues[clueParse.clueIndex].clue = clueParse.clue
      clues[clueParse.clueIndex].clueNumber = clueParse.clueNumber
      clues[clueParse.clueIndex].displayNumber = '' + clueParse.clueNumber
      clues[clueParse.clueIndex].clueDirection = clueDirection
      clues[clueParse.clueIndex].fullDisplayNumber = '' + clueParse.clueNumber + clueDirection
      clues[clueParse.clueIndex].children = clueParse.children
      clues[clueParse.clueIndex].childrenClueIndices = []
      clues[clueParse.clueIndex].len = clueParse.len
      clues[clueParse.clueIndex].hyphenAfter = clueParse.hyphenAfter
      clues[clueParse.clueIndex].wordEndAfter = clueParse.wordEndAfter
      clues[clueParse.clueIndex].anno = clueParse.anno
      if (clueParse.startCell) {
        let row = clueParse.startCell[0]
        let col = clueParse.startCell[1]
        grid[row][col].startsClueNumber = clueParse.clueNumber
        if (clueDirection == 'A') {
          grid[row][col].startsAcrossClue = true
        } else {
          grid[row][col].startsDownClue = true
        }
      }
    }
  }
}

// For each cell grid[i][j], set in{Across,Doen}Clue using previously
// marked clue starts.
function setClueMemberships() {
  // Set across clue memberships
  for (let i = 0; i < gridHeight; i++) {
    let clue = 0
    for (let j = 0; j < gridWidth; j++) {
      if (grid[i][j].startsAcrossClue) {
        clue = grid[i][j].startsClueNumber
      }
      if (clue == 0) {
        continue
      }
      if (!grid[i][j].isLight || grid[i][j].isDiagramless) {
        clue = 0;
        continue
      }
      let clueIndex = 'A' + clue
      if (!clues[clueIndex]) {
        addError('Could not find clue ' + clueIndex + ' for ' + i + ',' + j)
        return
      }
      clues[clueIndex].cells.push([i, j])
      grid[i][j].inAcrossClue = clue
    }
  }
  // Set down clue memberships
  for (let j = 0; j < gridWidth; j++) {
    let clue = 0
    for (let i = 0; i < gridHeight; i++) {
      if (grid[i][j].startsDownClue) {
        clue = grid[i][j].startsClueNumber
      }
      if (clue == 0) {
        continue
      }
      if (!grid[i][j].isLight || grid[i][j].isDiagramless) {
        clue = 0;
        continue
      }
      let clueIndex = 'D' + clue
      if (!clues[clueIndex]) {
        addError('Could not find clue ' + clueIndex + ' for ' + i + ',' + j)
        return
      }
      clues[clueIndex].cells.push([i, j])
      grid[i][j].inDownClue = clue
    }
  }
}

// For clues that have "child" clues (indicated like, '2, 13, 14' for parent 2,
// child 13, child 14), save the parent-child relationships, and successor grid
// cells for last cells in component clues, and spilled-over hyphenAfter and
// wordEndAfter locations.
function processClueChildren() {
  for (let clueIndex in clues) {
    if (!clues.hasOwnProperty(clueIndex)) {
      continue
    }
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
    for (let child of clue.children) {
      let childNumber = parseInt(child)
      if (isNaN(childNumber)) {
        addError('Bad child ' + child + ' in ' +
                 clue.clueNumber + clue.clueDirection);
        return
      }
      // Direction could be the same as the direction of the parent. Or,
      // if there is no such clue, then direction could be the other direction.
      // The direction could also be explicitly specified with a 'd' or 'a'
      // suffix.
      let childIndex = clue.clueDirection + childNumber
      if (!clues[childIndex]) {
        let otherDirection = (clue.clueDirection == 'A') ? 'D' : 'A'
        childIndex = otherDirection + childNumber
      }
      if (child.match(/\s*[1-9]\d*[aA]/)) {
        childIndex = 'A' + childNumber
      } else if (child.match(/\s*[1-9]\d*[dD]/)) {
        childIndex = 'D' + childNumber
      }
      if (!clues[childIndex] || childIndex == clueIndex) {
        addError('Invalid child ' + childIndex + ' in ' +
                 clue.clueNumber + clue.clueDirection);
        return
      }
      clue.displayNumber = clue.displayNumber + ', ' + child
      clue.fullDisplayNumber = clue.fullDisplayNumber + ', ' + childNumber + childIndex.charAt(0)
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

// Using hyphenAfter[] and wordEndAfter[] in clues, set
// {hyphen,wordEnd}{ToRight,Below} in grid[i][j]s.
function setGridWordEndsAndHyphens() {
  if (hasDiagramlessCells) {
    // Give up on this
    return
  }
  // Going across
  for (let i = 0; i < gridHeight; i++) {
    let clue = 0
    let clueIndex = ''
    let positionInClue = -1
    for (let j = 0; j < gridWidth; j++) {
      if (!grid[i][j].inAcrossClue) {
        clue = 0
        clueIndex = ''
        positionInClue = -1
        continue
      }
      if (clue == grid[i][j].inAcrossClue) {
        positionInClue++
      } else {
        clue = grid[i][j].inAcrossClue
        positionInClue = 0
        clueIndex = 'A' + clue
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
  // Down
  for (let j = 0; j < gridWidth; j++) {
    let clue = 0
    let clueIndex = ''
    let positionInClue = -1
    for (let i = 0; i < gridHeight; i++) {
      if (!grid[i][j].inDownClue) {
        clue = 0
        clueIndex = ''
        positionInClue = -1
        continue
      }
      if (clue == grid[i][j].inDownClue) {
        positionInClue++
      } else {
        clue = grid[i][j].inDownClue
        positionInClue = 0
        clueIndex = 'D' + clue
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

function displayClues() {
  // Populate clues tables. Check that we have all clues
  for (let clueIndex in clues) {
    if (!clues.hasOwnProperty(clueIndex)) {
      continue
    }
    if (!clues[clueIndex].clue && !clues[clueIndex].parentClueIndex) {
      addError('Found no clue text nor a parent clue for ' + clueIndex)
      return
    }
    let table =
        (clues[clueIndex].clueDirection == 'A') ? acrossClues : downClues
    let tr = document.createElement('tr')
    let col1 = document.createElement('td')
    col1.innerHTML = clues[clueIndex].displayNumber
    let col2 = document.createElement('td')
    col2.innerHTML = clues[clueIndex].clue
    if (clues[clueIndex].anno) {
      let anno = document.createElement('span')
      anno.setAttributeNS(null, 'class', 'anno-text');
      anno.innerHTML = ' ' + clues[clueIndex].anno
      anno.style.display = 'none'
      revelationList.push(anno)
      col2.appendChild(anno)
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

// Call updateDisplayAndGetState() and save state in cookie/location.hash.
function updateAndSaveState() {
  let state = updateDisplayAndGetState()
  for (let a of answersList) {
    state = state + STATE_SEP + a.input.value
  }

  let d = new Date();
  // Keep cookie for some days
  const KEEP_FOR_DAYS = 90
  d.setTime(d.getTime() + (KEEP_FOR_DAYS * 24 * 60 * 60 * 1000));
  let expires = 'expires=' + d.toUTCString();
  document.cookie = puzzleId + '=' + state + ';' + expires + ';path=/';
  if (location.protocol.substr(0, 4) != 'http') {
    // Also save in location.hash as Chrome does not support cookies on file:
    location.hash = '#' + state
  }
}

// Restore state from cookie (or location.hash).
function restoreState() {
  let state = ''
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
  if (!state) {
    state = decodeURIComponent(location.hash.substr(1))
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
  statusNumFilled.innerHTML = numFilled
  submitButton.disabled = (numFilled != numCellsToFill)
}

function deactivateCurrentCell() {
  gridInputWrapper.style.display = 'none'
  for (let x of activeCells) {
    let cellRect = grid[x[0]][x[1]].cellRect
    cellRect.style.fill = 'white'
  }
  for (let x of activeClues) {
    x.style.background = 'white'
  }
  activeCells = [];
  activeClues = [];
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
  let windowH = window.innerHeight || document.documentElement.clientHeight;
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
  // If parent is below viewport top, or no cells are active (because
  // of fully diagramless clue) go back to standard position.
  if (parentTop >= 0 || activeCells.length == 0) {
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
  gridInput.value = grid[row][col].currentLetter
  gridInputWrapper.style.display = ''
  gridInput.focus()
  // Try to place the cursor at the end
  if (gridInput.setSelectionRange) {
    let len = gridInput.value.length
    gridInput.setSelectionRange(len, len);
  }
  clearButton.disabled = false
  checkButton.disabled = false
  revealButton.disabled = false

  let activeClueIndex = ''
  // If the current direction does not have an active clue, toggle direction
  if (currentDirectionIsAcross && !grid[row][col].isDiagramless &&
      !grid[row][col].inAcrossClue &&
      grid[row][col].inDownClue) {
    currentDirectionIsAcross = false;
  }
  if (!currentDirectionIsAcross && !grid[row][col].isDiagramless &&
      !grid[row][col].inDownClue &&
      grid[row][col].inAcrossClue) {
    currentDirectionIsAcross = true;
  }
  if (currentDirectionIsAcross) {
    if (grid[row][col].inAcrossClue) {
      activeClueIndex = 'A' + grid[row][col].inAcrossClue
    }
  } else {
    if (grid[row][col].inDownClue) {
      activeClueIndex = 'D' + grid[row][col].inDownClue
    }
  }
  if (activeClueIndex != '') {
    selectClue(activeClueIndex)
  } else {
    // No active clue, activate just the cell.
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

// For freezing clueIndex to deal with JS closure.
function getClueSelector(clueIndex) {
  return function() {
    deactivateCurrentCell();
    selectClue(clueIndex);
  };
}
// Select a clicked clue.
function selectClue(activeClueIndex) {
  currentClue.innerHTML = clues[activeClueIndex].fullDisplayNumber + '. ' +
                          clues[activeClueIndex].clue
  let clueIndices = [activeClueIndex]
  if (clues[activeClueIndex].parentClueIndex) {
    let parent = clues[activeClueIndex].parentClueIndex
    currentClue.innerHTML = clues[parent].fullDisplayNumber + '. ' +
                            clues[parent].clue
    clueIndices = [parent].concat(clues[parent].childrenClueIndices)
  } else {
    clueIndices =
        clueIndices.concat(clues[activeClueIndex].childrenClueIndices)
  }
  currentClue.style.background = ACTIVE_COLOUR;
  for (let clueIndex of clueIndices) {
    for (let rowcol of clues[clueIndex].cells) {
      grid[rowcol[0]][rowcol[1]].cellRect.style.fill = ACTIVE_COLOUR
      activeCells.push(rowcol)
    }
    clues[clueIndex].clueTR.style.background = ACTIVE_COLOUR
    activeClues.push(clues[clueIndex].clueTR)
  }
  makeCurrentClueVisible();
}

function toggleCurrentDirection() {
  // toggle direction
  if (currentRow < 0 || currentRow >= gridHeight ||
      currentCol < 0 || currentCol >= gridWidth) {
    return
  }
  if ((!grid[currentRow][currentCol].inAcrossClue ||
       !grid[currentRow][currentCol].inDownClue) &&
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
    if (grid[currentRow][currentCol].currentLetter != '') {
      return
    }
    // backspace in an empty cell
    if (currentDirectionIsAcross) {
      key = 37  // left
    } else {
      key = 38  // up
    }
  }
  if (key == 39) {
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
}

function handleKeyUp(e) {
  let key = e.which || e.keyCode
  handleKeyUpInner(key)
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
    // auto-advance
    // First check if there is successor
    let successorProperty = 'successor' + (currentDirectionIsAcross ? 'A' : 'D')
    if (grid[currentRow][currentCol][successorProperty]) {
      let successor = grid[currentRow][currentCol][successorProperty]
      currentDirectionIsAcross = (successor.direction == 'A')
      activateCell(successor.cell[0], successor.cell[1]);
      return
    }
    if (currentDirectionIsAcross) {
      handleKeyUpInner(39);
    } else {
      handleKeyUpInner(40);
    }
  }
}

function createListeners() {
  gridInput.addEventListener('keyup', function(e) {handleKeyUp(e);});
  gridInput.addEventListener('input', handleGridInput);
  gridInput.addEventListener('click', toggleCurrentDirection);
  background.addEventListener('click', getRowColActivator(-1, -1));
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
        cellText.setAttributeNS(null, 'class', 'cell-text');
        const text = document.createTextNode('');
        cellText.appendChild(text);
        cellGroup.appendChild(cellText)

        grid[i][j].currentLetter = '';
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
      }
      if (grid[i][j].startsClueNumber && !grid[i][j].isDiagramless) {
        const cellNum =
            document.createElementNS('http://www.w3.org/2000/svg', 'text');
        cellNum.setAttributeNS(
            null, 'x', NUMBER_START_X + j * (SQUARE_DIM + GRIDLINE));
        cellNum.setAttributeNS(
            null, 'y', NUMBER_START_Y + i * (SQUARE_DIM + GRIDLINE));
        cellNum.setAttributeNS(null, 'class', 'cell-num');
        const num = document.createTextNode(grid[i][j].startsClueNumber)
        cellNum.appendChild(num);
        cellGroup.appendChild(cellNum)
      }
      svg.appendChild(cellGroup);
    }
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
  for (let x of activeCells) {
    let row = x[0]
    let col = x[1]
    let oldLetter = grid[row][col].currentLetter
    if (oldLetter == grid[row][col].solution) {
      continue
    }
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
  updateAndSaveState()
}

function checkAll() {
  if (!confirm('Are you sure you want to clear mistakes everywhere!?')) {
    return
  }
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      if (!grid[row][col].isLight && !grid[row][col].isDiagramless) {
        continue
      }
      if (grid[row][col].currentLetter == grid[row][col].solution) {
        continue
      }
      grid[row][col].currentLetter = ''
      grid[row][col].textNode.nodeValue = ''
      if (row == currentRow && col == currentCol) {
        gridInput.value = ''
      }
    }
  }
  updateAndSaveState()
}

function revealCurrent() {
  for (let x of activeCells) {
    let row = x[0]
    let col = x[1]
    let oldLetter = grid[row][col].currentLetter
    let letter = grid[row][col].solution
    if (oldLetter != letter) {
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

function submitSolution() {
  if (!confirm('Are you sure you are ready to submit!?')) {
    return
  }
  let state = updateDisplayAndGetState()
  let fullSubmitURL = submitURL + '&' + submitKeys[0] + '=' +
                      encodeURIComponent(state)
  for (let i = 0; i < answersList.length; i++) {
     fullSubmitURL = fullSubmitURL + '&' + submitKeys[i + 1] + '=' +
                     encodeURIComponent(answersList[i].input.value)
  }
  document.body.style.cursor = 'wait'
  window.location.replace(fullSubmitURL)
}

function displayButtons() {
  clearButton.disabled = true
  if (!hasUnsolvedCells) {
    checkButton.style.display = ''
    checkAllButton.style.display = ''
    revealButton.style.display = ''
    revealAllButton.style.display = ''

    checkButton.disabled = true
    revealButton.disabled = true
    submitButton.disabled = true
  }
  if (ninas.length > 0) {
    ninasButton.style.display = ''
  }
  if (submitURL) {
    submitButton.style.display = ''
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
  checkClueLists();
  parseClueLists();

  setClueMemberships();
  processClueChildren();
  setGridWordEndsAndHyphens();
  displayClues();
  displayGridBackground();
  createListeners();
  displayGrid();
  displayNinas();
  displayButtons();

  restoreState();
}

// ------ End functions.
