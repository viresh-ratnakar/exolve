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

The latest code and documentation for Exolve can be found at:
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
 * puzzleSpec is a string that contains the puzzle specs in the Exolve plain
 *     text format.
 * containerId is the optional HTML id of the container element in which you
 *     want to create this puzzle. If empty, the puzzle is created inside
 *     the element with id "exolve" if it exists (and its id is changed to
 *     exolve<N> in that case, where <N> is the index of this puzzle among
 *     all the pages on the page). If containerId is empty and there is no
 *     element with id "exolve", the puzzle is created at the end of the
 *     web page.
 * customizer is an optional function that will get called after the puzzle
 *     is set up. The Exolve object will be passed to the function.
 * provideStateUrl should be set to true if you also want to provide a URL
 *     that includes the current state and can be bookmarked or shared. Note
 *     that the puzzle state is always attempted to be saved in local storage.
 * visTop should be set to the height of any sticky/fixed position elements
 *     at the top of the page (normally just 0).
 * maxDim If non-zero, use this as the suggested max size of the container
 *    in px.
 * notTemp If false, state is not saved in local storage and some event
 *    listeners are not created. Useful for creating temporary/preview puzzles.
 *    Note that if you create a normal (notTemp=true) puzzle and your web page
 *    is going to destroy it for some reason during its normal course
 *    (ExolvePlayer does this, for example), then you should call destroy() on
 *    the puzzle object before removing all references to it. This will remove
 *    listeners for 'resize' and printing events, for example.
 */
function Exolve(puzzleSpec,
                containerId='',
                customizer=null,
                provideStateUrl=true,
                visTop=0,
                maxDim=0,
                notTemp=true) {
  this.VERSION = 'Exolve v1.63, May 13, 2025';
  this.id = '';

  this.puzzleText = puzzleSpec;
  this.containerId = containerId;
  this.customizer = customizer;
  this.provideStateUrl = provideStateUrl;
  this.notTemp = notTemp;

  this.gridWidth = 0;
  this.gridHeight = 0;
  this.layers3d = 1;
  this.h3dLayer = 0;
  this.angle3d = 55;
  this.skew3d = `skewX(${this.angle3d - 90}deg)`;
  this.offset3d = 0;
  this.ratio3d = 0.75;

  this.topClueClearance = 0;
  this.offsetLeft = 0;
  this.offsetTop = 0;

  /**
   * For the following, if found <= 0, then will be set in computeGridSize().
   */
  /** exolve-cell-size */
  this.cellW = 0;
  this.cellH = 0;
  /** exolve-grid-spacing */
  this.tilingW = 0;
  this.tilingH = 0;
  /** exolve-grid-bounds */
  this.boxW = 0;
  this.boxH = 0;

  this.squareDim = 0;

  this.MAX_GRID_SIZE = 100;
  this.GRIDLINE = 1;
  this.BAR_WIDTH = 3;
  this.BAR_WIDTH_BY2 = 2;
  this.SEP_WIDTH = 2;
  this.SEP_WIDTH_BY2 = 1.5;
  this.NUMBER_START_X = 2;
  this.MAX_REBUS_SIZE = 20;

  this.credits = [];
  this.questionTexts = [];

  /**
   * exolve-options that will fix any warnings that get triggered
   * for this puzzle.
   */
  this.optionsForWarningFixes = [];

  this.NINA_COLORS = [
    'blue',
    'green',
    'aqua',
    'fuchsia',
    'yellow',
    'crimson',
    'limegreen',
    'royalblue',
    'mediumturquoise',
    'mediumorchid',
    'goldenrod',
    'red',
  ];
  // Each nina will be object with props: colour and list (an array containing
  // location [i,j] pairs and/or span class names).
  this.ninas = [];
  // For span-class-specified ninas, ninaClassElements[] stores the elements
  // along with the colours to apply to them when showing the ninas.
  this.ninaClassElements = []
  this.forcedSeps = {
    'force-hyphen-right': [],
    'force-hyphen-below': [],
    'force-bar-right': [],
    'force-bar-below': [],
  }
  this.colourfuls = [];
  /** Cell decorator shapes created using exolve-cell-decorator: */
  this.cellDecs = [];
  /** Shaped cells created using exolve-shaped-cell: */
  this.shapedCells = [];

  this.ninaLines = [];
  this.colourLines = [];
  this.noRebusLines = [];

  this.grid = [];
  this.clues = {};
  this.title = null;
  this.setter = null;
  this.email = null;
  this.notes = {
    'clues': {},
    'solved': {},
    'counter': 0,
  };
  this.submitURL = null;
  this.submitKeys = [];
  this.hasDgmlessCells = false;
  this.hasUnsolvedCells = false;
  this.hasReveals = false;
  this.hasAcrossClues = false;
  this.hasDownClues = false;
  this.hasZ3dClues = false;
  this.hasNodirClues = false;
  this.hasPlaceholders = false;
  /** Do all clues have enums with lengths specified? */
  this.allCluesHaveEnums = false;
  this.reversals = {};
  this.usedReversals = {};
  // Clues labeled non-numerically (like [A] a clue...) use this to create a
  // unique clueIndex.
  this.nextNonNumId = 1;
  this.offNumClueIndices = {};
  // Objects with keys being JSON arrays of cells, mapping to orphan clues
  // they belong to, for revealing.
  this.cellsToOrphan = {};
  this.szCellsToOrphan = 0;

  this.visTop = visTop;
  this.maxDim = maxDim;
  this.cluesBoxWidth = 0;

  this.answersList = [];
  this.revelationList = [];
  this.inClueAnnoReveals = {};

  // State of navigation
  this.currRow = -1;
  this.currCol = -1;
  this.currDir = 'A';
  this.currClueIndex = null;
  this.usingGnav = false;
  this.lastOrphan = null;
  this.activeCells = [];
  this.activeClues = [];
  this.showingNinas = false;
  // Couple of vars to get long click on check/reveal to use just a cell.
  this.cellLightToggleTimer = null;
  this.cellNotLight = false;

  /**
   * Multi-char-entry related vars:
   */
  this.multiLetter = false;
  this.multiLetterCellRow = -1;
  this.multiLetterCellCol = -1;
  this.lastKeyHadShift = false;

  /**
   * If exolve-alternatives groups are present, this object captures the
   * alternative groups. The altsSpecs array is used during the first
   * parse to remember all the exolve-alternatives lines (need to know
   * dimensions and grid structure before they can be parsed and checked).
   */
  this.alts = null;
  this.altsSpecs = [];

  this.numCellsToFill = 0;
  this.numCellsFilled = 0;
  this.numCellsPrefilled = 0;
  this.knownCorrect = false;
  this.knownIncorrect = false;

  this.allClueIndices = [];
  this.PLACEHOLDER_BLANK_LEN = 15;

  this.BLOCK_CHAR = '⬛';
  // If someone wants to use 0/1/./? using allow-chars, we cannot use them in
  // the state char space as they have special meanings there. Use unprintable
  // characters:
  this.SPECIAL_STATE_CHARS = {
    '0': String.fromCharCode(1),
    '1': String.fromCharCode(2),
    '.': String.fromCharCode(3),
    '?': String.fromCharCode(4)
  };
  this.SPECIAL_DISPLAY_CHARS = {};
  for (let x in this.SPECIAL_STATE_CHARS) {
    this.SPECIAL_DISPLAY_CHARS[this.SPECIAL_STATE_CHARS[x]] = x;
  };

  this.scriptRE = null;
  this.scriptLowerCaseRE = null;

  /**
   * Font details for clues text.
   * If fontFamily/fontSize are not set, the CSS rule sets them to serif/16px.
   */
  this.fontFamily = '';
  this.fontSize = '';

  this.smartColoring = true;
  this.lightColorScheme = {
    'active': 'mistyrose',
    'active-clue': 'mistyrose',
    'anno': 'darkgreen',
    'hint': 'dodgerblue',
    'hint-bulb': 'dodgerblue',
    'arrow': 'white',
    'background': 'black',
    'button': '#4caf50',
    'button-hover': 'darkgreen',
    'button-text': 'white',
    'caret': 'gray',
    'cell': 'white',
    'circle': 'gray',
    'circle-input': 'gray',
    'currclue': 'white',
    'def-underline': '#3eb0ff',
    'imp-text': 'darkgreen',
    'input': '#ffb6b4',
    'light-label': 'black',
    'light-label-input': 'black',
    'light-text': 'black',
    'light-text-input': 'black',
    'orphan': 'linen',
    'overwritten-end': '#bb00bb',
    'overwritten-start': '#ff00ff',
    'prefill': 'blue',
    'separator': 'blue',
    'small-button': 'inherit',
    'small-button-hover': 'lightpink',
    'small-button-text': 'darkgreen',
    'solution': 'dodgerblue',
    'solved': 'dodgerblue',
  };
  this.darkColorScheme = {
    ...this.lightColorScheme,
    'currclue': 'black',
    'active-clue': '#663366',
    'orphan': '#663300',
    'anno': 'lightgreen',
    'imp-text': 'lightgreen',
    'small-button-hover': '#330066',
    'small-button-text': 'lightgreen',

  }
  this.colorScheme = this.lightColorScheme;

  this.nextLine = 0;
  this.sectionLines = {};

  this.STATE_SEP = 'xlv';
  this.STATES_SEP = 'xxllvv';  // xxllvv<id1>......xxllvv<id2>.....

  this.textLabels = {
    'clear': 'Clear this',
    'clear.hover': 'Clear highlighted clues and squares. Clear crossers ' +
        'from full clues with a second click. Shortcut: Ctrl-q.',
    'clear-all': 'Clear all!',
    'clear-all.hover': 'Clear everything! A second click clears any ' +
        'placeholder entries in clues. Shortcut: Ctrl-Q.',
    'check': 'Check this',
    'check.hover': 'Erase mistakes in highlighted cells. Long-click to ' +
        'check just the current cell.',
    'checkcell': 'Check cell',
    'checkcell.hover': 'Erase the current cell if it\'s incorrect.',
    'check-all': 'Check all!',
    'check-all.hover': 'Erase all mistakes. Reveal any available annos if ' +
        'no mistakes.',
    'copy-notes': 'Copy notes',
    'copy-notes.hover': 'Copy these notes to the clipboard, including any formatting.',
    'email-notes': 'Email notes',
    'email-notes.hover': 'Compose an email containing these notes as plain text. ' +
        'You can edit the draft before sending.',
    'email-notes-recipients.hover': ' Draft recipient(s): ',
    'reveal': 'Reveal this',
    'reveal.hover': 'Reveal highlighted clue/cells. Long-click to reveal ' +
        'just the current cell.',
    'revealcell': 'Reveal cell',
    'revealcell.hover': 'Reveal the solution letter in the current cell.',
    'show-ninas': 'Show ninas',
    'show-ninas.hover': 'Show ninas hidden in the grid/clues.',
    'hide-ninas': 'Hide ninas',
    'hide-ninas.hover': 'Hide ninas shown in the grid/clues.',
    'reveal-all': 'Reveal all!',
    'reveal-all.hover': 'Reveal all solutions, available annos, answers, ' +
        'notes!',
    'hint-bulb.hover': 'Click to see a hint.',
    'hint-bulb-another.hover': 'Click to see another hint.',
    'hint.hover': 'Click to hide hints.',
    'hint': 'Hint',
    'hint-bulb': '&#128161;',
    'submit': 'Submit',
    'submit.hover': 'Submit the solution!',
    'setter-by': 'By',
    'curr-clue-prev': '&lsaquo;',
    'curr-clue-prev.hover': 'Previous clue.',
    'curr-clue-next': '&rsaquo;',
    'curr-clue-next.hover': 'Next clue.',
    'squares-filled': 'Squares filled',
    'across-label': 'Across',
    'down-label': 'Down',
    '3d-ac-label': 'Across & Back',
    '3d-aw-label': 'Away & Towards',
    '3d-dn-label': 'Down & Up',
    'nodir-label': 'Other',
    'tools-link': 'Exolve',
    'tools-link.hover': 'Crossword software: ' +
        this.VERSION + ': Show/hide panel with info/help and links to report ' +
        'a bug, manage storage, etc.',
    'tools-msg': `
       <p>Control keys:</p>
       <ul>
         <li><b>Tab/Shift-Tab:</b>
             Jump to the next/previous clue.</li>
         <li><b>Enter, Click/Tap:</b> Toggle current direction.</li>
         <li><b>Arrow keys:</b>
             Move to the nearest light square in that direction.</li>
         <li><b>Ctrl-q:</b> Clear this, <b>Ctrl-Q:</b> Clear All!,
             <b>Ctrl-B:</b> Print crossword, <b>Ctrl-/:</b> Jump to/back-from
             notes, <b>Ctrl-*:</b> Mark clue as fave in notes, adding a *
             prefix.</li>
         <li><b>Delete:</b>
             Clear the contents of the current square.</li>
         <li><b>Spacebar:</b>
             Place block in the current square if it's diagramless.</li>
         <li><b>Double-click or Shift+Letter:</b>
             If the puzzle has rebus cells, this is the way to enter
             multiple letters into a single cell.</li>
       </ul>
       <p>
         Overwritten letters will briefly be coloured like
         <b style="background:white;color:${this.colorScheme['overwritten-start']}">this</b>
         (before fading back to 
         <b style="background:white;color:${this.colorScheme['light-text']}">this</b>)
         just to draw your attention so that you can fix any accidental
         typing errors.
       </p>`,
    'alts.hover': 'This is an alternative solution to the clue. Clicking on it ' +
        'will set any currently visible letters in it to this variant. If ' +
        'the setter has created an alternative solution group with more than one ' +
        'cell (group numbers are shown in superscripts of solution variants) ' +
        'then clicking will set all revealed visible letters in the group to ' +
        'reflect this variant. ',
    'crossword-id': 'Crossword ID',
    'notes': 'Notes',
    'notes.hover': 'Show/hide notes panel.',
    'notes-help': '<li>Ctrl-/ takes you to the current clue\'s notes ' +
        '(or overall notes) and back (if already there).</li><li>Ctrl-* ' +
        'adds a * prefix to the current clue\'s notes.</li><li>Hovering ' +
        'over a clue\'s notes shows the clue as a tooltip.</li>',
    'jotter': 'Jotter',
    'jotter.hover': 'Show/hide a jotting pad that also lets you try out anagrams and subtractions.',
    'jotter-text.hover': 'You can shuffle letters by clicking above. If you enter something like [Alphabet - betas =] then it will be replaced by [lpha - s] (subtraction of common letters).',
    'maker-info': 'Exolve-maker info',
    'manage-storage': 'Manage local storage',
    'manage-storage.hover': 'View puzzle Ids for which state has been saved. ' +
        'Delete old saved states to free up local storage space if needed.',
    'manage-storage-close': 'Close (local storage)',
    'manage-storage-close.hover': 'Close the local storage management panel.',
    'exolve-link': 'Exolve-on-GitHub',
    'exolve-link.hover': 'Visit the Exolve open-source repository on GitHub, with a ' +
        'detailed user guide.',
    'report-bug': 'Report-Bug',
    'report-bug.hover': 'Report a bug on the GitHub page for Exolve',
    'exolve-exet-etc': 'Community',
    'exolve-exet-etc.hover': 'Exolve-Exet-Etc: a Google Group to get release updates, discuss usage and features for Exolve, Exet, etc.',
    'webifi': 'Webifi',
    'webifi.hover': 'Toggle Webifi, the interactive-fictionesque text/audio interface.',
    'saving-msg': 'Your entries are auto-saved in the browser\'s local ' +
        'storage.',
    'saving-bookmark': 'You can share the state using this link:',
    'saving-url': 'URL',
    'shuffle': 'Jotting pad: (click here to shuffle)',
    'shuffle.hover': 'Shuffle selected text (or all text, if none selected).',
    'across-letter': 'a',
    'back-letter': 'b',
    'down-letter': 'd',
    'up-letter': 'u',
    '3d-ac': 'ac',
    '3d-ba': 'ba',
    '3d-aw': 'aw',
    '3d-to': 'to',
    '3d-dn': 'dn',
    '3d-up': 'up',
    'mark-clue.hover': 'Click to forcibly mark/unmark as solved.',
    'curr-clue-prev': '&lsaquo;',
    'curr-clue-prev.hover': 'Previous clue.',
    'curr-clue-next': '&rsaquo;',
    'curr-clue-next.hover': 'Next clue.',
    'placeholder.hover': 'You can record your solution here before copying ' +
        'to squares.',
    'placeholder-copy': '&#8690;',
    'placeholder-copy.hover': 'Copy into currently highlighted squares.',
    'confirm-clear-all': 'Are you sure you want to clear every entry!?',
    'confirm-clear-all-orphans1': 'Are you sure you want to clear every ' +
        'entry!?  (Placeholder entries in clues will not be cleared. To clear ' +
        'the placeholders, click on clear-all again after clearing the grid.)',
    'confirm-clear-all-orphans2': 'Are you sure you want to clear every ' +
        'entry including all the placeholder entries in clues!?',
    'confirm-check-all': 'Are you sure you want to clear mistakes everywhere!?',
    'confirm-mismatched-copy': 'Are you sure you want to do this mismatched ' +
        'copy (#letters-from : #squares-to)? ',
    'confirm-show-ninas': 'Are you sure you want to reveal the nina(s)!?',
    'confirm-reveal-all': 'Are you sure you want to reveal the whole ' +
        'solution!?',
    'confirm-submit': 'Are you sure you are ready to submit!?',
    'confirm-incomplete-submit': 'Are you sure you want to submit an ' +
        'INCOMPLETE solution!?',
    'confirm-delete-id': 'Delete puzzle state for puzzle id',
    'confirm-delete-older': 'Delete all puzzle states saved before',
    'confirm-state-override': 'Do you want to override the state saved in ' +
        'this device with the state found in the URL?',
    'warnings-label': 'Please fix, or use "ignore-unclued" / ' +
        '"ignore-enum-mismatch" <a href="https://github.com/viresh-ratnakar/' +
        'exolve/blob/master/README.md#exolve-option">options</a>:',
    'warnings.hover': 'Issues detected: click on [&times;] to dismiss.',
    'print': 'Print',
    'print.hover': 'Show/hide panel for printing or creating a PDF or saving grid image to SVG file.',
    'print-heading': 'Print or create a PDF:',
    'print-size': 'Page size:',
    'print-only-grid': 'Only grid',
    'print-only-clues': 'Only clues',
    'print-all': 'Grid and clues',
    'print-margin': 'Margin (inches, up to 4 numbers):',
    'print-margin.hover': 'The numbers are in inches, and are for top, right, bottom, ' +
                          'left. Missing numbers are taken from symmetry or last available values.',
    'print-font': 'Font size:',
    'print-font-normal': 'Normal',
    'print-font-large': 'Large',
    'print-font-xlarge': 'Extra Large',
    'print-font-small': 'Small',
    'print-font-other': 'Other',
    'print-crossword': 'Print crossword',
    'print-crossword.hover': 'Print just this crossword, hiding any content outside it (Ctrl-B).',
    'print-page': 'Print page',
    'print-page.hover': 'Print the whole page (Ctrl-p or Cmd-p).',
    'print-page-wysiwyg': 'Print wysiwyg',
    'print-page-wysiwyg.hover': 'Print the whole page without reformatting the crossword.',

    'print-title': 'Title',
    'print-setter': 'Setter',
    'print-preamble': 'Preamble',
    'print-explanations': 'Explanations',
    'print-copyright': 'Copyright',
    'print-questions': 'Questions',
    'print-header': 'Extra header',
    'print-header.hover': 'Any HTML you provide here will be inserted in the beginning of the puzzle frame before printing',
    'print-footer': 'Extra footer',
    'print-footer.hover': 'Any HTML you provide here will be inserted at the end of the puzzle frame before printing',
    'print-grid-scale': 'Force grid scale to:',
    'print-grid-scale.hover': 'Instead of figuring out a good grid-scale factor (from width/height/etc.), force it to this value.',

    'print-inksaver': 'Inksaver',
    'print-url-qrcodes': 'Convert Explanations URLs to QR codes',
    'print-url-qrcodes-heading': 'Links',
    'print-qrcode': 'Add QR code for this puzzle\'s URL',
    'print-qrcode-details': 'The QR code (rendered to the right) will be printed to the ',
    'print-qrcode-in-botleft': 'bottom-left of the page',
    'print-qrcode-in-botright': 'bottom-right of the page',
    'print-qrcode-cta-label': 'Call to action',
    'print-qrcode-cta': 'Online version',
    'print-qrcode-size': 'QR code size:',
    'print-grid-svg': 'Print grid to SVG file:',
    'print-grid-svg-file-name': 'exolve-grid.svg',
    'print-grid-svg-save': 'Save as',
    'show-notes-seq': 'Show clue-solving sequence:',
    'show-notes-entries': 'Show entered solutions:',
    'show-notes-times': 'Show clue-solving times:',
  };

  /**
   * The URL prefix for loading scripts. Either is empty, or ends with '/'.
   */
  this.scriptUrlBase = '';
  const scriptTags = document.getElementsByTagName('script');
  for (let i = 0; i < scriptTags.length; i++) {
    const src = scriptTags[i].src;
    const loc = src.lastIndexOf('/exolve-m.js');
    if (loc >= 0) {
      this.scriptUrlBase = src.substring(0, loc + 1);
      break;
    }
  }

  /** Printing-related */
  this.printingChanges = null;
  this.printAsIs = false;
  this.printOnlyCrossword = false;

  // Variables set by exolve-option
  this.extractionSlots = 0;
  this.hideInferredNumbers = false;
  this.cluesPanelLines = -1;
  this.allowChars = null;
  this.hideCopyPlaceholders = false;
  this.addSolutionToAnno = true;
  this.language = '';
  this.languageScript = '';
  this.langMaxCharCodes = 1;
  this.hasRebusCells = false;
  this.ignoreUnclued = false;
  this.ignoreEnumMismatch = false;
  this.showCellLevelButtons = false;
  this.printCompleted3Cols = false;
  this.printIncomplete2Cols = false;
  this.noNinaButton = false;
  this.useWebifi = false;
  this.hltOverwrittenMillis = 5000;
  this.colourOnlyCellBottom = false;

  this.createPuzzle();
}

/**
 * Do clean-up: remove from exolvePuzzles[], remove window listeners.
 * This only needs to be called if you have a web page from which
 * you destroy and create new Exolve puzzles repeatedly (such as
 * ExolvePlayer).
 *
 * Pass deleteState as true if this was truly a temp puzzle (such
 * as a preview) whose state will not need to be recovered later.
 */
Exolve.prototype.destroy = function(deleteState=false) {
  if (this.frame) {
    this.frame.innerHTML = '';
    this.frame = null;
  }
  if (exolvePuzzles && this.id && exolvePuzzles[this.id]) {
    delete exolvePuzzles[this.id];
  }
  if (this.windowListeners) {
    for (let e in this.windowListeners) {
      window.removeEventListener(e, this.windowListeners[e]);
    }
    this.windowListeners = {};
  }
  if (deleteState) {
    window.localStorage.removeItem('xlvstate:' + this.id);
  }
}

/**
 * Create the basic HTML structure.
 * Set up globals, version number and user agent in bug link.
 */
Exolve.prototype.init = function() {
  this.parseOverall();
  this.parseRelabel();
  this.computeGridSize();

  const SPECIAL_ID = '42xlvIndex42';

  if (this.id && this.id == SPECIAL_ID) {
    this.throwErr('Puzzle id cannot be: ' + this.id);
  }
  if (!exolvePuzzles) {
    exolvePuzzles = {};
    exolvePuzzles[SPECIAL_ID] = 1;
  }
  this.index = exolvePuzzles[SPECIAL_ID]++;
  this.prefix = 'xlv' + this.index;

  const basicHTML = `
    <div class="xlv-frame xlv-flex-col" tabindex="-1" id="${this.prefix}-frame">
      <h2 id="${this.prefix}-title" class="xlv-title"></h2>
      <div id="${this.prefix}-setter" class="xlv-setter"></div>
      <div id="${this.prefix}-preamble" class="xlv-preamble"></div>
      <div id="${this.prefix}-clear-area" class="xlv-clear-area"></div>
      <div id="${this.prefix}-grid-and-clues" class="xlv-grid-and-clues-flex">
        <div id="${this.prefix}-grid-panel" class="xlv-grid-panel">
          <div id="${this.prefix}-grid-parent-centerer"
              class="xlv-grid-parent-centerer">
            <div id="${this.prefix}-curr-clue" class="xlv-curr-clue"
                style="display:none">
              <div id="${this.prefix}-curr-clue-inner"
                  class="xlv-curr-clue-inner">
              </div>
            </div>
            <div id="${this.prefix}-grid-parent" class="xlv-grid-parent">
              <svg id="${this.prefix}-grid" class="xlv-grid"
                  zoomAndPan="disable"></svg>
              <div id="${this.prefix}-grid-input-wrapper"
                  class="xlv-grid-input-wrapper"
                  style="display:none;left:0;top:0"><input
                      id="${this.prefix}-grid-input" type="text"
                      autocomplete="off" spellcheck="false"
                      class="xlv-grid-input xlv-cell-text"/></div>
              <div id="${this.prefix}-nina-group"
                  style="display:none;left:0;top:0"></div>
              <div id="${this.prefix}-colour-group"
                  style="display:none;left:0;top:0"></div>
            </div> <!-- xlv-grid-parent -->
          </div> <!-- xlv-grid-parent-centerer -->
          <div id="${this.prefix}-controls-etc" class="xlv-controls-etc">
            <div id="${this.prefix}-controls" class="xlv-controls xlv-wide-box">
              <div id="${this.prefix}-button-row-1" class="xlv-controls-row">
                <button id="${this.prefix}-clear"
                    class="xlv-button">${this.textLabels['clear']}</button>
                <button id="${this.prefix}-clear-all"
                    class="xlv-button">${this.textLabels['clear-all']}</button>
                <button id="${this.prefix}-check" class="xlv-button"
                    style="display:none">${this.textLabels['check']}</button>
                <button id="${this.prefix}-check-all" class="xlv-button"
                  style="display:none">${this.textLabels['check-all']}</button>
              </div> <!-- xlv-button-row-1 -->
              <div id="${this.prefix}-buttons-extra-row" class="xlv-controls-row"
                    style="display:none">
                <button id="${this.prefix}-checkcell" class="xlv-button"
                    style="display:none">${this.textLabels['checkcell']}</button>
                <button id="${this.prefix}-revealcell" class="xlv-button"
                    style="display:none">${this.textLabels['revealcell']}</button>
              </div>
              <div id="${this.prefix}-button-row-2" class="xlv-controls-row">
                <button id="${this.prefix}-reveal" class="xlv-button"
                    style="display:none">${this.textLabels['reveal']}</button>
                <button id="${this.prefix}-ninas" class="xlv-button"
                  style="display:none">${this.textLabels['show-ninas']}</button>
                <button id="${this.prefix}-reveal-all" class="xlv-button"
                  style="display:none">${this.textLabels['reveal-all']}</button>
              </div> <!-- xlv-button-row-2 -->
            </div> <!-- xlv-controls -->
            <div id="${this.prefix}-errors" class="xlv-errors"></div>
            <div id="${this.prefix}-status" class="xlv-status">
              <span id="${this.prefix}-squares-filled"
                  >${this.textLabels['squares-filled']}</span>:
              <span id="${this.prefix}-status-num-filled">0</span>/<span
                    id="${this.prefix}-status-num-total"></span>
            </div> <!-- xlv-status -->
            <div id="${this.prefix}-small-print"
                class="xlv-wide-box xlv-small-print">
              <a id="${this.prefix}-tools-link" href="" class="xlv-link"
                  title="${this.textLabels['tools-link.hover']}"
                  >${this.textLabels['tools-link']}</a>
              <a id="${this.prefix}-print" href="" class="xlv-link"
                  title="${this.textLabels['print.hover']}"
                  >${this.textLabels['print']}</a>
              <a id="${this.prefix}-notes" href="" class="xlv-link"
                  title="${this.textLabels['notes.hover']}"
                  >${this.textLabels['notes']}</a>
              <a id="${this.prefix}-jotter" href="" class="xlv-link"
                  title="${this.textLabels['jotter.hover']}"
                  >${this.textLabels['jotter']}</a>
              <a id="${this.prefix}-webifi" href="" class="xlv-link"
                  title="${this.textLabels['webifi.hover']}"
                  >${this.textLabels['webifi']}</a>
              <span class="xlv-copyright" id="${this.prefix}-copyright"></span>
              <div id="${this.prefix}-tools" class="xlv-toggleable"
                  style="display:none">
                <p id="${this.prefix}-id" class="xlv-metadata">
                  <b>${this.textLabels['crossword-id']}:
                     <span id="${this.prefix}-id-span"><span></b>
                </p>
                <p id="${this.prefix}-metadata" class="xlv-metadata">
                  ${this.VERSION}
                  <a id="${this.prefix}-report-bug" class="xlv-link"
                    title="${this.textLabels['report-bug.hover']}"
                    href="https://github.com/viresh-ratnakar/exolve/issues/new"
                        >${this.textLabels['report-bug']}</a>
                  <a id="${this.prefix}-exolve-link" class="xlv-link"
                    title="${this.textLabels['exolve-link.hover']}"
                    href="https://github.com/viresh-ratnakar/exolve"
                      >${this.textLabels['exolve-link']}</a>
                  <a id="${this.prefix}-community-link" class="xlv-link"
                    title="${this.textLabels['exolve-exet-etc.hover']}"
                    href="https://groups.google.com/g/exolve-exet-etc"
                      >${this.textLabels['exolve-exet-etc']}</a>
                </p>
                <p>
                  <button id="${this.prefix}-manage-storage"
                    class="xlv-small-button"
                    title="${this.textLabels['manage-storage.hover']}">
                    ${this.textLabels['manage-storage']}
                  </button>
                  <div id="${this.prefix}-storage-list"
                    class="xlv-storage-list"
                    style="display:none">
                  </div>
                </p>
                <div id="${this.prefix}-tools-msg">
                  ${this.textLabels['tools-msg']}
                </div>
                <p id="${this.prefix}-saving" class="xlv-saving">
                  <span id="${this.prefix}-saving-msg">
                    ${this.notTemp ? this.textLabels['saving-msg'] : ''}
                  </span>
                </p>
              </div>
              <div id="${this.prefix}-print-settings"
                  class="xlv-print-settings xlv-toggleable" style="display:none">
                <p>
                  <b>${this.textLabels['print-heading']}</b>
                  <select name="${this.prefix}-print-scope" id="${this.prefix}-print-scope">
                    <option value="all">${this.textLabels['print-all']}</option>
                    <option value="only-grid">${this.textLabels['print-only-grid']}</option>
                    <option value="only-clues">${this.textLabels['print-only-clues']}</option>
                  </select>
                  <input id="${this.prefix}-print-inksaver" type="checkbox">
                  </input>
                  ${this.textLabels['print-inksaver']}
                </p>
                <p>
                  <div>
                    ${this.textLabels['print-font']}
                    <select name="${this.prefix}-print-font" id="${this.prefix}-print-font">
                      <option value="18px">${this.textLabels['print-font-normal']}</option>
                      <option value="22px">${this.textLabels['print-font-large']}</option>
                      <option value="26px">${this.textLabels['print-font-xlarge']}</option>
                      <option value="14px">${this.textLabels['print-font-small']}</option>
                      <option value="other">${this.textLabels['print-font-other']}</option>
                    </select>
                    <input class="xlv-input" id="${this.prefix}-print-font-inp"
                      name="${this.prefix}-print-font-inp" size="5" value="18px">
                    </input>
                  </div>
                  <div>
                    ${this.textLabels['print-size']}
                    <select name="${this.prefix}-page-size" id="${this.prefix}-page-size">
                      <option value="letter">Letter: 8.5in x 11in</option>
                      <option value="A4">A4: 210mm x 297mm</option>
                      <option value="A3">A3: 297mm x 420mm</option>
                      <option value="A5">A5: 148mm x 210mm</option>
                      <option value="B4">B4: 250mm x 353mm</option>
                      <option value="B5">B5: 176mm x 250mm</option>
                      <option value="6in 9in">Book: 6in x 9in</option>
                      <option value="legal">Legal: 8.5in x 14in</option>
                      <option value="ledger">Ledger: 11in x 17in</option>
                    </select>
                  </div>
                  <div title="${this.textLabels['print-margin.hover']}">
                    ${this.textLabels['print-margin']}
                    <input class="xlv-input" id="${this.prefix}-page-margins"
                      name="${this.prefix}-page-margins" size="25" value="0.5 0.5 0.5 0.5">
                    </input>
                  </div>
                  <div>
                    Include if visible:
                    <table>
                    <tr>
                    <td>
                    <input id="${this.prefix}-print-title"
                      checked=true type="checkbox">
                    </input>
                    ${this.textLabels['print-title']}
                    </td>
                    <td>
                    <input id="${this.prefix}-print-setter"
                      checked=true type="checkbox">
                    </input>
                    ${this.textLabels['print-setter']}
                    </td>
                    <td>
                    <input id="${this.prefix}-print-preamble"
                      checked=true type="checkbox">
                    </input>
                    ${this.textLabels['print-preamble']}
                    </td>
                    </tr>
                    <tr>
                    <td>
                    <input id="${this.prefix}-print-explanations"
                      checked=true type="checkbox">
                    </input>
                    ${this.textLabels['print-explanations']}
                    </td>
                    <td>
                    <input id="${this.prefix}-print-copyright"
                      checked=true type="checkbox">
                    </input>
                    ${this.textLabels['print-copyright']}
                    </td>
                    <td>
                    <input id="${this.prefix}-print-questions"
                      checked=true type="checkbox">
                    </input>
                    ${this.textLabels['print-questions']}
                    </td>
                    </tr>
                    </table>
                  </div>
                  <div>
                    <table>
                    <tr>
                      <td title="${this.textLabels['print-header.hover']}">
                        ${this.textLabels['print-header']}:<br>
                        <textarea id="${this.prefix}-print-header"
                          name="${this.prefix}-print-header" rows="2">
                        </textarea>
                      </td>
                      <td title="${this.textLabels['print-footer.hover']}">
                        ${this.textLabels['print-footer']}:<br>
                        <textarea id="${this.prefix}-print-footer"
                          name="${this.prefix}-print-footer" rows="2">
                        </textarea>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" title="${this.textLabels['print-grid-scale.hover']}">
                        ${this.textLabels['print-grid-scale']}
                        <input class="xlv-input" id="${this.prefix}-print-grid-scale"
                          name="${this.prefix}-grid-scale" size="5" value="">
                        </input>
                      </td>
                    </tr>
                    </table>
                  </div>
                  <div>
                    <input id="${this.prefix}-print-qrcode" type="checkbox">
                    </input>
                    ${this.textLabels['print-qrcode']}
                    <div id="${this.prefix}-qrcode-panel"
                        class="xlv-qrcode-panel" style="display:none">
                      <table>
                      <tr>
                      <td colspan="2">
                      <input class="xlv-input" id="${this.prefix}-qrcode-data"
                        size="60">
                      </input>
                      <br>
                      ${this.textLabels['print-qrcode-cta-label']}:
                      <input class="xlv-input" id="${this.prefix}-qrcode-cta-input"
                        value="${this.textLabels['print-qrcode-cta']}" size="20">
                      </input>
                      </td>
                      </tr>
                      <tr>
                        <td>
                        <p>
                        ${this.textLabels['print-qrcode-details']}
                        <select id="${this.prefix}-qrcode-location">
                          <option value="bottom-right">${this.textLabels['print-qrcode-in-botright']}</option>
                          <option value="bottom-left">${this.textLabels['print-qrcode-in-botleft']}</option>
                        </select>.
                        </p>
                        <p>
                        ${this.textLabels['print-qrcode-size']}
                        <select id="${this.prefix}-qrcode-size">
                          <option value="96">96</option>
                          <option value="128">128</option>
                          <option value="160">160</option>
                        </select>.
                        </p>
                        </td>
                        <td>
                          <table id="${this.prefix}-qrcode-table"
                              class="xlv-qrcode-table">
                            <tr><td>
                              <img id="${this.prefix}-qrcode" class="xlv-qrcode">
                            </td></tr>
                            <tr><td id="${this.prefix}-qrcode-cta"
                              class="xlv-qrcode-cta">
                            </td></tr>
                          </table>
                        </td>
                      </tr>
                      </table>
                    </div>
                  </div>
                  <div id="${this.prefix}-print-url-qrcodes-div"
                      style="display:none">
                    <input id="${this.prefix}-print-url-qrcodes" type="checkbox">
                    </input>
                    ${this.textLabels['print-url-qrcodes']}
                    <div id="${this.prefix}-url-qrcodes-panel" style="display:none">
                      <table id="${this.prefix}-url-qrcodes-table"
                          class="xlv-url-qrcodes-table">
                      </table>
                    </div>
                  </div>
                  <div>
                    <button id="${this.prefix}-print-crossword"
                        class="xlv-small-button"
                        title="${this.textLabels['print-crossword.hover']}">
                      ${this.textLabels['print-crossword']}
                    </button>
                    <button id="${this.prefix}-print-page"
                        class="xlv-small-button"
                        title="${this.textLabels['print-page.hover']}">
                      ${this.textLabels['print-page']}
                    </button>
                    <button id="${this.prefix}-print-wysiwyg"
                        class="xlv-small-button"
                        title="${this.textLabels['print-page-wysiwyg.hover']}">
                      ${this.textLabels['print-page-wysiwyg']}
                    </button>
                  </div>
                </p>
                <hr>
                <p>
                  <b>${this.textLabels['print-grid-svg']}</b>
                  <button id="${this.prefix}-print-grid-svg"
                      class="xlv-small-button">
                    ${this.textLabels['print-grid-svg-save']}
                  </button>
                  <input class="xlv-input" id="${this.prefix}-print-grid-svg-file-name"
                      value="${this.textLabels['print-grid-svg-file-name']}" size="20">
                  </input>
                </p>
              </div>
              <div id="${this.prefix}-notes-panel"
                  class="xlv-notes-panel xlv-toggleable" style="display:none">
              </div>
              <div id="${this.prefix}-jotter-panel"
                  class="xlv-toggleable" style="display:none">
                <p>
                  <span id="${this.prefix}-shuffle" class="xlv-shuffle"
                      title="${this.textLabels['shuffle.hover']}"
                      >${this.textLabels['shuffle']}</span>
                  <textarea
                      id="${this.prefix}-scratchpad"
                      title="${this.textLabels['jotter-text.hover']}"
                      class="xlv-textarea xlv-scratchpad"
                      spellcheck="false" rows="2"></textarea>
                </p>
              </div>
            </div> <!-- xlv-small-print -->
            <div id="${this.prefix}-questions"
                class="xlv-wide-box xlv-questions"></div>
            <div id="${this.prefix}-submit-parent" class="xlv-submit">
              <button id="${this.prefix}-submit"
                  class="xlv-button" style="display:none"
                      >${this.textLabels['submit']}</button>
            </div> <!-- submit-parent -->
            <div id="${this.prefix}-explanations" class="xlv-wide-box
                xlv-explanations" style="display:none"></div>
          </div> <!-- xlv-controls-etc -->
        </div> <!-- xlv-grid-panel -->
        <div id="${this.prefix}-clues" class="xlv-clues xlv-clues-flex">
          <div class="xlv-clues-panel" style="display:none">
            <div id="${this.prefix}-across-label"
                class="xlv-clues-box xlv-clues-label">
              <hr/>
              ${this.layers3d > 1 ? this.textLabels['3d-ac-label'] :
                this.textLabels['across-label']}
            </div>
            <div id="${this.prefix}-across-clues-panel" class="xlv-clues-box">
              <table id="${this.prefix}-across" class="xlv-clues-table"></table>
            </div>
          </div>
          <div class="xlv-clues-panel" style="display:none">
            <div id="${this.prefix}-down-label"
                class="xlv-clues-box xlv-clues-label">
              <hr/>
              ${this.layers3d > 1 ? this.textLabels['3d-aw-label'] :
                this.textLabels['down-label']}
            </div>
            <div id="${this.prefix}-down-clues-panel" class="xlv-clues-box">
              <table id="${this.prefix}-down" class="xlv-clues-table"></table>
            </div>
          </div>
          <div class="xlv-clues-panel" style="display:none">
            <div id="${this.prefix}-z3d-label"
                class="xlv-clues-box xlv-clues-label">
              <hr/>
              ${this.textLabels['3d-dn-label']}
            </div>
            <div id="${this.prefix}-z3d-clues-panel" class="xlv-clues-box">
              <table id="${this.prefix}-z3d" class="xlv-clues-table"></table>
            </div>
          </div>
          <div class="xlv-clues-panel" style="display:none">
            <div id="${this.prefix}-nodir-label"
                class="xlv-clues-box xlv-clues-label">
              <hr/>
            </div>
            <div id="${this.prefix}-nodir-clues-panel"
                class="xlv-clues-box">
              <table id="${this.prefix}-nodir" class="xlv-clues-table"></table>
            </div>
          </div>
        </div> <!-- xlv-clues -->
      </div> <!-- xlv-grid-and-clues-flex -->
    </div> <!-- xlv-frame -->
  `;

  if (document.getElementById(this.prefix + '-frame')) {
    this.throwErr('Element with id ' + this.prefix + 'frame already exists');
  }

  if (!this.containerId) {
    this.containerId = 'exolve';
  }
  const exolveHolder = document.getElementById(this.containerId);
  if (exolveHolder) {
    if (this.containerId == 'exolve') {
      exolveHolder.id = 'exolve' + this.index;
    }
    exolveHolder.insertAdjacentHTML('beforeend', basicHTML);
  } else {
    document.body.insertAdjacentHTML('beforeend', basicHTML);
  }
  this.frame = document.getElementById(this.prefix + '-frame');
  if (this.fontFamily) {
    this.frame.style.fontFamily = this.fontFamily;
  }
  if (this.fontSize) {
    this.frame.style.fontSize = this.fontSize;
  }

  this.pickColorScheme();

  this.titleElt = document.getElementById(this.prefix + '-title');
  if (this.title) {
    this.titleElt.innerHTML = this.title;
  } else {
    this.titleElt.style.display = 'none';
  }
  this.setterElt = document.getElementById(this.prefix + '-setter');
  if (this.setter) {
    this.setterElt.innerHTML = `<span id="${this.prefix}-setter-by"
      >${this.textLabels['setter-by']}</span> ${this.setter}`;
    this.setterElt.style.color = this.colorScheme['imp-text'];
  } else {
    this.setterElt.style.display = 'none';
  }
  this.preambleElt = document.getElementById(this.prefix + '-preamble');
  this.copyrightElt = document.getElementById(this.prefix + '-copyright');
  if (this.copyright) {
    this.copyrightElt.innerHTML = 'Ⓒ ' + this.copyright;
  } else {
    this.copyright = '';
  }
  this.smallPrint = document.getElementById(this.prefix + '-small-print');
  for (credit of this.credits) {
    this.smallPrint.insertAdjacentHTML('beforeend',
        '<div class="xlv-credit">' + credit + '</div>');
  }
  this.controlsEtc = document.getElementById(this.prefix + '-controls-etc');

  this.gridPanel = document.getElementById(this.prefix + '-grid-panel');
  this.svg = document.getElementById(this.prefix + '-grid');
  this.gridInputWrapper = document.getElementById(
      this.prefix + '-grid-input-wrapper');
  this.gridInputWrapper.style.width = '' + this.cellW + 'px';
  this.gridInputWrapper.style.height = '' + (this.cellH - 2) + 'px';
  this.gridInputWrapper.insertAdjacentHTML('beforeend',
      `<div id="${this.prefix}-grid-input-rarr"
          class="xlv-grid-input-rarr">&rtrif;</div>
       <div id="${this.prefix}-grid-input-larr"
          class="xlv-grid-input-larr">&ltrif;</div>
       <div id="${this.prefix}-grid-input-darr"
          class="xlv-grid-input-darr">&dtrif;</div>
       <div id="${this.prefix}-grid-input-uarr"
          class="xlv-grid-input-uarr">&utrif;</div>`);
  this.gridInputRarr = document.getElementById(
      this.prefix + '-grid-input-rarr');
  this.gridInputDarr = document.getElementById(
      this.prefix + '-grid-input-darr');
  this.gridInputLarr = document.getElementById(
      this.prefix + '-grid-input-larr');
  this.gridInputUarr = document.getElementById(
      this.prefix + '-grid-input-uarr');
  for (let e of [this.gridInputRarr, this.gridInputDarr,
                 this.gridInputLarr, this.gridInputUarr]) {
    e.style.color = this.colorScheme['arrow'];
    e.style.fontSize = this.arrowSize + 'px';
  }
  if (this.hasRebusCells) {
    /**
     * Place rarr and larr at the same spots as darr and uarr respectively.
     */
    this.gridInputRarr.className = 'xlv-grid-input-darr';
    this.gridInputLarr.className = 'xlv-grid-input-uarr';
  }

  this.gridInput = document.getElementById(this.prefix + '-grid-input');
  this.gridInput.style.caretColor = this.colorScheme['caret'];

  this.questions = document.getElementById(this.prefix + '-questions');

  this.acrossPanel = document.getElementById(
      this.prefix + '-across-clues-panel');
  this.downPanel = document.getElementById(this.prefix + '-down-clues-panel');
  this.z3dPanel = document.getElementById(this.prefix + '-z3d-clues-panel');
  this.nodirPanel = document.getElementById(this.prefix + '-nodir-clues-panel');
  this.acrossClues = document.getElementById(this.prefix + '-across');
  this.downClues = document.getElementById(this.prefix + '-down');
  this.z3dClues = document.getElementById(this.prefix + '-z3d');
  this.nodirClues = document.getElementById(this.prefix + '-nodir');

  this.gridcluesContainer = document.getElementById(this.prefix +
      '-grid-and-clues');
  this.cluesContainer = document.getElementById(this.prefix + '-clues');

  this.clearArea = document.getElementById(this.prefix + '-clear-area');
  this.gridParent = document.getElementById(this.prefix + '-grid-parent');
  this.currClue = document.getElementById(this.prefix + '-curr-clue');
  this.currClueInner = document.getElementById(
      this.prefix + '-curr-clue-inner');
  this.ninaGroup = document.getElementById(this.prefix + '-nina-group');
  this.colourGroup = document.getElementById(this.prefix + '-colour-group');

  this.statusNumFilled = document.getElementById(
      this.prefix + '-status-num-filled');
  this.statusNumTotal = document.getElementById(
      this.prefix + '-status-num-total');
  if (this.provideStateUrl) {
    document.getElementById(this.prefix + '-saving').insertAdjacentHTML(
        'beforeend',
        `<span id="${this.prefix}-saving-bookmark">
           ${this.textLabels['saving-bookmark']} </span>
        <a id="${this.prefix}-saving-url" href="">URL</a>`);
    this.savingURL = document.getElementById(this.prefix + '-saving-url');
  }

  this.buttonRow1 = document.getElementById(this.prefix + '-button-row-1');
  this.buttonRow2 = document.getElementById(this.prefix + '-button-row-2');

  this.clearButton = document.getElementById(this.prefix + '-clear');
  this.clearButton.addEventListener('click', this.clearCurr.bind(this));

  this.clearAllButton = document.getElementById(this.prefix + '-clear-all');
  this.clearAllButton.addEventListener('click', this.clearAllHandler.bind(this));

  this.checkButton = document.getElementById(this.prefix + '-check');
  this.checkButton.addEventListener('mousedown', this.cellLightToggler.bind(
    this, this.checkButton, this.textLabels['checkcell']));
  this.checkButton.addEventListener('mouseup', this.checkCurr.bind(this));
  this.checkcellButton = document.getElementById(this.prefix + '-checkcell');
  this.checkcellButton.addEventListener('click', this.checkCell.bind(this));

  this.checkAllButton = document.getElementById(this.prefix + '-check-all');
  this.checkAllButton.addEventListener('click', this.checkAllHandler.bind(this));

  this.ninasButton = document.getElementById(this.prefix + '-ninas');
  this.ninasButton.addEventListener('click', this.toggleNinas.bind(this));

  this.revealButton = document.getElementById(this.prefix + '-reveal');
  this.revealButton.addEventListener('mousedown', this.cellLightToggler.bind(
    this, this.revealButton, this.textLabels['revealcell']));
  this.revealButton.addEventListener('mouseup', this.revealCurr.bind(this));
  this.revealcellButton = document.getElementById(this.prefix + '-revealcell');
  this.revealcellButton.addEventListener('click', this.revealCell.bind(this));

  this.revealAllButton = document.getElementById(this.prefix + '-reveal-all');
  this.revealAllButton.addEventListener('click', this.revealAllHandler.bind(this));

  this.submitButton = document.getElementById(this.prefix + '-submit');
  this.submitButton.addEventListener('click', this.submitSolution.bind(this));

  this.explanations = document.getElementById(this.prefix + '-explanations');

  const printPage = document.getElementById(this.prefix + '-print-page');
  printPage.addEventListener('click', this.printNow.bind(this, 'page'));
  const printCrossword = document.getElementById(this.prefix + '-print-crossword');
  printCrossword.addEventListener('click', this.printNow.bind(this, 'crossword'));
  const printWysiwyg = document.getElementById(this.prefix + '-print-wysiwyg');
  printWysiwyg.addEventListener('click', this.printNow.bind(this, 'wysiwig'));
  this.printFontMenu = document.getElementById(this.prefix + '-print-font');
  this.printFontMenu.addEventListener('change', this.setPrintFont.bind(this, true));
  this.printFontInput = document.getElementById(this.prefix + '-print-font-inp');
  this.printFontInput.addEventListener(
      'change', this.setPrintFont.bind(this, false));
  this.qrImg = document.getElementById(this.prefix + '-qrcode');
  this.qrTable = document.getElementById(this.prefix + '-qrcode-table');
  this.qrCTAInput = document.getElementById(this.prefix + '-qrcode-cta-input');
  this.qrCTA = document.getElementById(this.prefix + '-qrcode-cta');
  this.qrCheckbox = document.getElementById(this.prefix + '-print-qrcode');
  this.qrPanel = document.getElementById(this.prefix + '-qrcode-panel');
  this.qrData = document.getElementById(this.prefix + '-qrcode-data');
  this.qrSize = document.getElementById(this.prefix + '-qrcode-size');
  this.qrLocation = document.getElementById(this.prefix + '-qrcode-location');
  const qrRefresher = this.qrRefresher.bind(this);
  this.qrCheckbox.addEventListener('change', qrRefresher);
  this.qrData.value = location.href;
  this.qrData.addEventListener('change', qrRefresher);
  this.qrSize.addEventListener('change', qrRefresher);
  this.qrCTAInput.addEventListener('change', qrRefresher);

  this.qrUrlsDiv = document.getElementById(this.prefix + '-print-url-qrcodes-div');
  this.qrUrlsCheckbox = document.getElementById(this.prefix + '-print-url-qrcodes');
  this.qrUrlsPanel = document.getElementById(this.prefix + '-url-qrcodes-panel');
  const qrUrlsRefresher = this.qrUrlsRefresher.bind(this);
  this.qrUrlsCheckbox.addEventListener('change', qrUrlsRefresher);
  this.qrUrlsTable = document.getElementById(this.prefix + '-url-qrcodes-table');

  const printGridSvg = document.getElementById(this.prefix + '-print-grid-svg');
  printGridSvg.addEventListener('click', this.printGridSvg.bind(this));

  this.webifiButton = document.getElementById(this.prefix + '-webifi');
  this.webifiButton.style.display = 'none';

  /**
   * Set up toggleable panels.
   */
  const toolsToggler = document.getElementById(this.prefix + '-tools-link');
  const toolsPanel = document.getElementById(this.prefix + '-tools');
  toolsToggler.addEventListener(
      'click', this.togglePanel.bind(this, toolsToggler, toolsPanel));
  const printToggler = document.getElementById(this.prefix + '-print');
  const printPanel = document.getElementById(this.prefix + '-print-settings');
  printToggler.addEventListener(
      'click', this.togglePanel.bind(this, printToggler, printPanel));
  this.notesToggler = document.getElementById(this.prefix + '-notes');
  this.notesPanel = document.getElementById(this.prefix + '-notes-panel');
  this.notesToggler.addEventListener(
      'click', this.togglePanel.bind(this, this.notesToggler, this.notesPanel));
  this.jotterToggler = document.getElementById(this.prefix + '-jotter');
  this.jotterPanel = document.getElementById(this.prefix + '-jotter-panel');
  this.jotterToggler.addEventListener(
      'click', this.togglePanel.bind(this, this.jotterToggler, this.jotterPanel));

  document.getElementById(this.prefix + '-manage-storage').addEventListener(
    'click', this.manageStorage.bind(this));

  this.scratchPad = document.getElementById(this.prefix + '-scratchpad');
  this.scratchPad.style.color = this.colorScheme['imp-text'];
  document.getElementById(this.prefix + '-shuffle').addEventListener(
        'click', this.scratchPadShuffle.bind(this));
  this.scratchPad.addEventListener('input', this.scratchPadMath.bind(this));

  let info = 'Version: ' + this.VERSION + ', User Agent: ' +
      navigator.userAgent;
  document.getElementById(this.prefix + '-report-bug').href =
      'https://github.com/viresh-ratnakar/exolve/issues/new?body=' +
      encodeURIComponent(info);

  this.CURR_PLACEHOLDER_BLANK_ID = this.prefix + '-curr-blank';

  this.followDirOrder();

  // Sets language of puzzle elements if exolve-language was specified.
  if (this.language) {
    this.frame.lang = this.language;
    this.gridInput.lang = this.language;
    this.questions.lang = this.language;
  }
  const maxlen = this.hasRebusCells ?
                 this.MAX_REBUS_SIZE : (2 * this.langMaxCharCodes);
  this.gridInput.maxLength = '' + maxlen;
}

Exolve.prototype.log = function(msg) {
  console.log('Exolve puzzle #' + this.index + ' [' + this.id + ']: ' + msg)
}

Exolve.prototype.parseNumPair = function(s) {
  const nums = s.trim().split(' ').map(Number);
  if (nums.length != 2 || isNaN(nums[0]) || isNaN(nums[1])) {
    this.throwErr('Failed to parse two numbers from: ' + s);
  }
  return nums;
}

/**
 * The overall parser for the puzzle text.
 */
Exolve.prototype.parseOverall = function() {
  this.specLines = []  // Blank lines are not included in this array.
  let rawLines = this.puzzleText.trim().split('\n');
  for (let rawLine of rawLines) {
    let cIndex = rawLine.indexOf('#');
    /**
     * A # followed by a non-space/non-eol character is not a comment marker.
     * A # preceded by a non-space (+ non-start) is also not a comment marker.
     */
    while (cIndex >= 0 && cIndex + 1 < rawLine.length &&
           ((rawLine.charAt(cIndex + 1) != ' ') ||
             (cIndex > 0 && rawLine.charAt(cIndex - 1) != ' '))){
      cIndex = rawLine.indexOf('#', cIndex + 1);
    }
    if (cIndex >= 0) {
      rawLine = rawLine.substr(0, cIndex).trim()
    } else {
      rawLine = rawLine.trim()
    }
    if (!rawLine) {
      continue;
    }
    this.specLines.push(rawLine)
  }
  this.numLines = this.specLines.length;

  let parsedSec = this.parseSection();

  while (parsedSec && parsedSec.section != 'end') {
    let firstLine = this.nextLine;
    let nextParsedSec = this.parseSection();
    let lastLine = this.nextLine - 2;
    this.sectionLines[parsedSec.section] = [firstLine, lastLine];
    if (parsedSec.section == 'begin') {
    } else if (parsedSec.section == 'id') {
      this.id = parsedSec.value.trim();
    } else if (parsedSec.section == 'title') {
      this.title = parsedSec.value.trim();
    } else if (parsedSec.section == 'setter') {
      this.setter = parsedSec.value.trim();
    } else if (parsedSec.section == 'email') {
      this.email = parsedSec.value.trim();
    } else if (parsedSec.section == 'copyright') {
      this.copyright = parsedSec.value.trim();
    } else if (parsedSec.section == 'credits') {
      this.credits.push(parsedSec.value.trim());
    } else if (parsedSec.section == 'width') {
      this.gridWidth = parseInt(parsedSec.value);
    } else if (parsedSec.section == 'height') {
      this.gridHeight = parseInt(parsedSec.value);
    } else if (parsedSec.section == '3d') {
      this.parse3d(parsedSec.value);
    } else if (parsedSec.section == 'cell-size') {
      const parts = this.parseNumPair(parsedSec.value);
      this.cellW = parts[0];
      this.cellH = parts[1];
      if (this.cellW <= 9 || this.cellH <= 9) {
        this.throwErr('exolve-cell-size: <width>, <height> must be >= 10');
      }
    } else if (parsedSec.section == 'grid-spacing') {
      const parts = this.parseNumPair(parsedSec.value);
      this.tilingW = parts[0];
      this.tilingH = parts[1];
      if (this.tilingW <= 0 || this.tilingH <= 0) {
        this.throwErr('exolve-grid-spacing: <x>, <y> must be >= 1');
      }
    } else if (parsedSec.section == 'grid-bounds') {
      const parts = this.parseNumPair(parsedSec.value);
      this.boxW = parts[0];
      this.boxH = parts[1];
      if (this.boxW <= 9 || this.boxH <= 0) {
        this.throwErr('exolve-grid-bounds: <w>, <h> must be >= 10');
      }
    } else if (parsedSec.section == 'nina') {
      this.ninaLines.push(firstLine - 1);
    } else if (parsedSec.section == 'colour' ||
               parsedSec.section == 'color') {
      this.colourLines.push(firstLine - 1);
    } else if (parsedSec.section == 'no-rebus') {
      this.noRebusLines.push(firstLine - 1);
    } else if (parsedSec.section == 'force-hyphen-right' ||
               parsedSec.section == 'force-hyphen-below' ||
               parsedSec.section == 'force-bar-right' ||
               parsedSec.section == 'force-bar-below') {
      this.parseForcedSep(parsedSec.value, parsedSec.section);
    } else if (parsedSec.section == 'question') {
      let q = parsedSec.value;
      const hints = [];
      for (let i = firstLine; i <= lastLine; i++) {
        const line = this.specLines[i].trim();
        if (line.substr(0, 5).toLowerCase() == 'hint:') {
          hints.push(line.substr(5).trim());
        }
      }
      if (hints.length > 0) {
        q = {
          question: parsedSec.value,
          hints: hints,
        };
      }
      this.questionTexts.push(q);
    } else if (parsedSec.section == 'submit') {
      this.parseSubmit(parsedSec.value);
    } else if (parsedSec.section == 'nodir') {
      this.nodirHeading = parsedSec.value;
    } else if (parsedSec.section == 'reversals') {
      this.parseReversals(parsedSec.value);
    } else if (parsedSec.section == 'option') {
      this.parseOption(parsedSec.value);
    } else if (parsedSec.section == 'language') {
      this.parseLanguage(parsedSec.value);
    } else if (parsedSec.section == 'alternatives') {
      this.altsSpecs.push(parsedSec.value);
    } else if (parsedSec.section == 'cell-decorator') {
      this.parseCellDec(parsedSec.value);
    } else if (parsedSec.section == 'shaped-cell') {
      this.parseShapedCell(parsedSec.value);
    }
    parsedSec = nextParsedSec;
  }
  this.multiLetter = this.hasRebusCells || (this.langMaxCharCodes > 1);
  this.dirOrder = {};
  this.dirOrder['A'] = (this.sectionLines[
    this.layers3d > 1 ? '3d-across' : 'across'] || [0])[0];
  this.dirOrder['D'] = (this.sectionLines[
    this.layers3d > 1 ? '3d-away' : 'down'] || [0])[0];
  this.dirOrder['Z'] = (this.sectionLines['3d-down'] || [0])[0];
  this.dirOrder['X'] = (this.sectionLines['nodir'] || [0])[0];
}

Exolve.prototype.colonSplit = function(s) {
  let index = s.indexOf(':');
  if (index < 0) {
    index = s.length;
  }
  return {
    section: s.substr(0, index).trim().toLowerCase(),
    value: s.substr(index + 1).trim(),
  };
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
    return null;
  }
  // Skip past MARKER
  const line = this.specLines[this.nextLine].trim().substr(MARKER.length);
  this.nextLine++;
  return this.colonSplit(line);
}

Exolve.prototype.clueLabelDisp = function(clue) {
  let suff = ''
  if (clue.dir == 'A') {
    if (clue.reversed) {
      suff = (this.layers3d > 1) ? this.textLabels['3d-ba'] :
        this.textLabels['back-letter'];
    } else {
      suff = (this.layers3d > 1) ? this.textLabels['3d-ac'] :
        this.textLabels['across-letter'];
    }
  } else if (clue.dir == 'D') {
    if (clue.reversed) {
      suff = (this.layers3d > 1) ?  this.textLabels['3d-to'] :
        this.textLabels['up-letter'];
    } else {
      suff = (this.layers3d > 1) ?  this.textLabels['3d-aw'] :
        this.textLabels['down-letter'];
    }
  } else if (clue.dir == 'Z') {
    suff = (clue.reversed) ? this.textLabels['3d-up'] :
      this.textLabels['3d-dn'];
  } else {
    return clue.label;
  }
  return '' + clue.label + suff;
}

Exolve.prototype.isColour = function(s) {
  const e = new Option().style;
  e.color = s;
  return e.color !== '';
}

/**
 * Parse ninas, colours, no-rebus lines (basically sections
 * that specify cells/lights.
 */
Exolve.prototype.parseColoursNinasEtc = function(s) {
  let nextNinaColour = 0;
  for (let n of this.ninaLines) {
    nextNinaColour = this.parseNina(this.specLines[n], nextNinaColour);
  }
  for (let c of this.colourLines) {
    this.parseColour(this.specLines[c]);
  }
  for (let c of this.noRebusLines) {
    this.parseNoRebus(this.specLines[c]);
  }
}

/**
 * Parse a nina line, which consists of cell locations or clue indices.
 */
Exolve.prototype.parseNina = function(s, nextNinaColour) {
  s = this.colonSplit(s).value;
  const ninaList = [];
  const ccccStrs = s.split(' ');
  let colour = '';
  for (const ccccStr of ccccStrs) {
    if (!ccccStr) {
      continue;
    }
    const cccc = this.parseCCCC(ccccStr);
    if (cccc.colour) {
      if (colour) {
        this.throwErr(
          ccccStr + ' is a colour in a nina already coloured: ' + colour);
      }
      colour = cccc.colour;
    } else if (cccc.cells || cccc.cls) {
      ninaList.push(cccc);
    } else {
      console.log('Skipping invalid nina location: ' + ccccStr);
    }
  }
  if (ninaList.length == 0) {
    console.log('No cells/clues/classes in nina: ' + s);
    return nextNinaColour;
  }
  if (!colour) {
    colour = this.NINA_COLORS[nextNinaColour % this.NINA_COLORS.length];
    nextNinaColour = (nextNinaColour + 1) % this.NINA_COLORS.length
  }
  this.ninas.push({
      colour: colour,
      list: ninaList,
  });
  return nextNinaColour;
}

Exolve.prototype.parseColour = function(s) {
  s = this.colonSplit(s).value;
  const cList = [];
  const ccccStrs = s.split(' ');
  let colour = '';
  for (const ccccStr of ccccStrs) {
    if (!ccccStr) {
      continue;
    }
    const cccc = this.parseCCCC(ccccStr);
    if (cccc.colour) {
      if (colour) {
        this.throwErr(
          ccccStr + ' is a colour in exolve-colour already coloured: ' + colour);
      }
      colour = cccc.colour;
    } else if (cccc.cells) {
      cList.push(cccc);
    } else {
      console.log('Skipping invalid exolve-colour location: ' + ccccStr);
    }
  }
  if (!colour) {
    console.log('No valid colour in exolve-colour: ' + s);
    return;
  }
  if (cList.length == 0) {
    console.log('No cells/clues in exolve-colour: ' + s);
    return;
  }
  this.colourfuls.push({
      colour: colour,
      list: cList,
  });
}

Exolve.prototype.parseNoRebus = function(s) {
  s = this.colonSplit(s).value;
  const ccccStrs = s.split(' ');
  for (const ccccStr of ccccStrs) {
    if (!ccccStr) {
      continue;
    }
    const cccc = this.parseCCCC(ccccStr);
    if (!cccc.cells) {
      this.throwErr(
          ccccStr + ' in exolve-no-rebus is not a cell/light specification');
    }
    for (const cell of cccc.cells) {
      const gridCell = this.grid[cell[0]][cell[1]];
      gridCell.noRebus = true;
    }
  }
}

Exolve.prototype.reversalKey = function(cells) {
  return JSON.stringify([cells[0], cells[cells.length - 1]]);
}

Exolve.prototype.parseReversals = function(s) {
  const parts = s.split(' ');
  for (let p of parts) {
    const cells = p.split('-');
    if (!cells || cells.length != 2) {
      this.throwErr('Empty/incomplete reversal specified in: ' + p);
    }
    const start = this.parseCellLocation(cells[0]);
    const end = this.parseCellLocation(cells[1]);
    if (!start || !end) {
      this.throwErr('Unparseable reversal specified in: ' + p);
    }
    this.reversals[this.reversalKey([start, end])] = p;
  }
}

Exolve.prototype.parseForcedSep = function(s, section) {
  let parsedCells = s.split(' ')
  for (let c of parsedCells) {
    if (!c) {
      continue
    }
    let cellLocation = this.parseCellLocation(c)
    if (!cellLocation) {
      continue
    }
    this.forcedSeps[section].push(cellLocation)
  }
}

/**
 * Parse a cell-decoration spec that has an optional "non-clickable " prefix and
 * then one or more SVG specs.
 */
Exolve.prototype.parseCellDec = function(s) {
  const cellDec = {
    clickable: true,
    svgSpec: '',
  };
  s = s.trim();
  if (s.startsWith('non-clickable')) {
    cellDec.clickable = false;
    s = s.substr(13).trim();
  }
  if (!s.startsWith('<') || !s.endsWith('>')) {
    this.throwErr('Unparseable SVG specs in cell-decorator: ' + s);
  }
  cellDec.svgSpec = s;
  this.cellDecs.push(cellDec);
}

/**
 * Parse a shaped-cell spec that looks like <label-x> <label-y> <svg-spec>
 */
Exolve.prototype.parseShapedCell = function(s) {
  s = s.trim();
  const shapedCell = {
    labelX: 0,
    labelY: 0,
    svgSpec: '',
  };
  const svgStart = s.indexOf('<');
  if (svgStart < 0) {
    this.throwErr('Missing SVG specs in shaped-cell: ' + s);
  }
  const parts = this.parseNumPair(s.substr(0, svgStart));
  shapedCell.labelX = parts[0];
  shapedCell.labelY = parts[1];
  if (!s.endsWith('>')) {
    this.throwErr('Unparseable SVG specs in shaped-cell: ' + s);
  }
  shapedCell.svgSpec = s.substr(svgStart);
  this.shapedCells.push(shapedCell);
}

/**
 * Parses a grid-cell's cell-decoration list that looks like {k1,k2,..}
 * Parameters may have colon-preceded parameters, like {1,2:v1:v2,3}
 * Returns 1 less than the number of chars from { to }
 */
Exolve.prototype.parseCellDecList = function(s, start, cell) {
  const end = s.indexOf('}', start);
  if (end < 0) {
    this.throwErr('Cell decorators list not enclosed in {}: ' + s);
  }
  const dpList = s.substring(start + 1, end).split(',');
  cell.decorators = [];
  for (const dp of dpList) {
    const dAndParams = dp.split(':');
    const d = dAndParams[0] ?? -1;
    if (isNaN(d) || d <= 0 || d > this.cellDecs.length) {
      this.throwErr('Found cell with invalid cell-decorators index/params: ' + d);
    }
    cell.decorators.push(dAndParams);
  }
  return (end - start);
}

/**
 * Replace each $<x> in s with params[x], for x = 1,2,..
 */
Exolve.prototype.fillParams = function(s, params) {
  let filled = '';
  let idx = 0;
  while (idx < s.length) {
    const c = s[idx++];
    if (c != '$') {
      filled += c;
      continue;
    }
    const idxStart = idx;
    while (idx < s.length && s[idx] >= '0' && s[idx] <= '9') {
      idx++;
    }
    const numPart = s.substring(idxStart, idx);
    const pnum = parseInt(numPart);
    if (isNaN(pnum) || pnum < 0 || pnum >= params.length) {
      this.throwErr('When looking to do $-substitution using params[] of ' +
          'length ' + params.length + ' found invalid/out-of-bounds part: [$' +
          numPart + ']');
    }
    filled += (pnum ? params[pnum] : '$');
  }
  return filled;
}

/**
 * Parses a grid-cell's shaped-cell spec that looks like [k] or [k,x,y]
 * Returns 1 less than the number of chars from [ to ]
 */
Exolve.prototype.parseShapedCellSpec = function(s, start, cell) {
  const end = s.indexOf(']', start);
  if (end < 0) {
    this.throwErr('Shaped cell spec in grid not enclosed in []: ' + s);
  }
  const specs = s.substring(start + 1, end);
  const parts = specs.split(',').map(Number);
  if (parts.length != 1 && parts.length != 3) {
    this.throwErr('Grid cell shape specs cannot be parsed: ' + specs)
  }
  const n = parts[0];
  if (isNaN(n) || n <= 0 || n > this.shapedCells.length) {
    this.throwErr('Found cell with invalid shaped-cell index: ' + n);
  }
  cell.shapedCell = n;
  if (parts.length == 3) {
    cell.shapedCellX = parts[1];
    cell.shapedCellY = parts[2];
  }
  return (end - start);
}

Exolve.prototype.answerListener = function(answer, forceUpper) {
  this.deactivateCurrCell();
  this.deactivateCurrClue();
  this.usingGnav = false;
  let cursor = answer.selectionStart;
  if (forceUpper) {
    answer.value = answer.value.toUpperCase().trimLeft();
  } else {
    answer.value = answer.value.trimLeft();
  }
  answer.selectionEnd = cursor;
  this.updateAndSaveState();
}

// Parse a questionTexts and create the question elements for (which include
// an input box for the answer). The solution answer may be provided after the
// last ')'.
Exolve.prototype.redisplayQuestions = function() {
  this.questions.innerHTML = '';
  const savedAnsList = this.answersList.slice();
  this.answersList = [];
  for (let i = 0; i < this.questionTexts.length; i++) {
    const entry = this.questionTexts[i];
    let s = entry;
    if (typeof entry === 'object') {
      s = entry.question;
    }
    const enumParse = this.parseEnum(s);
    let inputLen = enumParse.placeholder.length;

    const rawQ = s.substr(
        0, (enumParse.dontShow ?
            enumParse.afterClue : enumParse.afterEnum)).trim();

    let hideEnum = (inputLen > 0 && enumParse.dontShow);
    s = s.substr(enumParse.afterEnum).trim();

    let forceUpper = true;
    if (s.substr(0,14) == "[lowercase-ok]") {
      forceUpper = false;
      s = s.substr(14).trim();
    }

    let correctAnswer = s;
    const question = document.createElement('div');
    question.setAttributeNS(null, 'class', 'xlv-question');
    const questionSpan = document.createElement('span');
    questionSpan.id = `${this.prefix}-question-${i}`;
    questionSpan.innerHTML = rawQ;
    question.appendChild(questionSpan);

    question.appendChild(document.createElement('br'));

    if (inputLen == 0) {
      hideEnum = true;
      inputLen = 30;
    }
    let aType = 'input';
    if (inputLen > 30) {
      aType = 'textarea';
    }
    const answer = document.createElement(aType);
    answer.classList.add('xlv-answer');
    if (inputLen <= 30) {
      answer.setAttributeNS(null, 'size', '' + inputLen);
      answer.setAttributeNS(null, 'type', 'text');
    } else {
      answer.classList.add('xlv-textarea');
    }
    this.answersList.push({
      ans: correctAnswer,
      input: answer,
      isq: true,
    });
    if (!hideEnum) {
      answer.setAttributeNS(null, 'placeholder', enumParse.placeholder);
    }
    answer.style.color = this.colorScheme['imp-text'];
    answer.setAttributeNS(null, 'maxlength',
                          '' + inputLen * this.langMaxCharCodes);
    answer.setAttributeNS(null, 'autocomplete', 'off');
    answer.setAttributeNS(null, 'spellcheck', 'false');
    question.appendChild(answer);
    this.questions.appendChild(question);
    answer.addEventListener(
        'input', this.answerListener.bind(this, answer, forceUpper));

    if (typeof entry === 'object') {
      entry.hintsDisplay = new ExolveHints(this, questionSpan, entry.hints);
    }

  }
  for (const a of savedAnsList) {
    if (!a.isq) this.answersList.push(a);
  }
}

Exolve.prototype.parseSubmit = function(s) {
  let parts = s.split(' ')
  if (s.length < 2) {
    this.throwErr('Submit must have a URL and a param name for the solution')
  }
  this.submitURL = parts[0]
  this.submitKeys = []
  for (let i = 1; i < parts.length; i++) {
    this.submitKeys.push(parts[i])
  }
}

Exolve.prototype.parseOption = function(s) {
  let sparts = s.split(' ');
  for (let spart of sparts) {
    spart = spart.trim();
    if (spart == "show-cell-level-buttons") {
      this.showCellLevelButtons = true;
      continue;
    }
    if (spart == "hide-inferred-numbers") {
      this.hideInferredNumbers = true;
      continue;
    }
    if (spart == "hide-copy-placeholder-buttons") {
      this.hideCopyPlaceholders = true;
      continue;
    }
    if (spart == "no-auto-solution-in-anno") {
      this.addSolutionToAnno = false;
      continue;
    }
    if (spart == "no-smart-coloring" || spart == "no-smart-colouring") {
      this.smartColoring = false;
      continue;
    }
    if (spart == "columnar-layout") {
      /* Deprecated. */
      continue;
    }
    if (spart == "clues-at-right-in-two-columns") {
      /* Deprecated, we always try to position clues to the right now. */
      continue;
    }
    if (spart == "print-incomplete-2cols") {
      this.printIncomplete2Cols = true;
      continue;
    }
    if (spart == "print-completed-3cols") {
      this.printCompleted3Cols = true;
      continue;
    }
    if (spart == "rebus-cells") {
      this.hasRebusCells = true;
      continue;
    }
    if (spart == "ignore-unclued") {
      this.ignoreUnclued = true;
      continue;
    }
    if (spart == "ignore-enum-mismatch") {
      this.ignoreEnumMismatch = true;
      continue;
    }
    if (spart == "no-nina-button" || spart == "no-ninas-button") {
      this.noNinaButton = true;
      continue;
    }
    if (spart == "colour-only-cell-bottom" ||
        spart == "color-only-cell-bottom") {
      this.colourOnlyCellBottom = true;
      continue;
    }
    if (spart == "webifi") {
      this.useWebifi = true;
      continue;
    }
    if (spart == "allow-digits") {
      spart = 'allow-chars:0123456789';
      // Fall through to the allow-chars code.
    }
    if (spart == "add-extraction-slots") {
      spart = 'add-extraction-slots:1';
    }
    const colon = spart.indexOf(':');
    if (colon < 0) {
      this.throwErr('Expected exolve-option: key:value, got: ' + spart);
    }
    const kv = [spart.substr(0, colon).trim(), spart.substr(colon + 1).trim()];

    if (kv[0] == 'add-extraction-slots') {
      this.extractionSlots = parseInt(kv[1]);
      if (isNaN(this.extractionSlots) || this.extractionSlots <= 0) {
        this.throwErr(
            'Unexpected val in exolve-option: add-extraction-slots: ' + kv[1]);
      }
      continue;
    }
    if (kv[0] == 'clues-panel-lines') {
      this.cluesPanelLines = parseInt(kv[1]);
      if (isNaN(this.cluesPanelLines) || this.cluesPanelLines <= 0) {
        this.throwErr('Unexpected val in exolve-option: clue-panel-lines: ' +
                      kv[1]);
      }
      continue;
    }
    if (kv[0] == 'highlight-overwritten-seconds') {
      const secs = parseFloat(kv[1]);
      if (isNaN(secs) || secs < 0) {
        this.throwErr('Unexpected val in exolve-option: highlight-overwritten-seconds: ' + kv[1]);
      }
      this.hltOverwrittenMillis = secs * 1000;
      continue;
    }
    if (kv[0] == 'offset-left') {
      this.offsetLeft = parseInt(kv[1]);
      if (isNaN(this.offsetLeft)) {
        this.throwErr('Unexpected val in exolve-option: offset-left: ' + kv[1]);
      }
      continue;
    }
    if (kv[0] == 'offset-top') {
      this.offsetTop = parseInt(kv[1]);
      if (isNaN(this.offsetTop)) {
        this.throwErr('Unexpected val in exolve-option: offset-top: ' + kv[1]);
      }
      continue;
    }
    if (kv[0] == 'grid-background') {
      /** Deprecated and ignored. */
      continue;
    }
    if (kv[0] == 'font-family') {
      this.fontFamily = kv[1];
      continue;
    }
    if (kv[0] == 'font-size') {
      this.fontSize = kv[1];
      continue;
    }
    if (kv[0] == 'top-clue-clearance') {
      this.topClueClearance = parseInt(kv[1]);
      if (isNaN(this.topClueClearance) || this.topClueClearance < 0) {
        this.throwErr(
            'Unexpected val in exolve-option: top-clue-clearance: ' + kv[1]);
      }
      continue;
    }
    if (kv[0].substr(0, 6) == 'color-' || kv[0].substr(0, 7) == 'colour-') {
      let cSchemes = [this.lightColorScheme, this.darkColorScheme];
      let key = kv[0].substr(kv[0].indexOf('-') + 1);
      if (key.startsWith('dark.')) {
        cSchemes = [this.darkColorScheme];
        key = key.substr(5);
      } else if (key.startsWith('light.')) {
        cSchemes = [this.lightColorScheme];
        key = key.substr(6);
      }
      if (!this.isColour(kv[1])) {
        this.throwErr('Invalid colour for ' + key + ': ' + kv[1]);
      }
      for (const cs of cSchemes) {
        if (!cs[key]) {
          this.throwErr('Unsupported coloring option: ' + kv[0]);
        }
        cs[key] = kv[1];
      }
      continue;
    }
    if (kv[0].substr(0, 16) == 'override-number-') {
      const key = kv[0].substr(16);
      if (!this.hasOwnProperty(key)) {
        this.throwErr('Invalid Exolve property: ' + key);
      }
      if (typeof this[key] !== 'number') {
        this.throwErr('Non-numeric Exolve property: ' + key);
      }
      const val = parseFloat(kv[1]);
      this[key] = val;
      continue;
    }
    if (kv[0] == 'allow-chars') {
      if (!this.allowChars) this.allowChars = {};
      for (c of kv[1]) {
        if (/\s/.test(c)) continue;
        this.allowChars[c] = true;
        if (this.SPECIAL_STATE_CHARS.hasOwnProperty(c)) {
          this.allowChars[this.SPECIAL_STATE_CHARS[c]] = true;
        }
      }
      continue;
    }
    this.throwErr('Unexpected exolve-option: ' + spart);
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
    this.scriptRE = new RegExp('^\\p{Script=' + this.languageScript + '}+$', 'u')
    this.scriptLowerCaseRE = new RegExp('^\\p{Lowercase}+$', 'u')
  } catch (err) {
    this.throwErr(
        'Your browser ' +
        '<a href="https://caniuse.com/#search=Unicode%20property%20escapes"' +
        '>does not support Unicode property escapes</a> OR you\'ve provided ' +
        'an invalid Script name: ' + this.languageScript)
  }
  // Hard-code some known scripts requiring langMaxCharCodes
  if (this.languageScript.toLowerCase() == 'devanagari') {
    this.langMaxCharCodes = 5
  }
  if (parts.length > 2) {
    this.langMaxCharCodes = parseInt(parts[2])
    if (isNaN(this.langMaxCharCodes) || this.langMaxCharCodes < 1) {
      this.throwErr('invalid max-char-codes in exolve-language: ' + parts[2])
    }
  }
}

/**
 * Must be called after clues/grid have been passed and clue-parent-child
 * relationships are known. If there are any exolve-alternatives lines in
 * this.altsSpecs, then parses them, setting this.alts and also setting
 * clue.altsGroups where applicable.
 */
Exolve.prototype.parseAlternatives = function() {
  if (this.altsSpecs.length == 0) {
    return;
  }
  if (this.hasUnsolvedCells || this.hasDgmlessCells) {
    this.throwErr('exolve-alternatives cannot be used when there are cells ' +
                  'without solutions or diagramless cells');
  }
  this.alts = {
    groupToCells: [],
    cellToAlt: new Map(),
    activeGroups: new Set(),
  };
  for (const alts of this.altsSpecs) {
    const pieces = alts.split(/\s+/);
    if (pieces.length == 0) continue;
    const cells = [];
    for (const piece of pieces) {
      const cellAndLetter = piece.split(':');
      if (cellAndLetter.length != 2) {
        this.throwErr('exolve-alternatives: cannot parse ' + piece +
                      ' as cell:letter');
      }
      const cell = this.parseCellLocation(cellAndLetter[0]);
      if (!cell) {
        this.throwErr('exolve-alternatives: cannot parse cell from ' + piece +
                      ' (as cell:letter)');
      }
      const gridCell = this.grid[cell[0]][cell[1]];
      if (!gridCell.isLight) {
        this.throwErr('exolve-alternatives: cell in ' + piece +
                      ' (as cell:letter) is not a light cell');
      }
      if (gridCell.prefill) {
        this.throwErr('exolve-alternatives: cell listed in ' + piece + ' (as ' +
                      'cell:letter) has a prefilled value');
      }
      const letter = cellAndLetter[1];
      if (!this.caseCheck(letter)) {
        this.throwErr('exolve-alternatives: cannot parse letter from ' + piece +
                      ' (as cell:letter)');
      }
      if (letter == gridCell.solution) {
        this.throwErr('exolve-alternatives: letter in ' + piece +
                      ' (as cell:letter) is already the default solution');
      }
      const cellKey = JSON.stringify(cell);
      if (this.alts.cellToAlt.has(cellKey)) {
        this.throwErr('exolve-alternatives: cell in ' + piece + ' (as ' +
                      'cell:letter) is already in another exolve-alternatives');
      }
      this.alts.cellToAlt.set(cellKey, {
        group: this.alts.groupToCells.length,
        letter: letter
      });
      cells.push(cell);
    }
    this.alts.groupToCells.push(cells);
  }
  if (this.alts.groupToCells.length == 0) {
    console.log('No valid exolve-alternatives specs were found');
    this.alts = null;
    return;
  }
  /** Set altsGroups in clues when applicable */
  for (const ci of this.allClueIndices) {
    const clue = this.clues[ci];
    if (clue.parentClueIndex) {
      continue;
    }
    const cells = this.getAllCells(ci);
    const groups = new Set;
    for (const cell of cells) {
      const cellKey = JSON.stringify(cell);
      if (!this.alts.cellToAlt.has(cellKey)) continue;
      const cellAlt = this.alts.cellToAlt.get(cellKey);
      groups.add(cellAlt.group);
    }
    if (groups.size > 0) {
      if (groups.size > 3) {
        this.throwErr('exolve-alternatives: number of groups in clue ' +
                      this.clueLabelDisp(clue) + ' (' + groups.size +
                      ') is too high (can be at most 3)');
      }
      clue.altsGroups = Array.from(groups);
    }
  }
}

Exolve.prototype.extractSectionLines = function(start, end) {
  /**
   * Grab any text after the exolve-*: marker, which is at index start-1.
   */
  let text = '';
  if (start > 0) {
    const markerLine = this.specLines[start - 1].trim();
    if (markerLine.startsWith('exolve-')) {
      const colon = markerLine.indexOf(':');
      if (colon >= 0) {
        text = markerLine.substr(colon + 1).trim();
      }
    }
  }
  let l = start;
  while (l <= end) {
    if (text) text += '\n';
    text += this.specLines[l];
    l++;
  }
  return text.trim();
}

// Extracts the prelude from its previously identified lines and sets up
// its display.
Exolve.prototype.parseAndDisplayPrelude = function() {
  const lines = this.sectionLines['prelude'] ||
                this.sectionLines['preamble'] || [-1,-1];
  if (lines[0] < 0) {
    return;
  }
  const preamble = this.extractSectionLines(lines[0], lines[1]);
  if (!preamble) {
    return;
  }
  this.preambleElt.innerHTML = preamble;
}

Exolve.prototype.parseAndDisplayPS = function() {
  const lines = this.sectionLines['postscript'] || [-1,-1];
  if (lines[0] < 0) {
    return;
  }
  const psText = this.extractSectionLines(lines[0], lines[1]);
  if (!psText) {
    return;
  }
  psHTML = `<div id='${this.prefix}-postscript'
    class='xlv-postscript'><hr> ${psText} </div>`;
  this.frame.insertAdjacentHTML('beforeend', psHTML);
}

// Extracts the explanations section from its previously identified lines,
// populates its element, and adds it to revelationList.
Exolve.prototype.parseAndDisplayExplanations = function() {
  const lines = this.sectionLines['explanations'] || [-1,-1];
  if (lines[0] < 0) {
    return;
  }
  const explnText = this.extractSectionLines(lines[0], lines[1]);
  if (!explnText) {
    return;
  }
  this.explanations.innerHTML = explnText;
  const links = this.explanations.getElementsByTagName('a');
  if (links.length > 0) {
    this.qrUrlsDiv.style.display = "";
  }
  this.revelationList.push(this.explanations);
}

Exolve.prototype.parseAndDisplayMaker = function() {
  const lines = this.sectionLines['maker'] || [-1,-1];
  if (lines[0] < 0) {
    return;
  }
  const makerText = this.extractSectionLines(lines[0], lines[1]);
  if (!makerText) {
    return;
  }
  const maker = `<br>${this.textLabels['maker-info']}:<br>\n` +
    '<div style="margin:0 0 0 4ex">\n' + makerText + '</div>';
  const elt = document.getElementById(this.prefix + '-metadata')
  elt.insertAdjacentHTML('beforeend', maker)
}

// Parses exolve-relabel, noting relabelled texts of various buttons etc.
Exolve.prototype.parseRelabel = function() {
  const lines = this.sectionLines['relabel'] || [-1,-1];
  if (lines[0] < 0) {
    return;
  }
  const relabelText = this.extractSectionLines(lines[0], lines[1]);
  if (!relabelText) {
    return;
  }
  const relabelLines = relabelText.split('\n');
  for (specLine of relabelLines) {
    const colon = specLine.indexOf(':')
    if (colon < 0) {
      this.throwErr('Line in exolve-relabel does not look like ' +
                    '"name: new-label":' + specLine)
    }
    let id = specLine.substr(0, colon).trim()
    let val = specLine.substr(colon + 1).trim()
    if (this.textLabels[id]) {
      this.textLabels[id] = val
    } else {
      this.throwErr('exolve-relabel: unsupported id: ' + id)
    }
  }
}

// Append an error message to the errors div. Scuttle everything by setting
// gridWidth to 0.
Exolve.prototype.throwErr = function(error) {
  const e = document.getElementById(this.prefix + '-errors')
  if (e) {
    e.innerHTML = e.innerHTML + '<br/>' + error;
  } else {
    console.log('Exolve error (stack trace follows):' + error);
    console.log(error.stack);
    alert('Exolve found unrecoverable error: ' + error);
  }
  this.gridWidth = 0
  throw error;
}

Exolve.prototype.dismissWarnings = function() {
  const w = document.getElementById(this.prefix + '-warnings-panel')
  if (w) {
    w.style.display = 'none';
  }
}

Exolve.prototype.showWarning = function(warning, opt) {
  let w = document.getElementById(this.prefix + '-warnings')
  if (!w) {
    const e = document.getElementById(this.prefix + '-errors')
    e.insertAdjacentHTML('beforeend', `
      <div id="${this.prefix}-warnings-panel"
          class="xlv-wide-box"
          title="${this.textLabels['warnings.hover']}">
        <div class="xlv-warnings-label">
          <button class="xlv-small-button"
              id="${this.prefix}-dismiss-warnings">
            &times;
          </button>
          ${this.textLabels["warnings-label"]}
        </div>
        <ul id="${this.prefix}-warnings" class="xlv-warnings">
        </ul>
      </div>`);
    w = document.getElementById(this.prefix + '-warnings')
    const wd = document.getElementById(this.prefix + '-dismiss-warnings')
    wd.addEventListener('click', this.dismissWarnings.bind(this));
  }
  w.insertAdjacentHTML('beforeend', `
      <li>${warning}</li>`);
  if (!this.optionsForWarningFixes.includes(opt)) {
    this.optionsForWarningFixes.push(opt);
  }
}

/**
 * Run some checks for serious problems with grid dimensions, etc. If found,
 * abort with error.
 */
Exolve.prototype.checkConsistency = function() {
  if (this.gridWidth < 1 || this.gridWidth > this.MAX_GRID_SIZE ||
      this.gridHeight < 1 || this.gridHeight > this.MAX_GRID_SIZE) {
    this.throwErr('Bad/missing width/height');
  }
  if (this.layers3d <= 0 || this.gridHeight % this.layers3d != 0) {
    this.throwErr('The number of 3-D layers (' + this.layers3d +
                  ') must be a positive divisor of height (' +
                  this.gridHeight + ')');
  }
  if (this.layers3d > 1 && this.hasDgmlessCells) {
    this.throwErr(
        'Diagramless cells are (currently) not allowed in 3-D crosswords');
  }
  if (this.hasDgmlessCells && this.shapedCells.length > 0) {
    this.throwErr(
        'Diagramless cells are not allowed when shaped-cells are present');
  }
  if (this.layers3d > 1) {
    if (this.shapedCells.length > 0) {
      this.throwErr('Cannot use shaped-cells in 3d crosswords');
    }
    if (this.sectionLines['across'] || this.sectionLines['down']) {
      this.throwErr('Use 3d-across/3d-away/3d-down sections in 3-D ' +
                    'crosswords, not across/down');
    }
  } else {
    if (this.sectionLines['3d-across'] || this.sectionLines['3d-down'] ||
        this.sectionLines['3d-away']) {
      this.throwErr('Cannot use 3d-across/3d-away/3d-down sections in ' +
                    'non 3-D crosswords, not across/down');
    }
  }
  if (this.noRebusLines.length > 0 && !this.hasRebusCells) {
    this.throwErr('Cannot specify exolve-no-rebus without turning on the ' +
                  'exolve-option for rebus-cells');
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
      this.throwErr('Have ' + this.submitKeys.length +
                    ' submit parameter keys, need ' + numKeys);
    }
  }
  let noClueList = ''
  for (const ci of Object.keys(this.clues)) {
    const clue = this.clues[ci];
    const cname = this.clueLabelDisp(clue);
    if (clue.parentClueIndex) {
      continue
    }
    if (!clue.clue) {
      if (noClueList) noClueList += ', '
      noClueList += cname
    }
    const cells = this.getAllCells(ci);
    const lightLen = cells.length;
    if (!this.ignoreEnumMismatch && !this.hasDgmlessCells &&
        clue.enumLen > 0 && lightLen > 0 && clue.enumLen != lightLen &&
        (!cells.endsOnStart || clue.enumLen != lightLen + 1)) {
      this.showWarning(cname + ': enum asks for ' + clue.enumLen +
          ' cells, but the grid shows ' + lightLen + ' cells',
          'ignore-enum-mismatch');
    }
  }
  if (!this.hasNodirClues && !this.ignoreUnclued && noClueList) {
    this.showWarning('No clue(s) provided for: ' + noClueList, 'ignore-unclued');
  }
  if (this.hasRebusCells && (this.langMaxCharCodes > 1)) {
    this.throwErr(
        'Sorry, no rebus cells when the language has max-char-codes > 1.');
  }
  if (this.hasRebusCells && this.hasDgmlessCells) {
    this.throwErr('Sorry, no rebus cells when there are diagramless cells.');
  }
}

Exolve.prototype.caseCheck = function(c) {
  if (c.length > 1 && (this.hasRebusCells || this.langMaxCharCodes > 1)) {
    for (const letter of c) {
      if (!this.caseCheck(letter)) {
        return false;
      }
    }
    return true
  }
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

/**
 * In this description, "alphabets" means A-Z or language-specific letters.
 *
 * display chars: alphabets, ⬛, 0-9, chars allowed with allow-chars.
 * state chars: alphabets, '.', '0' and '?' (blanks), 1 (block in dgmless),
 *   chars allowed with allow-chars/allow-digits.
 *
 * grid[i][j].solution and grid[i][j].currLetter are in "state char" space.
 *
 * The grid, as specified in the exolve-grid section and consumed by
 * parseGrid(), either uses just '0' and '.' or uses '.' and alphabets and '?'
 * (and 0-9 if allow-digits and any special characters from allow-chars).
 */
Exolve.prototype.isValidDisplayChar = function(c) {
  if (this.caseCheck(c)) {
    return true;
  }
  if (c == this.BLOCK_CHAR) {
    return true;
  }
  if (this.allowChars && this.allowChars[c]) {
    return true;
  }
  if (this.hasRebusCells && c.length > 1) {
    for (const letter of c) {
      if (!this.isValidDisplayChar(letter)) return false;
    }
    return true;
  }
  return false;
}
Exolve.prototype.isValidStateChar = function(c) {
  if (this.caseCheck(c)) {
    return true;
  }
  if (this.allowChars && this.allowChars[c] &&
      !this.SPECIAL_STATE_CHARS.hasOwnProperty(c)) {
    return true;
  }
  if (c == '0') {
    return true;
  }
  if (this.hasDgmlessCells && c == '1') {
    return true;
  }
  if (this.hasRebusCells && c.length > 1) {
    for (const letter of c) {
      if (!this.isValidStateChar(letter)) return false;
    }
    return true;
  }
  return false;
}
Exolve.prototype.isValidGridChar = function(c) {
  return this.isValidStateChar(c) || c == '?';
}

Exolve.prototype.stateToDisplayChar = function(c) {
  if (c == '0' || c == '?') {
    return '';
  }
  if (c == '1') {
    return this.BLOCK_CHAR;
  }
  if (this.SPECIAL_DISPLAY_CHARS.hasOwnProperty(c)) {
    return this.SPECIAL_DISPLAY_CHARS[c];
  }
  if (this.hasRebusCells && c.length > 1) {
    let out = '';
    for (const letter of c) {
      out += this.stateToDisplayChar(letter);
    }
    return out;
  }
  return c;
}

Exolve.prototype.displayToStateChar = function(c) {
  if (c == this.BLOCK_CHAR) {
    return '1';
  }
  if (this.SPECIAL_STATE_CHARS.hasOwnProperty(c)) {
    return this.SPECIAL_STATE_CHARS[c];
  }
  if (this.hasRebusCells && c.length > 1) {
    let out = '';
    for (const letter of c) {
      out += this.displayToStateChar(letter);
    }
    return out;
  }
  if (!this.isValidDisplayChar(c)) {
    return '0';
  }
  return c;
}

Exolve.prototype.newGridCell = function(row, col, letter, escaped=false) {
  const cell = {};
  cell.row = row;
  cell.col = col;
  cell.currLetter = '?';
  let isSpecial = false;
  if (!escaped &&
      (letter == '?' || letter == '.' || letter == '0')) {
    cell.solution = letter;
    isSpecial = true;
  } else {
    cell.solution = this.displayToStateChar(letter.toUpperCase());
  }
  cell.isLight = false;
  if (cell.solution != '.') {
    if (!isSpecial && !this.isValidStateChar(cell.solution)) {
      this.throwErr('Bad grid entry at ' + row + ',' + col + ':' + letter);
    }
    cell.isLight = true;
  }
  cell.prefill = false;
  cell.isDgmless = false;

  cell.hasBarAfter = false;
  cell.hasBarUnder = false;
  cell.hasCircle = false;
  return cell;
};

// Parse grid lines into a gridWidth x gridHeight array of objects that have
// the following properties:
//   isLight
//   hasBarAfter
//   hasBarUnder
//   hasCircle
//   isDgmless
// Also set the following globals:
//   hasDgmlessCells
//   hasUnsolvedCells
Exolve.prototype.parseGrid = function() {
  let allEntriesAre0s = true
  const DECORATORS = ' +|_@!*~{\['
  const reDecorators = new RegExp('[' + DECORATORS + ']')
  const reNextChar = new RegExp('[\.0&' + DECORATORS + ']')

  const lines = this.sectionLines['grid'] || [-1,-1];
  const gridFirstLine = lines[0];
  const gridLastLine = lines[1];
  if (gridFirstLine < 0 || gridFirstLine > gridLastLine ||
      this.gridHeight != gridLastLine - gridFirstLine + 1) {
    this.throwErr('Not the right number of lines (' + this.gridHeight +
                  ') in or missing exolve-grid section');
  }
  this.grid = new Array(this.gridHeight);
  for (let i = 0; i < this.gridHeight; i++) {
    this.grid[i] = new Array(this.gridWidth);
    let gridLine = this.specLines[i + gridFirstLine].trim().toUpperCase();
    if (!this.multiLetter) {
      gridLine = gridLine.replace(/\s/g, '');
    } else {
      gridLine = gridLine.replace(/\s+/g, ' ');
    }
    let gridLineIndex = 0;
    for (let j = 0; j < this.gridWidth; j++) {
      if (gridLineIndex >= gridLine.length) {
        let errmsg = 'Too few letters in the grid at row,col: ' + i + ',' + j;
        if (this.multiLetter) {
          errmsg = errmsg + '. Note that grid letters must be separated by ' +
            'spaces or decorators for languages that have compound characters ' +
            'or if there are rebus cells';
        }
        this.throwErr(errmsg);
      }
      let letter = gridLine.charAt(gridLineIndex++);
      let escaped = false;
      if (letter == '&') {
        letter = gridLine.charAt(gridLineIndex++);
        escaped = true;
      }
      if (this.multiLetter && (escaped || (letter != '.' && letter != '0'))) {
        let next = gridLineIndex;
        while (next < gridLine.length) {
          let nextChar = gridLine.charAt(next);
          if (nextChar == '&' && (next + 1 < gridLine.length)) {
            next++;
            letter += gridLine.charAt(next);
            next++;
          } else if (!reNextChar.test(nextChar)) {
            letter += nextChar;
            next++;
          } else {
            break;
          }
        }
        gridLineIndex = next;
      }
      this.grid[i][j] = this.newGridCell(i, j, letter, escaped);
      const gridCell = this.grid[i][j];
      // Deal with . and 0 and 1 in second pass
      let thisChar = '';
      while (gridLineIndex < gridLine.length &&
             (thisChar = gridLine.charAt(gridLineIndex)) &&
             reDecorators.test(thisChar)) {
        if (thisChar == '|') {
          gridCell.hasBarAfter = true;
        } else if (thisChar == '_') {
          gridCell.hasBarUnder = true;
        } else if (thisChar == '+') {
          gridCell.hasBarAfter = true;
          gridCell.hasBarUnder = true;
        } else if (thisChar == '@') {
          gridCell.hasCircle = true;
        } else if (thisChar == '*') {
          gridCell.isDgmless = true;
        } else if (thisChar == '!') {
          gridCell.prefill = true;
        } else if (thisChar == '~') {
          gridCell.skipNum = true;
        } else if (thisChar == '[') {
          gridLineIndex +=
            this.parseShapedCellSpec(gridLine, gridLineIndex, gridCell);
        } else if (thisChar == '{') {
          gridLineIndex +=
            this.parseCellDecList(gridLine, gridLineIndex, gridCell);
        } else if (thisChar == ' ') {
        } else {
          this.throwErr('Should not happen! thisChar = ' + thisChar);
        }
        gridLineIndex++;
      }
      if (gridCell.isLight && gridCell.solution != '0' && !gridCell.prefill) {
        allEntriesAre0s = false;
      }
    }
  }
  // We use two passes to be able to detect if 0 means blank cell or digit 0.
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      const gridCell = this.grid[i][j];
      if (gridCell.isLight) {
        let saved = gridCell.solution;
        if (gridCell.solution == '0') {
          if (allEntriesAre0s && !gridCell.prefill) {
            this.hasUnsolvedCells = true;
          } else {
            gridCell.solution = this.SPECIAL_STATE_CHARS['0'];
          }
        }
        if (!this.isValidGridChar(gridCell.solution)) {
          this.throwErr('Invalid grid entry[' + i + '][' + j + ']: ' + saved);
        }
      }
      if (gridCell.isDgmless && gridCell.solution == '.') {
        gridCell.solution = '1';
      }
      if (gridCell.prefill && !gridCell.isLight) {
        this.throwErr('Pre-filled cell (' + i + ',' + j + ') not in a light: ');
      }
      if (gridCell.isDgmless) {
        this.hasDgmlessCells = true;
      }
    }
  }
  if (this.hasDgmlessCells) {
    this.hideCopyPlaceholders = true;
  }
  if (this.layers3d > 1) {
    // 3-d crossword. Mark layer boundaries with bars.
    for (let l = 1; l < this.layers3d; l++) {
      const i = (l * this.h3dLayer) - 1;
      for (let j = 0; j < this.gridWidth; j++) {
        this.grid[i][j].hasBarUnder = true;
      }
    }
  }
}

Exolve.prototype.parse3d = function(s) {
  const parts = s.split(' ');
  if (parts.length == 0) {
    this.throwErr('exolve-3d: must be followed by #layers')
  }
  this.layers3d = parseInt(parts[0]);
  if (parts.length > 1) {
    this.angle3d = parseFloat(parts[1]);
  }
  if (parts.length > 2) {
    this.ratio3d = parseFloat(parts[2]);
  }
  if (isNaN(this.layers3d) || this.layers3d <= 1 || isNaN(this.angle3d) ||
      isNaN(this.ratio3d) || this.layers3d < 1 ||
      this.angle3d < 20 || this.angle3d > 90 ||
      this.ratio3d < 0.4 || this.ratio3d > 1.6) {
    this.throwErr('exolve-3d: invalid parameters specified')
  }
  this.skew3d = `skewX(${this.angle3d - 90}deg)`;
}

Exolve.prototype.startsAcrossClue = function(i, j) {
  const gridCell = this.grid[i][j];
  if (!gridCell.isLight || gridCell.shapedCell || gridCell.hasBarAfter) {
    return null;
  }
  if (j > 0) {
    const cellL = this.grid[i][j - 1];
    if (cellL.isLight && !cellL.hasBarAfter && !cellL.shapedCell) {
      return null;
    }
  }
  if (j == this.gridWidth - 1) {
    return null;
  }
  const cellR = this.grid[i][j + 1];
  if (!cellR.isLight || cellR.shapedCell) {
    return null;
  }
  const cells = [[i, j]];
  for (let jnext = j + 1; jnext < this.gridWidth; jnext++) {
    const gridCell = this.grid[i][jnext];
    if (!gridCell.isLight || gridCell.shapedCell) break;
    cells.push([i, jnext]);
    if (gridCell.hasBarAfter) break;
  }
  return cells;
}

Exolve.prototype.startsDownClue = function(i, j) {
  const gridCell = this.grid[i][j];
  if (!gridCell.isLight || gridCell.shapedCell || gridCell.hasBarUnder) {
    return null;
  }
  if (i > 0) {
    const cellU = this.grid[i - 1][j];
    if (cellU.isLight && !cellU.hasBarUnder && !cellU.shapedCell) {
      return null;
    }
  }
  if (i == this.gridHeight - 1) {
    return null;
  }
  const cellD = this.grid[i + 1][j];
  if (!cellD.isLight || cellD.shapedCell) {
    return null;
  }
  const cells = [[i, j]];
  for (let inext = i + 1; inext < this.gridHeight; inext++) {
    const gridCell = this.grid[inext][j];
    if (!gridCell.isLight || gridCell.shapedCell) break;
    cells.push([inext, j]);
    if (gridCell.hasBarUnder) break;
  }
  return cells;
}

Exolve.prototype.startsZ3dClue = function(i, j) {
  if (this.layers3d <= 1) {
    return null;
  }
  if (!this.grid[i][j].isLight) {
    return null;
  }
  const l = Math.floor(i / this.h3dLayer);
  if (l == this.layers3d - 1) {
    return null;
  }
  const li = i % this.h3dLayer;
  const iNext = ((l + 1) * this.h3dLayer) + li;
  if (!this.grid[iNext][j].isLight) {
    return null;
  }
  const iPrev = ((l - 1) * this.h3dLayer) + li;
  if (iPrev >= 0 && this.grid[iPrev][j].isLight) {
    return null;
  }
  const cells = [[i, j]];
  for (let nextl = l + 1; nextl < this.layers3d; nextl++) {
    const row = (nextl * this.h3dLayer) + li;
    if (!this.grid[row][j].isLight) {
      break;
    }
    cells.push([row, j]);
  }
  return cells;
}

Exolve.prototype.newClue = function(index) {
  clue = {};
  clue.index = index;
  clue.dir = index.substr(0, 1);
  clue.label = index.substr(1);
  clue.cells = [];
  clue.clue = '';

  clue.enumParse = this.parseEnum('');
  clue.enumLen = 0;
  clue.hyphenAfter = [];
  clue.wordEndAfter = [];
  clue.placeholder = '';

  clue.anno = '';
  clue.linkedOffset = 0;
  clue.reversed = false;
  clue.solution = '';
  clue.hints = [];
  return clue;
}

Exolve.prototype.maybeReverseLight = function(cells) {
  const key = this.reversalKey(cells);
  if (!this.reversals[key]) return false;
  cells.reverse();
  this.usedReversals[key] = this.reversals[key];
  delete this.reversals[key];
  return true;
}

Exolve.prototype.setCellLightMemberships = function(clue) {
  if (!clue || !clue.cells || clue.cells.length == 0) {
    return;
  }
  let prev = [];
  for (let c of clue.cells) {
    let gridCell = this.grid[c[0]][c[1]];
    let navDir = clue.dir;
    if (navDir == 'X') {
      if (!gridCell.nodirClues) {
        gridCell.nodirClues = [];
      }
      if (!gridCell.nodirClues.includes(clue.index)) {
        gridCell.nodirClues.push(clue.index);
      }
      navDir = clue.index;
    } else if (navDir == 'A') {
      gridCell.acrossClueLabel = clue.label;
    } else if (navDir == 'D') {
      gridCell.downClueLabel = clue.label;
    } else if (navDir == 'Z') {
      gridCell.z3dClueLabel = clue.label;
    }
    if (prev.length > 0) {
      this.grid[prev[0]][prev[1]]['succ' + navDir] = {
        cell: c,
        dir: navDir
      }
      gridCell['pred' + navDir] = {
        cell: prev,
        dir: navDir
      }
    }
    prev = c;
  }
}

// Sets starts{Across,Down}Clue (boolean) and startsClueLabel (#) in
// grid[i][j]s where clues start.
Exolve.prototype.markClueStartsUsingGrid = function() {
  if (this.hasDgmlessCells && this.hasUnsolvedCells) {
    // Cannot rely on grid. Clue starts should be provided in clues using
    // prefixes like #a8, #d2, etc.
    return
  }
  // First mark the spots in the grid where lights start. Use light
  // orientations when provided.
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      let cells = this.startsAcrossClue(i, j);
      if (cells) {
        const reversed = this.maybeReverseLight(cells);
        const c = cells[0];
        const gridCell = this.grid[c[0]][c[1]];
        gridCell.startsAcrossClue = cells;
        if (reversed) gridCell.revAcrossClue = true;
      }
      cells = this.startsDownClue(i, j);
      if (cells && this.layers3d > 1) {
        // "Away" is the normal direction in 3-D, not "Towards"
        cells.reverse();
      }
      if (cells) {
        const reversed = this.maybeReverseLight(cells);
        const c = cells[0];
        const gridCell = this.grid[c[0]][c[1]];
        gridCell.startsDownClue = cells;
        if (reversed) gridCell.revDownClue = true;
      }
      cells = this.startsZ3dClue(i, j);
      if (cells) {
        const reversed = this.maybeReverseLight(cells);
        const c = cells[0];
        const gridCell = this.grid[c[0]][c[1]];
        gridCell.startsZ3dClue = cells;
        if (reversed) gridCell.revZ3dClue = true;
      }
    }
  }
  // All the reversals specified should have been used
  if (Object.keys(this.reversals).length > 0) {
    console.log('These reversals specified in exolve-reverse were invalid: ' +
                JSON.stringify(this.reversals));
  }

  let nextClueNum = 1;
  let nextSkipNum = 1;
  for (let ii = 0; ii < this.gridHeight; ii++) {
    let i = ii;
    if (this.layers3d > 1) {
      // Go near-to-far within a layer!
      const l = Math.floor(ii / this.h3dLayer);
      const li = this.h3dLayer - 1 - (ii % this.h3dLayer);
      i = (l * this.h3dLayer) + li;
    }
    for (let j = 0; j < this.gridWidth; j++) {
      let gridCell = this.grid[i][j]
      let label = gridCell.skipNum ? ('~' + nextSkipNum) : ('' + nextClueNum)
      if (gridCell.startsAcrossClue) {
        gridCell.startsClueLabel = '' + label;
        const index = 'A' + label;
        const clue = this.newClue(index);
        clue.cells = gridCell.startsAcrossClue;
        if (gridCell.revAcrossClue) {
          clue.reversed = true;
        }
        this.clues[index] = clue;
      }
      if (gridCell.startsDownClue) {
        gridCell.startsClueLabel = '' + label;
        const index = 'D' + label;
        const clue = this.newClue(index);
        clue.cells = gridCell.startsDownClue;
        if (gridCell.revDownClue) {
          clue.reversed = true;
        }
        this.clues[index] = clue;
      }
      if (gridCell.startsZ3dClue) {
        gridCell.startsClueLabel = '' + label;
        const index = 'Z' + label;
        const clue = this.newClue(index);
        clue.cells = gridCell.startsZ3dClue;
        if (gridCell.revZ3dClue) {
          clue.reversed = true;
        }
        this.clues[index] = clue;
      }
      if (gridCell.startsClueLabel) {
        if (gridCell.skipNum) {
          nextSkipNum++
        } else {
          nextClueNum++
        }
      } else {
        if (gridCell.skipNum) {
          this.throwErr('Cell ' + i + ',' + j + ' has the "skip number" ' +
                        'decorator ~ but no clue starts there')
        }
      }
    }
  }
  for (let ci in this.clues) {
    this.setCellLightMemberships(this.clues[ci]);
  }
}

// If there are any html closing tags, move past them.
Exolve.prototype.adjustAfterEnum = function(clueLine, afterEnum) {
  let lineAfter = clueLine.substr(afterEnum);
  while (lineAfter.trim().substr(0, 2) == '</') {
    let closer = clueLine.indexOf('>', afterEnum);
    if (closer < 0) {
      return afterEnum;
    }
    afterEnum = closer + 1;
    lineAfter = clueLine.substr(afterEnum);
  }
  return afterEnum;
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

/**
 * Return [oparen, cparen, isNumeric] as the best indices of '(' and ')' for
 * the enum in the clue. null if not found.
 * We return the last matching enum part, unless we encounter an enum part
 * that is immediately followed by something in square brackets, in which
 * case we pass that enum part.
 */
Exolve.prototype.findEnum = function(clueLine) {
  let candidate = null;
  let start = 0;
  let cluePart = clueLine;
  while (start < clueLine.length) {
    let enumLocation = cluePart.search(/\([1-9]+[0-9\-,\.'’\s]*\)/);
    let numeric = true;
    if (enumLocation < 0 && !candidate) {
      numeric = false;
      /** Look for the strings 'words'/'letters' or subwords, or ?, in parens */
      enumLocation = cluePart.search(
          /\(([^)]*\s(w[o]?[r]?[d]?[s]?|l[e]?[t]?[t]?[e]?[r]?[s]?)[^)a-z]*|\s*\?\s*)\)/i);
    }
    if (enumLocation < 0 && !candidate) {
      /**
       * Look for the strings 'abr', 'abb', or 'abbreviation'/'acronym'
       * prefixes, in parens.
       */
      enumLocation = cluePart.search(
          /\(([^)]*(a[b]?b[r]?[e]?[v]?[i]?[a]?[t]?[i]?[o]?[n]?|acr[o]?[n]?[y]?[m]?)[^)a-z]*)\)/i);
    }
    if (enumLocation < 0) {
      break;
    }
    const enumEndLocation = enumLocation +
      cluePart.substr(enumLocation).indexOf(')');
    console.assert(enumEndLocation >= 0, cluePart);
    candidate = [start + enumLocation, start + enumEndLocation, numeric];
    start += (enumEndLocation + 1);
    cluePart = clueLine.substr(start);
    if (cluePart.search(/[ ]*\[.*\]/) == 0) {
      return candidate;
    }
  }
  return candidate;
}

/**
 * Parse an enum like (4) or (4,5), or (5-2,4) or (5 6). Also allow enums like these:
 *   (?), (2 words) (5 letters), (6, 2 wds) (abbr.) (acr.)
 * Return an object with the following properties:
 * enumLen: set to 0 if the enum is something like (?) or (2 words), else
 *   the #letters implied by the enum.
 * hyphenAfter[] (0-based indices)
 * wordEndAfter[] (0-based indices)
 * afterClue index after clue (excluding enum if present)
 * afterEnum index after enum (if present)
 * dontShow if enum is followed immediately by *
 * placeholder (something like ???? ???-?'?)
 * enumStr the substring that is the enum, such as "(4-2,1)"
 * hasEmptyBracs is true if there is [] terminating the clue and not an enum
 *
 * For US-style puzzles with no enums, if an anno is provided, it is
 * prefixed with '[]'.
 */
Exolve.prototype.parseEnum = function(clueLine) {
  const parse = {
    enumLen: 0,
    wordEndAfter: [],
    hyphenAfter: [],
    afterClue: clueLine.length,
    afterEnum: clueLine.length,
    dontShow: false,
    placeholder: '',
    enumStr: '',
    hasEmptyBracs: false,
  };
  const foundEnum = this.findEnum(clueLine);
  if (!foundEnum) {
    const bracsIndex = clueLine.lastIndexOf('[]');
    if (bracsIndex >= 0) {
      parse.afterClue = bracsIndex;
      parse.afterEnum = bracsIndex;
      parse.hasEmptyBracs = true;
    }
    return parse;
  }
  const enumLocation = foundEnum[0];
  const enumEndLocation = foundEnum[1];
  const isNumeric = foundEnum[2];
  parse.enumStr = clueLine.substring(enumLocation, enumEndLocation + 1);
  parse.afterClue = enumLocation;
  if (clueLine.charAt(enumEndLocation + 1) == '*') {
    parse.afterEnum = enumEndLocation + 2;
    parse.dontShow = true;
  } else {
    parse.afterEnum = this.adjustAfterEnum(clueLine, enumEndLocation + 1);
  }
  if (!isNumeric) {
    /* Salvage an enumLen from cases like (6, 2 words) and (5 letters) */
    let k = 0;
    const kLetters = parse.enumStr.match(
        /\(\s*(\d+)\s*l[e]?[t]?[t]?[e]?[r]?[s]?\s*\)/i);
    if (kLetters) {
      k = parseInt(kLetters[1], 10);
    }
    const kWords = parse.enumStr.match(
        /\(\s*(\d+)\s*,\s*\d+\s*w[o]?[r]?[d]?[s]?\s*\)/i);
    if (kWords) {
      k = parseInt(kWords[1], 10);
    }
    if (!isNaN(k) && k > 0) {
      parse.enumLen = k;
    }
    return parse;
  }
  let enumLeft = clueLine.substring(enumLocation + 1, enumEndLocation);
  let nextPart;
  while (enumLeft && (nextPart = parseInt(enumLeft)) && !isNaN(nextPart) &&
         nextPart > 0) {
    for (let i = 0; i < nextPart; i++) {
      parse.placeholder = parse.placeholder + '?';
    }
    parse.enumLen += nextPart;
    enumLeft = enumLeft.replace(/^\s*\d+/, '');
    enumLeft = enumLeft.replace(/^\s+(\d)/, ',$1');
    let nextSymbol = enumLeft.substr(0, 1);
    if (nextSymbol == '-') {
      parse.hyphenAfter.push(parse.enumLen - 1);
      enumLeft = enumLeft.substr(1);
    } else if (nextSymbol == ',') {
      nextSymbol = ' ';
      parse.wordEndAfter.push(parse.enumLen - 1);
      enumLeft = enumLeft.substr(1);
    } else if (nextSymbol == '.') {
      parse.wordEndAfter.push(parse.enumLen - 1);
      enumLeft = enumLeft.substr(1);
    } else if (nextSymbol == '\'') {
      enumLeft = enumLeft.substr(1);
    } else if (enumLeft.indexOf('’') == 0) {
      // Fancy apostrophe
      nextSymbol = '\'';
      enumLeft = enumLeft.substr('’'.length);
    } else {
      break;
    }
    parse.placeholder = parse.placeholder + nextSymbol;
  }
  return parse;
}

/**
 * The direction prefix must start at the beginning of s, with this 2-d
 * exception if matchSpecial==true (for parsing linked clue numbers
 * coming from non-exolve text):
 * <n> [a|d|across|down|ac|dn]((, *[0-9])|( [A-Z]))
 */
Exolve.prototype.parseDir = function(s, matchSpecial=false) {
  const parse = {dir: '', reversed: false};
  let dirStr = '';
  let skip = 0;
  const lcs = s.toLowerCase();
  if (this.layers3d <= 1) {
    const match = lcs.match(/^[adbu]/);
    const extMatch = lcs.match(/^[a-z]*/);
    if (match && match.length == 1) {
      console.assert(extMatch && extMatch.length == 1, match, extMatch);
      dirStr = match[0];
      if (dirStr == 'a' && 'across'.startsWith(extMatch[0])) {
        parse.dir = 'A';
        skip = extMatch[0].length;
      } else if (dirStr == 'd' && ('down'.startsWith(extMatch[0]) || extMatch[0] == 'dn')) {
        parse.dir = 'D';
        skip = extMatch[0].length;
      } else if (dirStr == 'b' && 'back'.startsWith(extMatch[0])) {
        parse.dir = 'A';
        parse.reversed = true;
        skip = extMatch[0].length;
      } else if (dirStr == 'u' && 'up'.startsWith(extMatch[0])) {
        parse.dir = 'D';
        parse.reversed = true;
        skip = extMatch[0].length;
      }
    } else if (matchSpecial) {
      // Try the special cases.
      let specSkip = 0;
      let specDir = '';
      if (lcs.startsWith(' across')) {
        specSkip = 7;
        specDir = 'A';
      } else if (lcs.startsWith(' a')) {
        specSkip = 2;
        specDir = 'A';
      } else if (lcs.startsWith(' ac')) {
        specSkip = 3;
        specDir = 'A';
      } else if (lcs.startsWith(' down')) {
        specSkip = 5;
        specDir = 'D';
      } else if (lcs.startsWith(' d')) {
        specSkip = 2;
        specDir = 'D';
      } else if (lcs.startsWith(' dn')) {
        specSkip = 3;
        specDir = 'D';
      }
      if (specSkip > 0) {
        const suffRE = /^((,[ ]?[0-9])|( [A-Z0-9]))/;
        if (suffRE.test(s.substr(specSkip))) {
          parse.dir = specDir;
          skip = specSkip;
          dirStr = lcs.substr(1, 1);
        }
      }
    }
  } else {
    const match = lcs.match(/^[a-z][a-z]/);
    if (match && match.length == 1) {
      dirStr = match[0].trimLeft();
      skip = match[0].length;
      if (dirStr == 'ac') {
        parse.dir = 'A';
        if (lcs.startsWith('across')) {
          skip = 6;
        }
      } else if (dirStr == 'aw') {
        parse.dir = 'D';
        if (lcs.startsWith('away')) {
          skip = 4;
        }
      } else if (dirStr == 'dn' || dirStr == 'do') {
        parse.dir = 'Z';
        if (lcs.startsWith('down')) {
          skip = 4;
        }
      } else if (dirStr == 'ba') {
        parse.dir = 'A';
        parse.reversed = true;
        if (lcs.startsWith('back')) {
          skip = 4;
        }
      } else if (dirStr == 'to') {
        parse.dir = 'D';
        parse.reversed = true;
        if (lcs.startsWith('towards')) {
          skip = 7;
        } else if (lcs.startsWith('toward')) {
          skip = 6;
        }
      } else if (dirStr == 'up') {
        parse.dir = 'Z';
        parse.reversed = true;
      }
    }
  }
  if (parse.dir) {
    parse.dirStr = dirStr;
    parse.skip = skip;
  }
  return parse;
}

// Parse a clue label from the start of clueLine. The clue label can be
// specified like:
//   5 or 5d or 5D or d5 or D5 or [P] or [P]d or [P]D or d[P] or D[P]
//   or 5down or 5across or 6ac or 6dn
// The letter part can be a/d/b/u. In 3-D crosswords it has to be one of
//   ac/ba/to/aw/dn/up (ignoring case).
// Return an object with the following properties:
// notLabel
// label
// isOffNum
// dir = A/D/Z/X
// dirStr
// dirIsPrefix
// reversed (for b/d and ba/to/up).
// hasChildren, linkSep
// skip
// leadSpace
Exolve.prototype.parseClueLabel = function(clueLine, consumeTrailing=true, isChild=false) {
  let parse = {dir: '', label: '', notLabel: true};
  parse.hasChilden = false;
  parse.linkSep = '';
  parse.skip = 0;
  parse.leadSpace = '';
  const space = clueLine.match(/^\s*/);
  if (space && space.length == 1) {
    parse.skip += space[0].length;
    clueLine = clueLine.substr(space[0].length);
    parse.leadSpace = space[0];
  }

  const prefDir = this.parseDir(clueLine);
  if (prefDir.dir) {
    parse.dir = prefDir.dir;
    parse.dirIsPrefix = true;
    parse.dirStr = prefDir.dirStr;
    parse.reversed = prefDir.reversed;
    parse.skip += prefDir.skip;
    clueLine = clueLine.substr(prefDir.skip);
  }
  const numberParts = clueLine.match(/^\s*[1-9]\d*/)
  let lskip = 0;
  if (numberParts && numberParts.length == 1) {
    let clueNum = parseInt(numberParts[0])
    parse.label = '' + clueNum
    parse.isOffNum = false
    lskip = numberParts[0].length
  } else {
    if (clueLine.charAt(0) != '[') {
      return parse
    }
    let bracEnd = clueLine.indexOf(']')
    if (bracEnd < 0) {
      this.throwErr('Missing matching ] in clue label in ' + clueLine)
    }
    parse.label = clueLine.substring(1, bracEnd).trim()
    if (parse.label.charAt(parse.label.length - 1) == '.') {
       // strip trailing period
       parse.label = parse.label.substr(0, parse.label.length - 1).trim()
    }
    parse.isOffNum = true
    lskip = bracEnd + 1
  }
  parse.skip += lskip;
  clueLine = clueLine.substr(lskip)

  if (!parse.dir) {
    // If isChild=true, then parseDir will also match a space followed by 'a/across/d/down/ac/dn' if there
    // is a number or capital letter afterwards.
    const suffDir = this.parseDir(clueLine, isChild);
    if (suffDir.dir) {
      parse.dir = suffDir.dir;
      parse.dirStr = suffDir.dirStr;
      parse.reversed = suffDir.reversed;
      parse.skip += suffDir.skip;
      clueLine = clueLine.substr(suffDir.skip);
    }
  }
  parse.notLabel = false;
  if (consumeTrailing) {
    // Look for ,/&/and/'/'
    // For &, /, and "and": only treat them as child indicators if followed by a
    // number.
    commaParts = clueLine.match(/^\s*(?:,|(?:and|&|\/)\s*[1-9])/);
    if (commaParts && commaParts.length == 1) {
      parse.hasChildren = true;
      // Store the separator char in linkSep
      parse.linkSep = commaParts[0].trim();
      let skipLen = commaParts[0].length;
      if (parse.linkSep.startsWith('and') ||
          parse.linkSep.startsWith('/') ||
          parse.linkSep.startsWith('&')) {
        parse.linkSep = parse.linkSep.startsWith('/') ? '/' : '&';
        skipLen--;  // One digit was in RE.
      }
      parse.skip += skipLen;
      clueLine = clueLine.substr(skipLen);
    }
    // Consume trailing period if it is there (but not if it's followed
    // immediately by another period (i.e., don't skip "...")
    periodParts = clueLine.match(/^\s*\./)
    if (periodParts && periodParts.length == 1 && !clueLine.match(/^\s*\.\./)) {
      parse.hasChildren = false
      parse.skip += periodParts[0].length
      clueLine = clueLine.substr(periodParts[0].length)
    }
  }
  return parse
}

/**
 * Parses colour or cell or clue-label or class, essentially the possibilities
 * in exolve-colour and exolve-nina (class will be rejected in exolve-colour).
 * Returns an object like: {
 *   str: s, 
 *   colour: '' or name,
 *   cells: null or [[r1,c2], ...]
 *   isLight: false or true
 *   cls: '' or name
 * }
 */
Exolve.prototype.parseCCCC = function(s) {
  const ret = {
    str: s,
    colour: '',
    cells: null,
    isLight: false,
    cls: '',
  };
  const s2 = s.trim();
  if (this.isColour(s2)) {
    ret.colour = s2;
    return ret;
  }
  const cell = this.parseCellLocation(s2);
  if (cell) {
    ret.cells = [cell];
    return ret;
  }
  const clue = this.clueFromLabel(s2);
  if (clue && clue.cells && clue.cells.length > 1) {
    ret.cells = clue.cells;
    ret.isLight = true;
    return ret;
  }
  const elts = this.frame.getElementsByClassName(s2);
  if (elts && elts.length > 0) {
    ret.cls = s2;
    return ret;
  }
  return ret;
}

Exolve.prototype.clueFromLabel = function(s) {
  const parse = this.parseClueLabel(s);
  if (!parse.dir || !parse.label) {
    return null;
  }
  const ci = this.getDirClueIndex(parse.dir, parse.label);
  return this.clues[ci] || null;
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
      !(clue.cells.length > 0 && dir == 'X')) {
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
    if (gridCell.startsZ3dClue) {
      replIndex = 'Z' + gridCell.startsClueLabel
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
  } else if (dir == 'Z' && gridCell.startsZ3dClue) {
    replIndex = 'Z' + gridCell.startsClueLabel
  }
  clueAtRepl = this.clues[replIndex]
  if (replIndex && clueAtRepl && !clueAtRepl.clue &&
      clueAtRepl.cells.length > 0) {
    return replIndex
  }
  return clueIndex
}

Exolve.prototype.parseInClueAnnos = function(clue) {
  clue.inClueAnnos = []
  let idx = clue.clue.indexOf('~{')
  let endIdx = 0
  let clueText = clue.clue
  while (idx >= 0) {
    endIdx = clueText.indexOf('}~', idx + 1)
    if (endIdx < 0) {
      endIdx = idx
      break
    }
    let cls = 'xlv-definition'
    if (clueText.charAt(idx + 2) == '{') {
      let close = clueText.indexOf('}', idx + 3)
      if (close > idx + 3) {
        let parsedCls = clueText.substring(idx + 3, close).trim()
        if (parsedCls) {
          cls = parsedCls
        }
      }
    }
    clue.inClueAnnos.push(cls)
    this.hasReveals = true
    endIdx += 2
    idx = clueText.indexOf('~{', endIdx)
  }
}

/**
 * Parse a single clue.
 * Return an Clue object with the following properties set:
 * index
 * label
 * isOffNum
 * children[] (raw parseClueLabel() results, not yet clueIndices)
 * clue
 * enumLen
 * enumStr
 * hyphenAfter[] (0-based indices)
 * wordEndAfter[] (0-based indices)
 * placeholder
 * enumParse
 * startCell optional, used in diagramless+unsolved and off-numeric labels
 * cells[] optionally filled, if all clue cells are specified in the clue
 * anno (the part after the enum, if present)
 * isFiller
 * inClueAnnos: array of class names for in-clue anno spans
 */
Exolve.prototype.parseClue = function(dir, clueLine) {
  clueLine = clueLine.trim();
  let numCellsGiven = 0;
  let startCell = null;
  let cells = [];
  while (clueLine.indexOf('#') == 0) {
    let cell = this.parseCellLocation(clueLine.substr(1));
    if (!cell) {
      break;
    }
    if (numCellsGiven == 0) {
      startCell = cell;
    }
    clueLine = clueLine.replace(/^#[a-z0-9]*\s*/, '');
    numCellsGiven += 1;
    if (numCellsGiven == 2) {
      cells.push(startCell);
      cells.push(cell);
    } else if (numCellsGiven > 2) {
      cells.push(cell);
    }
  }
  if (cells.length > 0 && dir != 'X') {
    this.throwErr('Cells listed in non-nodir clue: ' + clueLine);
  }

  let clueLabelParse = this.parseClueLabel(clueLine);
  const clue = this.newClue(dir + clueLabelParse.label);

  if (clueLabelParse.notLabel) {
    clue.isFiller = true;
    return clue;
  }
  if (startCell) {
    clue.startCell = startCell;
  }
  if (cells.length  > 0) {
    clue.cells = cells;
  }
  if (clueLabelParse.dir && clueLabelParse.dir != dir) {
    this.throwErr('Explicit dir ' + clueLabelParse.dir +
                  ' does not match ' + dir + ' in clue: ' + clueLine);
  }
  clue.label = clueLabelParse.label;
  clue.isOffNum = clueLabelParse.isOffNum;
  let clueIndex = dir + clue.label;
  if (clue.isOffNum) {
    const offNumIndex = dir + '#' + (this.nextNonNumId++);
    if (!this.offNumClueIndices[clue.label]) {
      this.offNumClueIndices[clue.label] = [];
    }
    this.offNumClueIndices[clue.label].push(offNumIndex);
    clueIndex = offNumIndex;
  }

  clueIndex = this.maybeRelocateClue(clueIndex, dir, clue);
  clue.index = clueIndex;

  clueLine = clueLine.substr(clueLabelParse.skip);
  clue.linkSep = clueLabelParse.linkSep || '';
  clue.children = [];
  /**
   * Corner case: a child clue might omit direction if there's a prior child
   * or parent clue with the same number in this very group.
   */
  const usedDirs = {};
  if (dir && clue.label) {
    usedDirs[clue.label] = dir;
  }
  while (clueLabelParse.hasChildren) {
    clueLabelParse = this.parseClueLabel(clueLine, true, true /* isChild */);
    if (!clueLabelParse.dir && clueLabelParse.label &&
        this.layers3d == 1 &&
        usedDirs.hasOwnProperty(clueLabelParse.label)) {
      const usedDir = usedDirs[clueLabelParse.label];
      if (usedDir == 'A') {
        clueLabelParse.dir = 'D';
      } else if (usedDir == 'D') {
        clueLabelParse.dir = 'A';
      }
    }
    if (clueLabelParse.dir &&
        !usedDirs.hasOwnProperty(clueLabelParse.label)) {
      usedDirs[clueLabelParse.label] = clueLabelParse.dir;
    }
    clue.children.push(clueLabelParse);
    clueLine = clueLine.substr(clueLabelParse.skip);
  }

  const enumParse = this.parseEnum(clueLine);
  clue.enumParse = enumParse;
  /**
   * If enumParse does not provide enumLen, we'll set clue.enumLen
   * from cell count later, if possible.
   */
  clue.enumLen = enumParse.enumLen;
  clue.hyphenAfter = enumParse.hyphenAfter;
  clue.wordEndAfter = enumParse.wordEndAfter;
  clue.placeholder = enumParse.placeholder;
  clue.enumStr = enumParse.enumStr;

  clue.clue = clueLine.substr(0, enumParse.afterEnum).trim();
  clue.anno = clueLine.substr(enumParse.afterEnum).trim();

  this.setClueCellsDgmless(clue);

  this.parseInClueAnnos(clue);

  return clue;
}

Exolve.prototype.setClueCellsDgmless = function(clue) {
  if (!clue || !clue.startCell || clue.cells.length > 0 || clue.dir == 'X' ||
      !this.hasDgmlessCells || !this.hasUnsolvedCells) {
    return
  }
  let row = clue.startCell[0]
  let col = clue.startCell[1]
  let gridCell = this.grid[row][col]
  gridCell.startsCluelabel = clue.label
  if (clue.dir == 'A') {
    gridCell.startsAcrossClue = true
    let max = clue.enumLen > 0 ? Math.min(col + clue.enumLen, this.gridWidth) :
        this.gridWidth
    for (let x = col; x < max; x++) {
      gridCell = this.grid[row][x]
      if (gridCell.isLight && !gridCell.isDgmless) {
        gridCell.acrossClueLabel = clue.label
        clue.cells.push([row, x])
        if (gridCell.hasBarAfter) {
          break
        }
      } else {
        break
      }
    }
  } else if (clue.dir == 'D') {
    gridCell.startsDownClue = true
    let max = clue.enumLen > 0 ? Math.min(row + clue.enumLen, this.gridHeight) :
        this.gridHeight
    for (let x = row; x < max; x++) {
      gridCell = this.grid[x][col]
      if (gridCell.isLight && !gridCell.isDgmless) {
        gridCell.downClueLabel = clue.label
        clue.cells.push([x, col])
        if (gridCell.hasBarUnder) {
          break
        }
      } else {
        break
      }
    }
  }
}

// For a sequence of clue indices and cell locations, create a flat
// list of all cell locations (returned as parse.cells) and a list
// of lists of individual segments of length > 1 (returned as
// parse.segments, used to "reveal this" when only a segment is active
// while usingGnav).
Exolve.prototype.parseCellsOfOrphan = function(s) {
  let segments = []
  let cells = []
  let cellsOrClues = s.trim().split(' ')
  let lastCell = null
  for (let cellOrClue of cellsOrClues) {
    if (!cellOrClue) {
      continue
    }
    let cellLocation = this.parseCellLocation(cellOrClue)
    if (!cellLocation) {
      let theClue = this.clueFromLabel(cellOrClue);
      if (!theClue || theClue.cells.length == 0) {
        return null
      }
      if (theClue.cells.length > 1) {
        let clueCells = theClue.cells;
        segments.push(clueCells)
        if (lastCell &&
            lastCell[0] == clueCells[0][0] &&
            lastCell[1] == clueCells[0][1]) {
          // Do not add duplicated cell from sequence
          cells.pop();
        }
        cells = cells.concat(clueCells)
      }
    } else {
      cells.push(cellLocation)
    }
    if (cells.length > 1) {
      lastCell = cells[cells.length - 1];
    }
  }
  return cells.length == 0 ? null : {cells: cells, segments: segments}
}

Exolve.prototype.getAllCells = function(ci) {
  let theClue = this.clues[ci]
  if (!theClue) {
    return [];
  }
  if (theClue.parentClueIndex) {
    return [];
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
      for (let i = chClue.linkedOffset; i < chClue.cells.length; i++) {
        cells.push(chClue.cells[i]);
      }
    }
  }
  // Check if the linking has snaked back to the starting cell.
  const last = cells.length - 1;
  if (last > 0 &&
      cells[0][0] == cells[last][0] &&
      cells[0][1] == cells[last][1]) {
    cells.pop();
    cells.endsOnStart = true;
  }
  return cells;
}

Exolve.prototype.punctuateEntry = function(solution, placeholder) {
  if (!placeholder) return solution;
  let s = ''
  let index = 0;
  for (let i = 0; i < placeholder.length; i++) {
    if (placeholder.charAt(i) == '?') {
      if (index >= solution.length) {
        return solution;
      }
      s = s + solution.charAt(index++);
    } else {
      s = s + placeholder.charAt(i);
    }
  }
  if (index < solution.length) {
    s = s + solution.substr(index);
  }
  return s;
}

Exolve.prototype.getCellsEntry = function(cells, pattern) {
  let entry = '';
  for (const cell of cells) {
    const gridCell = this.grid[cell[0]][cell[1]];
    entry += (gridCell.currLetter == '0' ? '?' :
             this.stateToDisplayChar(gridCell.currLetter));
  }
  return this.punctuateEntry(entry, pattern);
}

Exolve.prototype.getClueEntry = function(ci) {
  const clue = this.clues[ci];
  if (!clue || clue.parentClueIndex) {
    return '';
  }
  const cells = this.getAllCells(ci);
  const pattern = clue.placeholder || '';
  return this.getCellsEntry(cells, pattern);
}

Exolve.prototype.setClueSolution = function(ci) {
  const theClue = this.clues[ci];
  if (!theClue || theClue.solution) {
    return;
  }
  const cells = this.getAllCells(ci);
  if (cells.length == 0) {
    return;
  }
  const solutions = this.getClueSolutionsWithAlts(ci);
  if (!solutions || solutions.length == 0) {
    return;
  }
  const decoratedSolutions = [];
  for (const sg of solutions) {
    let solution = this.punctuateEntry(sg.solution, theClue.placeholder);
    if (sg.dispGroups.length > 0) {
      solution += '<sup>' + sg.dispGroups.join(',') + '</sup>';
    }
    if (theClue.altsGroups) {
      solution =
        `<span class="xlv-clickable" title="${this.textLabels['alts.hover']}"
           onclick="exolvePuzzles['${this.id}'].forceAlts([${
           theClue.altsGroups.join(',')}], ${sg.bits})">${solution}</span>`;
    }
    decoratedSolutions.push(solution);
  }
  theClue.solution = decoratedSolutions.join(', ');
}

Exolve.prototype.parseAnno = function(anno, clueIndex) {
  let theClue = this.clues[clueIndex];
  anno = anno.trim();
  while (anno && anno.substr(0, 1) == '[') {
    let indexOfBrac = anno.indexOf(']');
    if (indexOfBrac <= 0) {
      break;
    }
    let inBrac = anno.substring(1, indexOfBrac).trim();
    let cellsOfOrphan = this.parseCellsOfOrphan(inBrac);
    if (!theClue.cellsOfOrphan &&
        cellsOfOrphan && cellsOfOrphan.cells.length > 0) {
      theClue.cellsOfOrphan = cellsOfOrphan.cells;
      for (let segment of cellsOfOrphan.segments) {
        this.cellsToOrphan[JSON.stringify(segment)] = clueIndex;
        this.szCellsToOrphan++;
      }
      this.hasReveals = true;
    } else if (inBrac && !theClue.solution) {
      theClue.explicitSol = true;
      theClue.solution = inBrac;
      this.hasReveals = true;
    } else if (!inBrac) {
      /**
       * Skip empty [] in anno, used to point at the start of the anno if
       * there are multiple or no enum-like strings within the clue.
       */
    } else {
      break;
    }
    anno = anno.substr(indexOfBrac + 1).trim();
  }
  let numBlanks = 0;
  while (anno && anno.substr(0, 1) == '_') {
    numBlanks++;
    anno = anno.substr(1).trim();
  }
  if (numBlanks > 0) {
    theClue.showBlanks = numBlanks;
    let x = -1;
    if (anno.startsWith('[') && ((x = anno.indexOf(']')) >= 1)) {
      theClue.placeholderForBlank = anno.substring(1, x);
      anno = anno.substr(x + 1).trim();
    }
  }
  if (anno) {
    this.hasReveals = true;
  }
  theClue.anno = anno;
}

// Parse across and down clues from their exolve sections previously
// identified by parseOverall(). Sets lastOrphan, if any.
// Sets cellsToOrphan[] for orphan clues for which revelations are provided.
Exolve.prototype.parseClueLists = function() {
  // Parse across, down, nodir clues
  let prev = null;
  let firstClueIndex = null;
  let lastClueIndex = null;
  const dirs = ['A', 'D', 'Z', 'X'];
  dirs.sort(this.dirCmp.bind(this));
  for (let clueDirection of dirs) {
    let section = '';
    if (clueDirection == 'A') {
      section = this.layers3d > 1 ? '3d-across' : 'across';
    } else if (clueDirection == 'D') {
      section = this.layers3d > 1 ? '3d-away' : 'down';
    } else if (clueDirection == 'Z') {
      section = '3d-down';
    } else {
      section = 'nodir';
    }
    const lines = this.sectionLines[section] || [-1, -1];
    const first = lines[0];
    const last = lines[1];
    if (first < 0 || last < first) {
      continue;
    }
    let filler = '';
    let lastDirClue = null;
    let startNewTable = false;
    let newTableHeading = '';
    for (let l = first; l <= last; l++) {
      let clueLine = this.specLines[l].trim();
      if (clueLine == '') {
        continue;
      }
      if (clueLine.substr(0, 3) == '---') {
        startNewTable = true;
        newTableHeading = clueLine.substr(3).trim();
        continue;
      }
      if (clueLine.substr(0, 5).toLowerCase() == 'hint:') {
        if (!lastDirClue) {
          this.throwErr(
              '[Hint: ...] line without any preceding clue: ' + clueLine);
        }
        lastDirClue.hints.push(clueLine.substr(5).trim());
        continue;
      }
      const clue = this.parseClue(clueDirection, clueLine);
      if (clue.isFiller) {
        filler = filler + clueLine + '\n';
        continue;
      }
      if (!clue.index) {
        this.throwErr('Could not parse clue: ' + clueLine);
      }
      if (this.clues[clue.index] && this.clues[clue.index].clue) {
        this.throwErr('Clue entry already exists for clue: ' + clueLine);
      }
      if (clue.clue.trim() == '*') {
        this.deleteClue(clue.index);
        continue;
      }
      if (!firstClueIndex) {
        firstClueIndex = clue.index;
      }
      lastClueIndex = clue.index;
      lastDirClue = clue;

      let knownInGrid = false;
      if (this.clues[clue.index]) {
        knownInGrid = true;
        let gridClue = this.clues[clue.index];
        if (clue.cells.length > 0) {
          if (gridClue.cells.length > 0) {
            if (!this.sameCells(gridClue.cells, clue.cells)) {
              this.throwErr('Grid, clue diff in cells for ' + clue.index);
            }
          }
        } else {
          // Take the cells from the parsing of the grid.
          clue.cells = gridClue.cells;
        }
        if (clue.dir == 'X' &&
            (gridClue.dir == 'A' || gridClue.dir == 'D' ||
             gridClue.dir == 'Z')) {
          clue.dir = gridClue.dir;
        }
        if (gridClue.reversed) {
          clue.reversed = true;
        }
      }
      this.clues[clue.index] = clue;
      // clue.index may have a different (A/D) dir than clueDirection (X)
      // if maybeRelocateClue() found one,
      if (clueDirection != clue.dir) {
        clue.clueTableDir = clueDirection;
      }

      // Set up cell sequence/memberships in clues not known from the grid and
      // with known cells.
      if (!knownInGrid && clue.cells.length > 0) {
        this.setCellLightMemberships(clue);
      }

      clue.fullDisplayLabel = this.clueLabelDisp(clue);
      clue.displayLabel = !clue.reversed ? clue.label : clue.fullDisplayLabel;
      clue.childrenClueIndices = [];

      this.parseAnno(clue.anno, clue.index);

      if (clue.startCell) {
        const row = clue.startCell[0];
        const col = clue.startCell[1];
        this.grid[row][col].forcedClueLabel = clue.label;
      }
      clue.prev = prev;
      clue.next = null;
      if (prev) {
        this.clues[prev].next = clue.index;
      }
      prev = clue.index;
      if (filler) {
        clue.filler = filler;
        filler = '';
      }
      if (startNewTable) {
        clue.startNewTable = true;
        clue.newTableHeading = newTableHeading;
        startNewTable = false;
        newTableHeading = '';
      }

      if (clue.clue) {
        this.allClueIndices.push(clue.index);
      }
    }
    if (filler) {
      this.throwErr('Filler line should not be at the end: ' + filler);
    }
    if (clue.showBlanks) {
      this.hasPlaceholders = true;
    }
  }
  if (firstClueIndex && lastClueIndex) {
    this.clues[firstClueIndex].prev = lastClueIndex;
    this.clues[lastClueIndex].next = firstClueIndex;
  }
  for (let clueIndex of this.allClueIndices) {
    if (!this.clues[clueIndex].parentClueIndex && this.isOrphan(clueIndex)) {
      this.lastOrphan = clueIndex;
      break;
    }
  }
  if (this.lastOrphan) {
    this.hasPlaceholders = true;
  }
}

Exolve.prototype.deleteClue = function(clueIndex) {
  let dir = clueIndex.substr(0, 1)
  if (dir != 'A' && dir != 'D' && dir != 'Z') {
    this.throwErr('Cannot delete non-A/D/Z clue ' + clueIndex)
  }
  let theClue = this.clues[clueIndex]
  if (theClue.parentClueIndex) {
    this.throwErr('Cannot delete clue ' + clueIndex + ' that has a parent')
  }
  if (theClue.childrenClueIndices && theClue.childrenClueIndices.length > 0) {
    this.throwErr('Cannot delete clue ' + clueIndex + ' with children')
  }
  if (theClue.cells.length == 0) {
    this.throwErr('Cannot delete clue ' + clueIndex + ' with no cells')
  }
  for (let cell of theClue.cells) {
    let gridCell = this.grid[cell[0]][cell[1]]
    if (dir == 'A') {
      delete gridCell.acrossClueLabel
    } else if (dir == 'D') {
      delete gridCell.downClueLabel
    } else if (dir == 'Z') {
      delete gridCell.z3dClueLabel
    }
  }
  delete this.clues[clueIndex]
}

Exolve.prototype.isOrphan = function(clueIndex) {
  let theClue = this.clues[clueIndex]
  return theClue && theClue.cells.length == 0;
}

Exolve.prototype.isOrphanWithReveals = function(clueIndex) {
  return this.isOrphan(clueIndex) && this.clues[clueIndex].cellsOfOrphan
}

Exolve.prototype.allCellsKnown = function(clueIndex) {
  clueIndex = this.clueOrParentIndex(clueIndex);
  let clue = this.clues[clueIndex]
  if (!clue) {
    return false
  }
  if (!clue.enumLen) {
    return false
  }
  const cells = this.getAllCells(clueIndex);
  return cells.length == clue.enumLen
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
    // We need to also deal with the rare snake, where a bunch of linked
    // clues end on the starting cell.
    let lastRowCol = null;
    let firstRowCol = null;
    if (clue.cells.length > 0) {
      firstRowCol = clue.cells[0];
      lastRowCol = clue.cells[clue.cells.length - 1];
      // If we do not know the enum of this clue (likely a diagramless puzzle),
      // do not set successors.
      if (!clue.enumLen || clue.enumLen <= 0) {
        lastRowCol = null
      }
    }
    const firstRowColDir = clue.dir;
    let lastRowColDir = clue.dir
    dupes = {}
    const allDirections = ['A', 'D', 'Z', 'X']
    let linkSep = (clue.linkSep != ',') ? (' ' + clue.linkSep + ' ') : ', ';
    for (let chi = 0; chi < clue.children.length; chi++) {
      const child = clue.children[chi];
      // Direction could be the same as the direction of the parent. Or,
      // if there is no such clue, then direction could be the other direction.
      // The direction could also be explicitly specified with a suffix.
      let childIndex = this.getDirClueIndex(clue.dir, child.label);
      if (!child.isOffNum) {
        if (!this.clues[childIndex]) {
          for (let otherDir of allDirections) {
            if (otherDir == clue.dir) {
              continue;
            }
            const testChildIndex = this.getDirClueIndex(otherDir, child.label);
            if (this.clues[testChildIndex]) {
              childIndex = testChildIndex;
              break
            }
          }
        }
        if (child.dir) {
          childIndex = this.getDirClueIndex(child.dir, child.label);
        } else {
          child.dir = childIndex.charAt(0)
        }
      } else {
        if (!this.offNumClueIndices[child.label] ||
            this.offNumClueIndices[child.label].length < 1) {
          this.throwErr('non-num child label ' + child.label + ' was not seen')
        }
        childIndex = this.offNumClueIndices[child.label][0]
      }
      let childClue = this.clues[childIndex]
      if (!childClue || childIndex == clueIndex) {
        /**
         * Note: Keep the format of this exception exactly like this, as
         * exolve-from-text.js parses this error.
         */
        this.throwErr('Invalid child ' + childIndex + ' in ' + clueIndex);
      }
      if (childClue.hints.length > 0) {
        this.throwErr(
            'Hint(s) should be added under the parent clue, ' +
            'not under a child clue like ' + childIndex);
      }
      if (dupes[childIndex]) {
        this.throwErr('Duplicate child ' + childIndex + ' in ' +
                      clue.label + clue.dir);
      }
      dupes[childIndex] = true
      if (childClue.label) {
        if (!childClue.fullDisplayLabel) {
          childClue.fullDisplayLabel = this.clueLabelDisp(childClue);
        }
        clue.displayLabel = clue.displayLabel + linkSep +
            ((childClue.dir == clue.dir) && !childClue.reversed ?
             childClue.label : childClue.fullDisplayLabel);
        clue.fullDisplayLabel = clue.fullDisplayLabel + linkSep +
                                childClue.fullDisplayLabel;
      }
      linkSep = (child.linkSep != ',') ?  (' ' + child.linkSep + ' ') : ', ';
      clue.childrenClueIndices.push(childIndex)
      childClue.parentClueIndex = clueIndex

      if (lastRowCol && childClue.cells.length > 0) {
        let cell = childClue.cells[0]
        let childDir = childClue.dir
        if (lastRowCol[0] == cell[0] && lastRowCol[1] == cell[1]) {
          if (childDir == lastRowColDir || childClue.cells.length == 1) {
            this.throwErr('loop in successor for ' + lastRowCol)
          }
          childClue.linkedOffset = 1;
          cell = childClue.cells[1]  // Advance to the next cell.
        }
        this.grid[lastRowCol[0]][lastRowCol[1]]['succ' + lastRowColDir] = {
          cell: cell,
          dir: childDir
        };
        this.grid[cell[0]][cell[1]]['pred' + childDir] = {
          cell: lastRowCol,
          dir: lastRowColDir
        };
      }

      lastRowCol = null
      if (childClue.cells.length > 0) {
        lastRowCol = childClue.cells[childClue.cells.length - 1]
      }
      lastRowColDir = childClue.dir
    }
    // Fix snake:
    if (firstRowCol && lastRowCol &&
        firstRowCol[0] == lastRowCol[0] &&
        firstRowCol[1] == lastRowCol[1]) {
      // We do not backspace in a loop, but we do advance in a loop
      // as that seems to be a fun thing to do.
      const succ =
          this.grid[firstRowCol[0]][firstRowCol[1]]['succ' + firstRowColDir];
      if (succ) {
        this.grid[lastRowCol[0]][lastRowCol[1]]['succ' + lastRowColDir] = {
          cell: succ.cell,
          dir: firstRowColDir,
        };
      }
    }
    if (this.hasDgmlessCells) {
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
    for (const childIndex of clue.childrenClueIndices) {
      const childClue = this.clues[childIndex];
      const childLen = childClue.cells.length - childClue.linkedOffset;
      while (wordEndIndex < clue.wordEndAfter.length &&
             clue.wordEndAfter[wordEndIndex] < prevLen + childLen) {
        const pos = clue.wordEndAfter[wordEndIndex] - prevLen +
                    childClue.linkedOffset;
        childClue.wordEndAfter.push(pos);
        wordEndIndex++;
      }
      while (hyphenIndex < clue.hyphenAfter.length &&
             clue.hyphenAfter[hyphenIndex] < prevLen + childLen) {
        const pos = clue.hyphenAfter[hyphenIndex] - prevLen +
                    childClue.linkedOffset;
        childClue.hyphenAfter.push(pos);
        hyphenIndex++;
      }
      prevLen = prevLen + childLen;
    }
  }
}

/**
 * Set solution letters in grid from solutions provided for the clue, if any,
 * in case the clues are the only places where the solutions are provided.
 */
Exolve.prototype.clueSolutionsToGridSolutions = function() {
  if (!this.hasUnsolvedCells) {
    return;
  }
  if (this.multiLetter) {
    /** Give up */
    return;
  }
  let didCopy = false;
  for (const ci of this.allClueIndices) {
    const clue = this.clues[ci];
    if (clue.parentClueIndex) continue;
    if (!clue.solution) continue;
    const cells = this.getAllCells(ci);
    if (cells.length == 0) continue;
    const letters = [];
    for (const c of clue.solution) {
      const sc = this.displayToStateChar(c);
      if (this.isValidStateChar(c)) {
        letters.push(c);
      }
    }
    if (letters.length == 0) continue;
    if (cells.length != letters.length) {
      console.log('Ignoring solution letters from ' + ci + ' as #cells ' +
                  cells.length + ' != #letters ' + letters.length);
      continue;
    }
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const gridCell = this.grid[cell[0]][cell[1]];
      if (gridCell.solution &&
          gridCell.solution != '0' && gridCell.solution != '?') {
        continue;
      }
      gridCell.solution = letters[i];
      didCopy = true;
    }
  }
  if (!didCopy) {
    return;
  }
  this.hasUnsolvedCells = false;
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      const gridCell = this.grid[i][j];
      if (gridCell.isLight && !gridCell.prefill &&
          (!gridCell.solution ||
           gridCell.solution == '0' || gridCell.solution == '?')) {
        this.hasUnsolvedCells = true;
        break;
      }
    }
  }
}

Exolve.prototype.roughlyStartsWith = function(s, prefix) {
  const punct = /[\s'.,-]*/gi
  let normS = s.trim().replace(/<[^>]*>/gi, '').replace(
                  punct, '').trim().toUpperCase();
  let normP = prefix.trim().replace(punct, '').trim().toUpperCase();
  return normS.startsWith(normP);
}

/**
 * Copy clue solutions to annos if warranted.
 * Place a trailing period and space at the end of clue full display labels that
 * end in letter/digit. Wrap in a clickable span if all cells are not known.
 *
 * For American-style crosswords (no enums provided), set enunLen in the
 * clue to be the number of cells.
 *
 * Set allCluesHaveEnums to true if all non-child clues have numeric enums.
 */
Exolve.prototype.finalClueTweaks = function() {
  this.allCluesHaveEnums = true;
  for (const clueIndex of this.allClueIndices) {
    const theClue = this.clues[clueIndex];
    this.setClueSolution(clueIndex);
    if (!theClue.parentClueIndex && !theClue.enumParse.enumLen) {
      this.allCluesHaveEnums = false;
    }
    if (!theClue.enumLen && !this.hasDgmlessCells) {
      const cells = this.getAllCells(clueIndex);
      theClue.enumLen = cells.length;
    }
    theClue.dispSol = '';
    if (this.addSolutionToAnno && theClue.solution &&
        !this.isOrphan(clueIndex) && !theClue.showBlanks &&
        (theClue.explicitSol ||
         !this.roughlyStartsWith(theClue.anno, theClue.solution))) {
      // For clues with placeholder blanks, we reveal in those.
      theClue.dispSol = '<span class="xlv-solution">' + theClue.solution +
                        '. </span>';
    }
    if (theClue.anno || theClue.dispSol ||
        (theClue.solution && theClue.showBlanks)) {
      this.hasReveals = true;
    }
    if (!theClue.fullDisplayLabel) {
      continue;
    }
    let label = theClue.fullDisplayLabel;
    let l = label.length;
    if (l < 1) {
      continue;
    }
    let last = label.charAt(l - 1).toLowerCase();
    if ((last >= 'a' && last <= 'z') || (last >= '0' && last <= '9')) {
      label = label + '. ';
    } else {
      label = label + ' ';
    }
    if (!this.allCellsKnown(clueIndex)) {
      theClue.fullDisplayLabel = `<span class="xlv-clickable"><span
        id="${this.prefix}-curr-clue-label" class="xlv-curr-clue-label"
        title="${this.textLabels['mark-clue.hover']}">${label}</span></span>`;
    } else {
      theClue.fullDisplayLabel = `<span id="${this.prefix}-curr-clue-label"
        class="xlv-curr-clue-label">${label}</span>`;
    }
  }
}

/**
 * Remove def markers ~{...}~ from s
 */
Exolve.prototype.deDefMarkers = function(s) {
  const reDef = new RegExp('(~\\{(.*)\\}~)');
  let match;
  while ((match = s.match(reDef)) && match.length > 2) {
    const idx = s.indexOf(match[0]);
    console.assert(idx >= 0, s, match);
    const cStart = idx + 2;
    const end = s.indexOf('}~', cStart);
    s = s.substr(0, idx) + s.substring(cStart, end) + s.substr(end + 2);
  }
  return s;
}

/**
 * Format the text of the clue.
 *   forExolve: If the enum part has a * after it, then do not show the enum
 *     when forExolve is false.
 *   showEnums: Deprecated and ignored.
 *   showDefs: if true then def markers ~{}~ are kept.
 */
Exolve.prototype.formatClue = function(
    clue, forExolve=true, showEnums=true, showDefs=false) {
  clue = clue.trim();
  if (!showDefs) {
    clue = this.deDefMarkers(clue);
  }
  const enumPart = this.parseEnum(clue);
  if (enumPart.dontShow && !forExolve) {
    return clue.substr(0, enumPart.afterClue).trim();
  }
  return clue.substr(0, enumPart.afterEnum).trim();
}

Exolve.prototype.rcValid = function(r, c) {
  return (r >= 0 && c >= 0 &&
          r < this.gridHeight && c < this.gridWidth);
}

/**
 * Using hyphenAfter[] and wordEndAfter[] in clues as well as from
 * exolve-force-*, set {hyphen,wordEnd}{ToRight,Below} in grid[i][j]s.
 */
Exolve.prototype.setWordEndsAndHyphens = function() {
  for (c of this.forcedSeps['force-hyphen-right']) {
    if (this.rcValid(c[0], c[1])) {
      this.grid[c[0]][c[1]].hyphenToRight = true
    }
  }
  for (c of this.forcedSeps['force-hyphen-below']) {
    if (this.rcValid(c[0], c[1])) {
      this.grid[c[0]][c[1]].hyphenBelow = true
    }
  }
  for (c of this.forcedSeps['force-bar-right']) {
    if (this.rcValid(c[0], c[1])) {
      this.grid[c[0]][c[1]].wordEndToRight = true
    }
  }
  for (c of this.forcedSeps['force-bar-below']) {
    if (this.rcValid(c[0], c[1])) {
      this.grid[c[0]][c[1]].wordEndBelow = true
    }
  }
  if (this.hasDgmlessCells) {
    // Give up on setting from clues.
    return
  }
  for (let ci in this.clues) {
    const clue = this.clues[ci];
    let rev = clue.reversed;
    if (this.layers3d > 1 && clue.dir == 'D') rev = !rev;
    for (let w of clue.wordEndAfter) {
      const w2 = rev ? w + 1 : w;
      if (w2 < 0 || w2 >= clue.cells.length) continue;
      const cell = clue.cells[w2];
      const gridCell = this.grid[cell[0]][cell[1]];
      if (clue.dir == 'A') {
        gridCell.wordEndToRight = true;
      } else if (clue.dir == 'D') {
        gridCell.wordEndBelow = true;
      }
    }
    for (let w of clue.hyphenAfter) {
      const w2 = rev ? w + 1 : w;
      if (w2 < 0 || w2 >= clue.cells.length) continue;
      const cell = clue.cells[w2];
      const gridCell = this.grid[cell[0]][cell[1]];
      if (clue.dir == 'A') {
        gridCell.hyphenToRight = true;
      } else if (clue.dir == 'D') {
        gridCell.hyphenBelow = true;
      }
    }
  }
}

Exolve.prototype.cmpGnavSpans = function(s1, s2) {
  const d1 = s1.dir.charAt(0);
  const d2 = s2.dir.charAt(0);
  if (d1 < d2) {
    return -1
  } else if (d1 > d2) {
    return 1
  }
  if (s1.hasOwnProperty('index') && s2.hasOwnProperty('index')) {
    return s1.index - s2.index;
  }
  const c1 = s1.cells.length > 0 ?
    s1.cells[s1.reversed ? s1.cells.length - 1 : 0] : [s1, s1]
  const c2 = s2.cells.length > 0 ?
    s2.cells[s2.reversed ? s2.cells.length - 1 : 0] : [s2, s2]
  let i1 = c1[0];
  let i2 = c2[0];
  if (this.layers3d > 1) {
    const l1 = Math.floor(i1 / this.h3dLayer);
    const l2 = Math.floor(i2 / this.h3dLayer);
    if (l1 < l2) return -1;
    else if (l1 > l2) return 1;
    // Within a 3-d layer: near before far.
    i1 = 0 - i1;
    i2 = 0 - i2;
  }
  if (i1 < i2) {
    return -1
  } else if (i1 > i2) {
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

Exolve.prototype.getDirClueIndex = function(dir, label) {
  if (!label) return '';
  if (this.offNumClueIndices[label]) {
    for (let index of this.offNumClueIndices[label]) {
      if (index.charAt(0) == dir) return index;
    }
  }
  return dir + label;
}

Exolve.prototype.setUpGnav = function() {
  let gnavSpans = []
  let cluesAlreadySpanned = {}
  // The following loops add spans of diagramless cells, extended on either
  // side with light cells that are connected, to gnav, and also set up
  // advancing typing across/down consecutive cells in such spans.
  // NOTE: this is a bit complex because it has to account for all scenarios
  // involving diagramless cells, non-diagramless cells, bars, and blocks.
  for (let i = 0; i < this.gridHeight; i++) {
    let j = 0;
    while (j < this.gridWidth) {
      if (!this.grid[i][j].isDgmless) {
        j++;
        continue;
      }
      let span = {cells: [], dir: 'A'}
      let revPref = []
      for (let pj = j - 1; pj >= 0; pj--) {
        const pcell = this.grid[i][pj]
        if (!pcell.isLight || pcell.hasBarAfter || pcell.shapedCell) {
          break;
        }
        const prefClue = this.getDirClueIndex('A', pcell.acrossClueLabel);
        if (prefClue && this.clues[prefClue]) {
          span.cells = span.cells.concat(this.clues[prefClue].cells)
          cluesAlreadySpanned[prefClue] = true
          break;
        } else {
          revPref.push([i, pj])
        }
      }
      span.cells = span.cells.concat(revPref.reverse())
      while (j < this.gridWidth) {
        let cell = this.grid[i][j]
        if (!cell.isDgmless && (!cell.isLight || cell.startsAcrossClue)) {
          break;
        }
        if (cell.isDgmless && cell.startsAcrossClue) {
          cluesAlreadySpanned[this.getDirClueIndex(
              'A', cell.acrossClueLabel)] = true;
        }
        span.cells.push([i, j])
        j++;
        if (cell.hasBarAfter || cell.shapedCell) {
          break
        }
      }
      console.assert(span.cells.length > 0, i, j)
      gnavSpans.push(span)
    }
  }
  for (let j = 0; j < this.gridWidth; j++) {
    let i = 0;
    while (i < this.gridHeight) {
      if (!this.grid[i][j].isDgmless) {
        i++;
        continue;
      }
      let span = {cells: [], dir: 'D'}
      let revPref = []
      for (let pi = i - 1; pi >= 0; pi--) {
        const pcell = this.grid[pi][j]
        if (!pcell.isLight || pcell.hasBarUnder || pcell.shapedCell) {
          break;
        }
        const prefClue = this.getDirClueIndex('D', pcell.downClueLabel);
        if (prefClue && this.clues[prefClue]) {
          span.cells = span.cells.concat(this.clues[prefClue].cells)
          cluesAlreadySpanned[prefClue] = true
          break;
        } else {
          revPref.push([pi, j])
        }
      }
      span.cells = span.cells.concat(revPref.reverse())
      while (i < this.gridHeight) {
        let cell = this.grid[i][j]
        if (!cell.isDgmless && (!cell.isLight || cell.startsDownClue)) {
          break;
        }
        if (cell.isDgmless && cell.startsDownClue) {
          cluesAlreadySpanned[this.getDirClueIndex(
              'D', cell.downClueLabel)] = true;
        }
        span.cells.push([i, j])
        i++;
        if (cell.hasBarUnder || cell.shapedCell) {
          break
        }
      }
      console.assert(span.cells.length > 0, i, j)
      gnavSpans.push(span)
    }
  }
  for (let span of gnavSpans) {
    let dir = span.dir
    let prev = null
    for (let cell of span.cells) {
      let gridCell = this.grid[cell[0]][cell[1]]
      gridCell['dgmlessSpan' + dir] = span
      if (prev) {
        this.grid[prev[0]][prev[1]]['succ' + dir] = {cell: cell, dir: dir}
        gridCell['pred' + dir] = {cell: prev, dir: dir}
      }
      prev = cell
    }
  }

  for (const ci in this.clues) {
    const clue = this.clues[ci];
    if (clue.cells.length == 0) {
      continue;
    }
    if (cluesAlreadySpanned[ci]) {
      continue;
    }
    const isNodir = (ci.charAt(0) == 'X');
    const dir = isNodir ? ci : ci.charAt(0);
    const span = {
      cells: clue.cells,
      dir: dir,
    };
    const indexPart = ci.substr(isNodir ? 2 : 1);
    const index = parseInt(indexPart);
    if (!isNaN(index)) {
      span.index = index;
    }
    if (clue.reversed) {
      span.reversed = true;
    }
    gnavSpans.push(span);
  }

  gnavSpans.sort(this.cmpGnavSpans.bind(this));

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
        cell: gnavSpans[next].cells[0],
        dir: gnavSpans[next].dir,
      }
      this.grid[cell[0]][cell[1]]['prev' + gnavSpans[idx].dir] = {
        cell: gnavSpans[prev].cells[0],
        dir: gnavSpans[prev].dir,
      }
    }
  }
}

Exolve.prototype.brightness = function(rgb) {
  const cols = rgb.match(/[0-9\.]+/g);
  if (!cols || cols.length < 3) {
    return 0;
  }
  return (parseInt(cols[0]) + parseInt(cols[1]) + parseInt(cols[2])) / 3;
}

Exolve.prototype.getSurroundingBG = function() {
  const transparent = 'rgba(0, 0, 0, 0)';
  const transparentIE11 = 'transparent';
  let elem = this.frame.parentElement;
  let bg = null;
  while (elem) {
    thisBg = getComputedStyle(elem).backgroundColor;
    if (thisBg === transparent || thisBg === transparentIE11) {
      elem = elem.parentElement;
    } else {
      bg = thisBg;
      break;
    }
  }
  if (!bg) {
    return 'rgb(255,255,255)';
  }
  return bg;
}

Exolve.prototype.pickColorScheme = function() {
  const fgBrightness = this.brightness(getComputedStyle(this.frame).color);
  if (fgBrightness < 155) {
    this.colorScheme = this.lightColorScheme;
  } else {
    this.colorScheme = this.darkColorScheme;
  }
  if (this.smartColoring) {
    const bg = this.getSurroundingBG();
    const bgBrightness = this.brightness(bg);
    if ((fgBrightness < 155 && bgBrightness >= 200) ||
        (fgBrightness >= 155 && bgBrightness < 75)) {
      this.colorScheme['currclue'] = bg;
    }
  }
}

Exolve.prototype.applyStyles = function() {
  let id = `${this.prefix}-added-style`;
  let customStyles = document.getElementById(id);
  if (!customStyles) {
    customStyles = document.createElement('style');
    customStyles.id = id;
    this.frame.appendChild(customStyles);
  }
  customStyles.innerHTML = `
    #${this.prefix}-frame .xlv-curr-clue {
      top: ${this.visTop > 0 ? (this.visTop + 'px') : 0};
    }
    #${this.prefix}-frame span.xlv-solved,
    #${this.prefix}-frame .xlv-solved td:first-child {
      color: ${this.colorScheme['solved']};
    }
    #${this.prefix}-frame .xlv-definition {
      text-decoration-color: ${this.colorScheme['def-underline']};
    }
    #${this.prefix}-frame .xlv-solution {
      color: ${this.colorScheme['solution']};
    }
    #${this.prefix}-status {
      color: ${this.colorScheme['imp-text']};
    }
    #${this.prefix}-frame .xlv-button {
      background: ${this.colorScheme['button']};
      color: ${this.colorScheme['button-text']};
    }
    #${this.prefix}-frame .xlv-button:hover {
      background: ${this.colorScheme['button-hover']};
    }
    #${this.prefix}-frame .xlv-button:disabled {
      background: gray;
    }
    #${this.prefix}-frame .xlv-small-button {
      background: ${this.colorScheme['small-button']};
      color: ${this.colorScheme['small-button-text']};
    }
    #${this.prefix}-frame .xlv-small-button:hover {
      background: ${this.colorScheme['small-button-hover']};
    }
    @keyframes ${this.prefix}-overwritten-anim {
      0% {fill: ${this.colorScheme['overwritten-start']}}
      90% {fill: ${this.colorScheme['overwritten-end']}}
      95% {fill: ${this.colorScheme['overwritten-start']}}
      99% {fill: ${this.colorScheme['overwritten-end']}}
    }
    #${this.prefix}-frame .xlv-overwritten {
      animation-duration: ${this.hltOverwrittenMillis}ms;
      animation-name: ${this.prefix}-overwritten-anim;
    }
  `;
}

Exolve.prototype.stripLineBreaks = function(s) {
  s = s.replace(/<br\s*\/?>/gi, " / ")
  return s.replace(/<\/br\s*>/gi, "")
}

Exolve.prototype.renderClueSpan = function(clue, elt, inCurrClue=false) {
  let clueText = clue.clue.trim();
  if (clueText.endsWith('*')) {
    /** reparse for enum, as exet modifies clue before calling this */
    const enumParse = this.parseEnum(clueText);
    if (enumParse.dontShow) {
      clueText = clueText.substr(0, enumParse.afterClue).trim();
    }
  }
  if (inCurrClue) {
    clueText = this.stripLineBreaks(clueText);
  }
  let html = '';
  let idx = clueText.indexOf('~{');
  let endIdx = 0;
  while (idx >= 0) {
    html += clueText.substring(endIdx, idx);
    endIdx = clueText.indexOf('}~', idx + 2);
    if (endIdx < 0) {
      endIdx = idx;
      break;
    }
    let skip = 2;
    if (clueText.charAt(idx + skip) == '{') {
      const close = clueText.indexOf('}', idx + skip + 1);
      if (close >= idx + skip + 1) {
        skip = close + 1 - idx;
      }
    }
    html += '<span class="xlv-in-clue-anno">' +
            clueText.substring(idx + skip, endIdx) + '</span>';
    endIdx += 2;
    idx = clueText.indexOf('~{', endIdx);
  }
  html += clueText.substr(endIdx);
  elt.innerHTML = html;
  if (inCurrClue) {
    return;
  }
  clue.inClueAnnoReveals = {};
  if (clue.inClueAnnos.length == 0) {
    return;
  }
  const inClueAnnoSpans = elt.getElementsByClassName('xlv-in-clue-anno');
  console.assert(inClueAnnoSpans.length ==
                 clue.inClueAnnos.length, inClueAnnoSpans, clue);
  for (let s = 0; s < inClueAnnoSpans.length; s++) {
    const c = clue.inClueAnnos[s];
    if (!clue.inClueAnnoReveals[c]) {
      clue.inClueAnnoReveals[c] = [];
    }
    clue.inClueAnnoReveals[c].push(inClueAnnoSpans[s]);
    if (!this.inClueAnnoReveals[c]) {
      this.inClueAnnoReveals[c] = [];
    }
    this.inClueAnnoReveals[c].push(inClueAnnoSpans[s]);
  }
}

/**
 * A class for rendering hints in the current clue and in questions.
 */
function ExolveHints(xlv, container, hints, hintsShown=0, resize=false) {
  this.xlv = xlv;
  this.container = container;
  console.assert(this.container.id, this.container);
  this.bulbId = this.container.id + '-hint-bulb';
  this.hints = hints;
  this.hintsShown = hintsShown;
  this.resize = resize;

  if (this.hints.length == 0) return;

  let html = '';
  for (let i = 0; i < this.hints.length; i++) {
    html += this.renderHint(i, i < this.hintsShown);
  }
  html += ` <span id="${this.bulbId}" class="xlv-hint-bulb"`;
  if (this.hints.length > 1 && this.hintsShown > 0) {
    html += ` title="${this.xlv.textLabels['hint-bulb-another.hover']}"`;
  } else {
    html += ` title="${this.xlv.textLabels['hint-bulb.hover']}"`;
  }
  if (this.hintsShown == this.hints.length) {
    html += ' style="display:none"';
  }
  html += `>${this.xlv.textLabels['hint-bulb']}</span>`;
  this.container.insertAdjacentHTML('beforeend', html);
  const bulb = document.getElementById(this.bulbId);
  bulb.style.color = this.xlv.colorScheme['hint-bulb'];
  bulb.addEventListener('click', this.handleHintBulbClick.bind(this));
  const hider = this.handleHideHints.bind(this);
  const hintSpans = this.container.getElementsByClassName('xlv-hint');
  for (let i = 0; i < hintSpans.length; i++) {
    hintSpans[i].addEventListener('click', hider);
  }
}

ExolveHints.prototype.renderHint = function(index, shown) {
  let html = '<span class="xlv-hint" ';
  let style = `color:${this.xlv.colorScheme['hint']}`;
  if (!shown) {
    style += ';display:none';
  }
  html += ` title="${this.xlv.textLabels['hint.hover']}" style="${style}">`;
  html += ' <span class="xlv-hint-prefix">';
  html += this.xlv.textLabels['hint'];
  if (this.hints.length > 1) {
    html += ` ${index + 1}/${this.hints.length}`;
  }
  html += ':</span> ';
  html += this.xlv.stripLineBreaks(this.hints[index]);
  html += '</span>';
  return html;
}

ExolveHints.prototype.updateHints = function() {
  const hints = this.container.getElementsByClassName('xlv-hint');
  if (hints.length == 0) return;
  console.assert(hints.length == this.hints.length,
                 hints.legnth, this.hints.length);
  for (let i = 0; i < this.hintsShown; i++) {
    hints[i].style.display = '';
  }
  for (let i = this.hintsShown; i < hints.length; i++) {
    hints[i].style.display = 'none';
  }
  const bulb = document.getElementById(this.bulbId);
  bulb.style.display = (this.hintsShown < hints.length) ? '' : 'none';
  if (this.hints.length > 1 && this.hintsShown > 0) {
    bulb.title = this.xlv.textLabels['hint-bulb-another.hover'];
  } else {
    bulb.title = this.xlv.textLabels['hint-bulb.hover'];
  }
}

ExolveHints.prototype.handleHideHints = function() {
  if (this.hints.length == 0 || this.hintsShown == 0) return;
  this.hintsShown = 0;
  this.updateHints();
  if (this.resize) this.xlv.resizeCurrClueAndControls();
}

ExolveHints.prototype.handleHintBulbClick = function() {
  if (this.hints.length == this.hintsShown) return;
  this.hintsShown++;
  this.updateHints();
  if (this.resize) this.xlv.resizeCurrClueAndControls();
}

Exolve.prototype.displayClues = function() {
  // Populate clues tables. Check that we have all clues
  let table = null;
  let dir = '';
  let extraPanels = [];
  let revSuff = '';
  for (let clueIndex of this.allClueIndices) {
    let theClue = this.clues[clueIndex];
    if (!theClue.clue && !theClue.parentClueIndex) {
      this.throwErr('Found no clue text nor a parent clue for ' + clueIndex);
    }
    let clueDir = theClue.clueTableDir || theClue.dir;
    if (dir != clueDir) {
      if (clueDir == 'A') {
        table = this.acrossClues;
        this.hasAcrossClues = true;
        revSuff = (this.layers3d > 1) ? this.textLabels['3d-ba'] :
            this.textLabels['back-letter'];
      } else if (clueDir == 'D') {
        table = this.downClues;
        this.hasDownClues = true;
        revSuff = (this.layers3d > 1) ? this.textLabels['3d-to'] :
            this.textLabels['up-letter'];
      } else if (clueDir == 'Z') {
        table = this.z3dClues;
        this.hasZ3dClues = true;
        revSuff = this.textLabels['3d-up'];
      } else if (clueDir == 'X') {
        table = this.nodirClues;
        this.hasNodirClues = true;
        revSuff = '';
      } else {
        this.throwErr('Unexpected clue direction ' + clueDir + ' in ' +
                      clueIndex);
      }
      dir = clueDir;
    }
    if (theClue.startNewTable) {
      const newPanel = document.createElement('div');
      newPanel.setAttributeNS(null, 'class',
                              'xlv-clues-box xlv-clues-extra-panel');
      const newTable = document.createElement('table');
      newTable.className = 'xlv-clues-table';
      newPanel.appendChild(newTable);
      extraPanels.push(newPanel);

      const newPanelInDiv = document.createElement('div');
      newPanelInDiv.setAttributeNS(null, 'class', 'xlv-clues-panel');
      newPanelInDiv.insertAdjacentHTML(
        'afterbegin',
        `<div class="xlv-clues-box xlv-clues-label">
          <hr>
          ${theClue.newTableHeading}
        </div>`);
      newPanelInDiv.appendChild(newPanel);

      let tableGrandParent = table.parentElement.parentElement;
      tableGrandParent.parentElement.insertBefore(
          newPanelInDiv, tableGrandParent.nextSibling);
      table = newTable;
    }
    if (theClue.filler) {
      const tr = document.createElement('tr');
      const col = document.createElement('td');
      const colspan = 2 + (this.extractionSlots ? 1 : 0);
      col.setAttributeNS(null, 'colspan', '' + colspan);
      col.setAttributeNS(null, 'class', 'xlv-filler');
      col.innerHTML = theClue.filler;
      tr.appendChild(col);
      table.appendChild(tr);
    }
    const tr = document.createElement('tr');

    if (this.extractionSlots > 0) {
      const extrCol = document.createElement('td');
      extrCol.classList.add('xlv-clue-extraction');
      const extr = document.createElement('input');
      extr.classList.add('xlv-clue-extraction-slot');
      const slotsStr = '' + this.extractionSlots;
      extr.setAttributeNS(null, 'size', slotsStr);
      extr.setAttributeNS(null, 'type', 'text');
      extr.style.color = this.colorScheme['imp-text']
      extr.style.maxWidth = '' + (this.extractionSlots + 1) + 'ch';
      extr.setAttributeNS(null, 'maxlength', slotsStr);
      extr.setAttributeNS(null, 'autocomplete', 'off');
      extr.setAttributeNS(null, 'spellcheck', 'false');
      extr.addEventListener('click', this.boundListeners['clue-input-click']);
      extr.addEventListener('input', this.boundListeners['update']);
      extrCol.appendChild(extr);
      this.answersList.push({
        input: extr,
        isq: false,
      });
      tr.appendChild(extrCol);
    }
    const labelCol = document.createElement('td');
    labelCol.innerHTML = theClue.displayLabel;
    labelCol.classList.add('xlv-clue-label');

    let labelColChars = theClue.displayLabel.replace(/&[^;]*;/g, '#');
    let labelColNumChars = [...labelColChars].length;
    let indenterHTML = '';
    const linkSep = labelColChars.substr(1, 2);
    if (linkSep == ', ' || linkSep == ' &' ||
        (revSuff && labelColChars.substr(1, revSuff.length) == revSuff)) {
      // Linked clue that begins with a single-letter/digit clue number.
      // Or, reversed single-letter/digit clue.
      // Indent!
      labelCol.style.textIndent =
        this.caseCheck(labelColChars.substr(0, 1)) ? '0.55ch' : '1ch';
      indenterHTML = '0';
      labelColNumChars++;
    }
    if (!this.allCellsKnown(clueIndex)) {
      labelCol.classList.add('xlv-clickable');
      labelCol.setAttributeNS(null, 'title', this.textLabels['mark-clue.hover']);
      labelCol.addEventListener('click',
                            this.clueStateToggler.bind(this, clueIndex));
    }
    const clueCol = document.createElement('td');
    if (labelColNumChars > 2) {
      // More than two unicode chars in labelCol. Need to indent clueCol.
      indenterHTML += theClue.displayLabel;
      const indenter = document.createElement('span');
      indenter.className = 'xlv-invisible';
      indenter.innerHTML = indenterHTML;
      clueCol.appendChild(indenter);
      clueCol.classList.add('xlv-clue-indent');
    }
    const clueSpan = document.createElement('span');
    this.renderClueSpan(theClue, clueSpan);
    clueCol.appendChild(clueSpan);
    theClue.clueSpan = clueSpan;

    if ((theClue.showBlanks || this.isOrphan(clueIndex)) &&
        !theClue.parentClueIndex) {
      let placeholder = '';
      let len = this.PLACEHOLDER_BLANK_LEN;
      if (theClue.placeholder) {
        placeholder = theClue.placeholder.replace(/\?/g, '·');
        len = placeholder.length;
      }
      if (theClue.showBlanks && theClue.showBlanks > 1) {
        len = theClue.showBlanks;
      }
      if (theClue.placeholderForBlank) {
        placeholder = theClue.placeholderForBlank;
      }
      theClue.placeholderBlank =
          this.addPlaceholderBlank(clueCol, false, len, placeholder, clueIndex);
      this.answersList.push({
        input: theClue.placeholderBlank,
        isq: false,
      });
    }
    const annoSpan = document.createElement('span');
    annoSpan.setAttributeNS(null, 'class', 'xlv-anno-text');
    annoSpan.style.color = this.colorScheme['anno'];
    annoSpan.style.display = 'none';
    if (theClue.anno || theClue.dispSol) {
      annoSpan.innerHTML = ' ' + theClue.dispSol +
                           '<span>' + theClue.anno + '</span>';
      this.revelationList.push(annoSpan);
    }
    clueCol.appendChild(annoSpan);
    theClue.annoSpan = annoSpan;
    tr.appendChild(labelCol);
    tr.appendChild(clueCol);
    tr.addEventListener('click', this.clueActivator.bind(this, clueIndex));
    theClue.clueTR = tr;
    table.appendChild(tr);
  }
  if (this.cluesPanelLines > 0) {
    const ems = 1.40 * this.cluesPanelLines;
    const emsStyle = '' + ems + 'em';
    this.acrossPanel.style.maxHeight = emsStyle;
    this.downPanel.style.maxHeight = emsStyle;
    this.nodirPanel.style.maxHeight = emsStyle;
    for (let p of extraPanels) {
      p.style.maxHeight = emsStyle;
    }
  }
  if (this.hasAcrossClues) {
    this.acrossPanel.parentElement.style.display = '';
  }
  if (this.hasDownClues) {
    this.downPanel.parentElement.style.display = '';
  }
  if (this.hasZ3dClues) {
    this.z3dPanel.parentElement.style.display = '';
  }
  if (this.hasNodirClues) {
    this.nodirPanel.parentElement.style.display = '';
    if (!this.nodirHeading) {
      this.nodirHeading = this.textLabels['nodir-label'];
    }
    document.getElementById(this.prefix + '-nodir-label').
      insertAdjacentHTML('beforeend', this.nodirHeading);
  }
}

Exolve.prototype.equalizeClueWidths = function(w) {
  // Make all xlv-clues-box divs have the same width w.
  if (w > 0) {
    const cbs = this.frame.getElementsByClassName('xlv-clues-box')
    for (let x = 0; x < cbs.length; x++) {
      cbs[x].style.width = w + 'px'
    }
  }
}

Exolve.prototype.computeGridSize = function() {
  let viewportDim = Math.min(this.getViewportWidth(), this.getViewportHeight());
  if (this.maxDim > 0 && this.maxDim < viewportDim) {
    viewportDim = this.maxDim;
  }

  this.squareDim = 31;
  if (this.gridWidth <= 30 &&  // For jumbo grids, give up.
      (this.squareDim + this.GRIDLINE) * this.gridWidth + this.GRIDLINE >
      viewportDim - 8) {
    this.squareDim = Math.max(12,
      Math.floor((viewportDim - 8 - this.GRIDLINE) /
                 this.gridWidth) - this.GRIDLINE);
  }
  if (this.cellW <= 0 || this.cellH <= 0) {
    this.cellW = this.squareDim;
    this.cellH = (this.layers3d > 1) ?
      Math.ceil(this.squareDim * this.ratio3d) : this.squareDim;
  }
  this.squareDim = Math.min(this.cellW, this.cellH);
  this.cellWBy2 = Math.floor((this.cellW + 1) / 2);
  this.cellHBy2 = Math.floor((this.cellH + 1) / 2);
  this.squareDimBy2 = Math.min(this.cellWBy2, this.cellHBy2);
  if (this.tilingW <= 0) {
    this.tilingW = this.cellW + this.GRIDLINE;
  }
  if (this.tilingH <= 0) {
    this.tilingH = this.cellH + this.GRIDLINE;
  }

  this.numberStartY = Math.min(10, Math.floor(this.cellH / 3));
  this.lightStartX = 1.0 + this.cellW / 2.0;
  this.lightStartY = 1.925 + Math.floor((2 * this.cellH) / 3);

  this.hyphenW = Math.max(7, Math.floor(this.squareDim / 3) - 1);
  this.hyphenWBy2 = Math.floor((this.hyphenW + 1) / 2);

  this.circleR = 0.0 + this.squareDim / 2.0;
  if (this.layers3d > 1) {
    this.h3dLayer = this.gridHeight / this.layers3d;
    // Extra horizontal space for 3-d
    this.offset3d = (this.cellH + this.GRIDLINE) /
                    Math.tan(this.angle3d * Math.PI / 180);
  }
  if (this.boxW <= 0) {
    this.boxW = (this.tilingW * (this.gridWidth - 1)) +
                this.GRIDLINE + this.cellW + this.GRIDLINE;
    if (this.layers3d > 1) {
      this.boxW += (this.offset3d * this.h3dLayer) + this.GRIDLINE;
    }
  }
  if (this.boxH <= 0) {
    this.boxH = (this.tilingH * (this.gridHeight - 1)) +
                this.GRIDLINE + this.cellH + this.GRIDLINE;
  }
  this.letterSize = Math.max(8, this.squareDimBy2);
  this.numberSize = 1 + Math.max(5, Math.floor(this.squareDim / 3) - 1);
  this.arrowSize = Math.max(6, Math.floor(13 * this.squareDim / 31));
  this.maxCurrClueWidth = Math.max(this.boxW + (2 * this.offsetLeft),
                                   Math.min(viewportDim - 30, 450));
}

Exolve.prototype.setColumnLayout = function(cluesBoxWidth=0) {
  const vpWidth = this.getViewportWidth();
  const gpBox = this.gridPanel.getBoundingClientRect();
  const gpWidth = gpBox.width || 481;
  if (cluesBoxWidth > 0) {
    this.cluesBoxWidth = cluesBoxWidth;
  } else {
    const frameBox = this.frame.getBoundingClientRect();
    const xStart = Math.max(frameBox.left, 0);
    const xEnd = frameBox.right > 0 ? Math.min(frameBox.right, vpWidth) : vpWidth;
    const portWidth = xEnd - xStart;
    /**
     * 12 = rt margin of grid panel, 8 = rt margin of clues panel; subtract 20.
     */
    const availWidth = portWidth - gpWidth - 20;
    if (availWidth < 400) {
      /* Clues in a single column, under grid */
      this.cluesBoxWidth = gpWidth;
    } else if (availWidth < 984) {
      /* Clues in two columns to the right of the grid */
      this.cluesBoxWidth = Math.floor(availWidth / 2) - 12;
    } else {
      this.cluesBoxWidth = 480;
    }
  }
  console.assert(this.cluesBoxWidth > 0, this.cluesBoxWidth);
  this.equalizeClueWidths(this.cluesBoxWidth);
  this.cluesContainer.style.maxWidth = (2 * (this.cluesBoxWidth + 12)) + 'px';
  this.cluesContainer.className = 'xlv-clues xlv-clues-flex'
  this.gridcluesContainer.className = 'xlv-grid-and-clues-flex'
}

Exolve.prototype.handleResize = function() {
  this.resizeCurrClueAndControls();
  this.setColumnLayout();
}

Exolve.prototype.makeRect = function(x, y, w, h, colour) {
  const rect =
      document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttributeNS(null, 'x', x);
  rect.setAttributeNS(null, 'y', y);
  rect.setAttributeNS(null, 'width', w);
  rect.setAttributeNS(null, 'height', h);
  rect.style.fill = colour;
  return rect;
}

Exolve.prototype.makeCellSVG = function(x, y, svgHTML, colour='') {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  try {
    g.innerHTML = svgHTML;
  } catch (err) {
    this.throwErr('Invalid cell-decorator in: ' + svgHTML + ' error: ' + err);
  }
  g.setAttributeNS(null, 'transform', `translate(${x} ${y})`);
  if (colour) {
    g.style.fill = colour;
  }
  return g;
}

Exolve.prototype.displayGridBackground = function() {
  const svgWidth = this.boxW + (2 * this.offsetLeft)
  const svgHeight = this.boxH + (2 * this.offsetTop)
  this.svg.setAttributeNS(null, 'viewBox', '0 0 ' + svgWidth + ' ' + svgHeight)
  this.svg.setAttributeNS(null, 'width', svgWidth);
  this.svg.setAttributeNS(null, 'height', svgHeight);

  if (this.layers3d > 1) {
    this.background = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  } else {
    this.background = this.makeRect(this.offsetLeft, this.offsetTop,
        this.boxW, this.boxH, this.colorScheme['background']);
  }
  this.svg.appendChild(this.background);
}

Exolve.prototype.fireCompletionEvent = function() {
  if (this.numCellsToFill != this.numCellsFilled ||
      !this.frame) {
    return;
  }
  const event = new CustomEvent('exolve', {
    bubbles: true,
    detail: {
      'id': this.id,
      'title': this.title,
      'setter': this.setter,
      'toFill': this.numCellsToFill,
      'filled': this.numCellsFilled,
      'knownCorrect': this.knownCorrect,
      'knownIncorrect': this.knownIncorrect,
    }});
  this.frame.dispatchEvent(event);
}

/**
 * Return a string encoding the current entries in the whole grid and
 * also set the number of squares that have been filled.
 * Unless notifyIfComplete is false, fire a completion event if the
 * puzzle has just been completed.
 */
Exolve.prototype.getGridStateAndNumFilled = function(notifyIfComplete=true) {
  let state = '';
  let numFilled = 0;
  let numCorrect = 0;
  this.updateAltsActive();
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      let gridCell = this.grid[i][j];
      if (gridCell.isLight || gridCell.isDgmless) {
        let stateLetter = gridCell.currLetter;
        if (stateLetter == '?') {
          stateLetter = '0';
        }
        if (!this.multiLetter) {
          state = state + stateLetter;
        } else {
          state = state + stateLetter + '$';
        }
        if (stateLetter != '0') {
          numFilled++;
          if (this.getSolutionActive([i,j]) == stateLetter) {
            numCorrect++;
          }
        }
      } else {
        state = state + '.';
      }
    }
  }
  const knownCorrect = !this.hasUnsolvedCells &&
                       (this.numCellsToFill == numCorrect);
  const knownIncorrect = !this.hasUnsolvedCells &&
                         (this.numCellsToFill > numCorrect);
  const justFinished = (numFilled == this.numCellsToFill) &&
      ((this.numCellsFilled < numFilled) ||
       (this.knownCorrect != knownCorrect) ||
       (this.knownIncorrect != knownIncorrect));
  this.numCellsFilled = numFilled;
  this.knownCorrect = knownCorrect;
  this.knownIncorrect = knownIncorrect;
  if (justFinished && notifyIfComplete) {
    // Dispatch the event asynchronously, after the display has been updated.
    setTimeout(this.fireCompletionEvent.bind(this), 0);
  }
  return state;
}

/** Update status, ensure answer fields are upper-case (when they have
 * an enum), disable buttons as needed, and return the state.
 */
Exolve.prototype.updateDisplayAndGetState = function(notifyIfComplete=true) {
  let state = this.getGridStateAndNumFilled(notifyIfComplete);
  this.statusNumFilled.innerHTML = this.numCellsFilled
  let ci = this.clueOrParentIndex(this.currClueIndex)
  let revOrphan = this.isOrphanWithReveals(ci)
  this.checkButton.disabled = (this.activeCells.length == 0) && !revOrphan
  this.checkcellButton.disabled = this.checkButton.disabled
  let theClue = this.clues[ci]
  let haveReveals = (this.activeCells.length > 0 && !this.hasUnsolvedCells) ||
      (theClue && (theClue.anno || theClue.solution ||
                   revOrphan || theClue.inClueAnnos.length > 0));
  if (!haveReveals && this.szCellsToOrphan > 0 && this.activeCells.length > 0) {
    let orphanClue = this.cellsToOrphan[JSON.stringify(this.activeCells)];
    if (orphanClue) {
      let oc = this.clues[orphanClue]
      haveReveals =
        oc && (oc.anno || oc.solution || this.isOrphanWithReveals(orphanClue));
    }
  }
  this.revealButton.disabled = !haveReveals;
  this.revealcellButton.disabled = this.revealButton.disabled
  this.clearButton.disabled = this.revealButton.disabled &&
                              this.activeCells.length == 0;
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

/**
 * Call updateDisplayAndGetState() and save state in local storage.
 */
Exolve.prototype.updateAndSaveState = function(notifyIfComplete=true) {
  let state = this.updateDisplayAndGetState(notifyIfComplete)
  for (let a of this.answersList) {
    state = state + this.STATE_SEP + a.input.value
  }

  if (this.notTemp) {
    try {
      const lsVal = JSON.stringify({
        timestamp: Date.now(),
        state: state,
        notes: this.notes,
      });
      window.localStorage.setItem(this.stateKey(), lsVal);
    } catch (err) {
      if (!this.warnedAboutLocalStorage) {
        alert('Could not save state in local storage! Click on ' +
              'Tools > Manage local storage to delete state from ' +
              'old crosswords, perhaps.');
        this.warnedAboutLocalStorage = true;
      }
    }
  }

  if (this.savingURL) {
    // Also provide a URL that saves the state in location.hash.
    const url = new URL(location.href);
    url.hash = '#' + this.STATES_SEP + this.id + state;
    this.savingURL.href = url.href;
  }
}

Exolve.prototype.resetState = function() {
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      const gridCell = this.grid[i][j];
      if (gridCell.isLight || gridCell.isDgmless) {
        if (gridCell.prefill) {
          gridCell.currLetter = gridCell.solution;
        } else {
          gridCell.currLetter = '0';
        }
        gridCell.textNode.nodeValue =
            this.stateToDisplayChar(gridCell.currLetter);
      }
    }
  }
  this.adjustRebusFonts();
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
      if (this.multiLetter && letter != '.') {
        let dollar = state.indexOf('$', index)
        if (dollar < 0) {
          this.log('Missing compound-char separator in saved state')
          return false
        }
        letter = letter + state.substring(index, dollar)
        index = dollar + 1
      }
      let gridCell = this.grid[i][j]
      if (gridCell.isLight || gridCell.isDgmless) {
        if (gridCell.prefill) {
          parsedState.push(gridCell.solution)
          continue
        }
        if (letter == '1') {
           if (!gridCell.isDgmless) {
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
      if (gridCell.isLight || gridCell.isDgmless) {
        console.assert(parsedState.length > 0, parsedState)
        gridCell.currLetter = parsedState.shift();
        gridCell.textNode.nodeValue = this.stateToDisplayChar(gridCell.currLetter);
      }
    }
  }
  this.adjustRebusFonts();
  console.assert(parsedState.length == 0, parsedState)

  // Also try to recover answers to questions and orphan-fills.
  if (state.substr(index, this.STATE_SEP.length) == this.STATE_SEP) {
    let parts = state.substr(index + this.STATE_SEP.length).split(
        this.STATE_SEP)
    if (parts.length == this.answersList.length) {
      for (let i = 0; i < parts.length; i++) {
        this.answersList[i].input.value = parts[i]
      }
    }
  }
  return true
}

Exolve.prototype.stateKey = function() {
  return 'xlvstate:' + this.id;
}

// Restore state from local storage or cookie (or location.hash).
Exolve.prototype.restoreState = function() {
  this.resetState();
  let foundState = false

  let lsVal = window.localStorage.getItem(this.stateKey());
  if (lsVal) {
    try {
      let decoded = JSON.parse(lsVal)
      foundState = this.parseState(decoded.state);
      if (foundState) {
        this.log("Found saved state in browser's local storage")
      }
      if (decoded.notes) {
        this.notes = decoded.notes;
        this.refreshNotesPanel();
      }
    } catch (err) {
      foundState = false;
    }
  }
  if (!foundState) {
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
  }
  try {
    let lh = decodeURIComponent(location.hash.substr(1))
    let myPart = this.myStatePart(lh)
    if (myPart[0] >= 0) {
      if (!foundState || this.maybeConfirm(
              this.textLabels['confirm-state-override'])) {
        foundState = this.parseState(lh.substring(
            myPart[0] + this.STATES_SEP.length + this.id.length, myPart[1]))
        if (foundState) {
          this.log('Found saved state in url')
        }
      }
      // Strip out the parsed state from the location hash
      lh = lh.substr(0, myPart[0]) + lh.substr(myPart[1])
      location.hash = lh
    }
  } catch (e) {
  }
  for (const ci of this.allClueIndices) {
    // When restoring state, we reveal annos for fully prefilled entries.
    this.updateClueState(ci, true, null, false /* dont note a fresh solve */);
  }
  this.updateAndSaveState(false);  // notifyIfComplete=false
}

Exolve.prototype.addWebifi = function() {
  if (this.webifi || !this.useWebifi) {
    return;
  }
  if ((typeof Webifi) == 'undefined' ||
      (typeof WordsWebifi) == 'undefined' ||
      (typeof CrosswordWebifi) == 'undefined') {
    return;
  }
  console.log('Adding Webifi');
  this.webifi = new Webifi(this.scriptUrlBase);
  this.wordsWebifi = new WordsWebifi(this.webifi);
  this.crosswordWebifi = new CrosswordWebifi(this.webifi, this);

  if (!this.webifi.urlForced) {
    this.webifiButton.style.display = '';
    this.webifiButton.addEventListener('click',
        this.webifi.toggle.bind(this.webifi));
  }
  this.webifi.start(this.frame);
}

/**
 * If the puzzle has the useWebifi option set (or there is a URL param for
 * webifi), and the serving site has provided webifi scripts, then we load
 * them async and add a Webifi button.
 */
Exolve.prototype.loadWebifi = function() {
  if (this.webifi) {
    return;
  }
  if (!this.useWebifi) {
    // Check for webifi URL param.
    const urlParams = new URLSearchParams(window.location.search);
    this.useWebifi = urlParams.has('webifi');
  }
  if (!this.useWebifi) {
    return;
  }
  const handler = this.addWebifi.bind(this);
  const notFound = [];
  if ((typeof Webifi) == 'undefined') {
    notFound.push("webifi.js");
  }
  if ((typeof WordsWebifi) == 'undefined') {
    notFound.push("words-webifi.js");
  }
  if ((typeof CrosswordWebifi) == 'undefined') {
    notFound.push("crossword-webifi.js");
  }
  for (let needed of notFound) {
    const script = document.createElement('script');
    script.src = this.scriptUrlBase + needed;
    script.onload = handler;
    document.head.append(script);
  }
  if (notFound.length == 0) {
    this.addWebifi();
  }
}


Exolve.prototype.deactivateCurrCell = function() {
  this.gridInputWrapper.style.display = 'none';
  for (const x of this.activeCells) {
    const gridCell = this.grid[x[0]][x[1]];
    const cellRect = gridCell.cellRect;
    cellRect.style.fill = this.colorScheme['cell'];
    if (!gridCell.prefill) {
      gridCell.cellText.style.fill = this.colorScheme['light-text'];
    }
    if (gridCell.cellNum) {
      gridCell.cellNum.style.fill = this.colorScheme['light-label'];
    }
    if (gridCell.cellCircle) {
      gridCell.cellCircle.style.stroke = this.colorScheme['circle'];
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
  return this.offsetLeft + offset + (col * this.tilingW);
}
Exolve.prototype.cellTopPos = function(row, offset) {
  return this.offsetTop + offset + (row * this.tilingH);
}
Exolve.prototype.clueOrParentIndex = function(ci) {
  if (ci && this.clues[ci] && this.clues[ci].parentClueIndex) {
    return this.clues[ci].parentClueIndex
  }
  return ci
}
Exolve.prototype.currParentClue = function() {
  let ci = this.currClueIndex;
  if (!ci) return null;
  ci = this.clueOrParentIndex(ci);
  return this.clues[ci];
}
Exolve.prototype.maybeConfirm = function(msg) {
  if (!msg) return true;
  return confirm(msg);
}
// ------------------------

Exolve.prototype.deactivateCurrClue = function() {
  for (let x of this.activeClues) {
    x.style.background = 'inherit';
  }
  this.activeClues = [];
  this.currClueIndex = null;
  this.currClue.style.display = 'none';
  this.clearButton.disabled = true;
  this.checkButton.disabled = true;
  this.revealButton.disabled = true;
}

Exolve.prototype.resizeCurrClueAndControls = function() {
  const bPos = this.frame.getBoundingClientRect();
  const gpPos = this.gridPanel.getBoundingClientRect();
  const width = Math.max(this.maxCurrClueWidth, gpPos.width);
  const widthPx = width + 'px';
  this.controlsEtc.style.width = widthPx;
  this.currClue.style.width = widthPx;
  /** 
   * We can go from the top of the grid to the top of this.frame, leaving
   * maybe 4 pixels (and any this.visTop) out.
   */
  const maxHeight = Math.max(80, (gpPos.top - bPos.top) - 4 - this.visTop);
  this.currClue.style.maxHeight = maxHeight + 'px';
  const ciPos = this.currClueInner.getBoundingClientRect();
  const minHeight = Math.min(maxHeight, ciPos.height + this.topClueClearance);
  this.currClue.style.minHeight = minHeight + 'px';
  const cPos = this.currClue.getBoundingClientRect();
  this.currClue.style.marginTop = '-' + cPos.height + 'px';

  const gPos = this.gridParent.getBoundingClientRect();
  const horOffset = (gPos.width >= width) ?
    gPos.left : ((gpPos.width - width) / 2);
  this.currClue.style.left = horOffset + 'px';
}

Exolve.prototype.gnavToInner = function(cell, dir) {
  this.currRow = cell[0];
  this.currCol = cell[1];
  this.currDir = dir;

  const gridCell = this.currCell();
  if (!gridCell || (!gridCell.isLight && !gridCell.isDgmless)) {
    return null;
  }

  this.gridInputWrapper.style.left = '' + gridCell.cellLeft + 'px'
  this.gridInputWrapper.style.top = '' + gridCell.cellTop + 'px'
  this.gridInput.value = gridCell.prefill ? '' :
      this.stateToDisplayChar(gridCell.currLetter);
  this.gridInputRarr.style.display = 'none';
  this.gridInputDarr.style.display = 'none';
  this.gridInputLarr.style.display = 'none';
  this.gridInputUarr.style.display = 'none';

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
  if (this.currDir == 'A' && !gridCell.isDgmless &&
      !gridCell.acrossClueLabel && !gridCell.dgmlessSpanA) {
    this.toggleCurrDir()
  } else if (this.currDir == 'D' && !gridCell.isDgmless &&
             !gridCell.downClueLabel && !gridCell.dgmlessSpanD) {
    this.toggleCurrDir()
  } else if (this.currDir == 'Z' && !gridCell.z3dClueLabel) {
    this.toggleCurrDir()
  } else if (this.currDir.charAt(0) == 'X' &&
             (!gridCell.nodirClues ||
              !gridCell.nodirClues.includes(this.currDir))) {
    this.toggleCurrDir()
  }
  if (this.currDir == 'A') {
    if (gridCell.acrossClueLabel) {
      activeClueLabel = gridCell.acrossClueLabel
      activeClueIndex = this.getDirClueIndex('A', activeClueLabel);
    }
  } else if (this.currDir == 'D') {
    if (gridCell.downClueLabel) {
      activeClueLabel = gridCell.downClueLabel
      activeClueIndex = this.getDirClueIndex('D', activeClueLabel);
    }
  } else if (this.currDir == 'Z') {
    if (gridCell.z3dClueLabel) {
      activeClueLabel = gridCell.z3dClueLabel
      activeClueIndex = this.getDirClueIndex('Z', activeClueLabel);
    }
  } else {
    // currDir is actually a clueindex (for an X clue)
    activeClueIndex = this.currDir
    activeClueLabel = this.currDir.substr(1)
  }
  if (activeClueIndex != '') {
    if (!this.clues[activeClueIndex]) {
      activeClueIndex = ''
      if (this.offNumClueIndices[activeClueLabel]) {
        for (const ci of this.offNumClueIndices[activeClueLabel]) {
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
  this.clearButton.disabled = false;
  this.checkButton.disabled = false;
  this.revealButton.disabled = this.hasUnsolvedCells;

  let dgmlessSpan = gridCell['dgmlessSpan' + this.currDir]
  if (dgmlessSpan) {
    for (let rowcol of dgmlessSpan.cells) {
      this.grid[rowcol[0]][rowcol[1]].cellRect.style.fill =
          this.colorScheme['active'];
      this.activeCells.push(rowcol);
    }
    if (!activeClueIndex) {
      activeClueIndex = this.lastOrphan;
    }
  } else if (activeClueIndex && this.clues[activeClueIndex]) {
    let clueIndices = this.getLinkedClues(activeClueIndex);
    let parentIndex = clueIndices[0];
    let last = null;
    for (let clueIndex of clueIndices) {
      for (let rowcol of this.clues[clueIndex].cells) {
        this.grid[rowcol[0]][rowcol[1]].cellRect.style.fill =
            this.colorScheme['active'];
        if (!last || last[0] != rowcol[0] || last[1] != rowcol[1]) {
          this.activeCells.push(rowcol);
          last = rowcol;
        }
      }
    }
    if (this.activeCells.length > 1 && last &&
        last[0] == this.activeCells[0][0] &&
        last[1] == this.activeCells[0][1]) {
      // Snake!
      this.activeCells.pop();
    }
  } else {
    // Isolated cell, hopefully a part of some nodir clue
    this.activeCells.push([this.currRow, this.currCol])
    activeClueIndex = this.lastOrphan
  }
  gridCell.cellRect.style.fill = this.colorScheme['input'];
  if (!gridCell.prefill) {
    gridCell.cellText.style.fill = this.colorScheme['light-text-input'];
  }
  if (gridCell.cellNum) {
    gridCell.cellNum.style.fill = this.colorScheme['light-label-input'];
  }
  if (gridCell.cellCircle) {
    gridCell.cellCircle.style.stroke = this.colorScheme['circle-input'];
  }

  if (activeClueIndex) {
    const clue = this.clues[activeClueIndex];
    if (clue.dir == 'A') {
      if (clue.reversed) this.gridInputLarr.style.display = '';
      else this.gridInputRarr.style.display = '';
    } else if (clue.dir == 'D') {
      const pointDown = (this.layers3d == 1 && !clue.reversed) ||
                        (this.layers3d > 1 && clue.reversed);
      if (pointDown) this.gridInputDarr.style.display = '';
      else this.gridInputUarr.style.display = '';
    } else if (clue.dir == 'Z') {
      if (clue.reversed) {
        this.gridInputLarr.style.display = '';
        this.gridInputUarr.style.display = '';
      } else {
        this.gridInputRarr.style.display = '';
        this.gridInputDarr.style.display = '';
      }
    }
  }

  if (this.layers3d > 1) {
    this.gridInputWrapper.style.transformOrigin = 'top left';
    this.gridInputWrapper.style.transform =
      this.skew3d + ` translate(${gridCell.offset3d}px)`;
  }

  return activeClueIndex;
}

Exolve.prototype.activateCell = function(row, col) {
  this.deactivateCurrCell();
  const clue = this.gnavToInner([row, col], this.currDir);
  this.deactivateCurrClue();
  if (clue) {
    this.cnavToInner(clue);
  }
  this.updateDisplayAndGetState();
}

Exolve.prototype.cellActivator = function(row, col) {
  this.usingGnav = true;
  this.activateCell(row, col);
}
Exolve.prototype.clueActivator = function(ci) {
  this.usingGnav = false;
  this.cnavTo(ci);
}

Exolve.prototype.getViewportHeight = function() {
  // From an iframe do not rely on document.documentElement.clientHeight
  const ch = (window.location != window.parent.location) ? 0 :
      document.documentElement.clientHeight;
  return window.innerHeight && ch ? Math.min(window.innerHeight, ch) :
      window.innerHeight || ch ||
      document.getElementsByTagName('body')[0].clientHeight;
}

Exolve.prototype.getViewportWidth = function() {
  const cw = (window.location != window.parent.location) ? 0 :
      document.documentElement.clientWidth;
  return window.innerWidth && cw ? Math.min(window.innerWidth, cw) :
      window.innerWidth || cw ||
      document.getElementsByTagName('body')[0].clientWidth;
}

// Scroll if a clueTR is not visible, but its clues list is, vertically.
Exolve.prototype.scrollIfNeeded = function(elt) {
  const par = elt.parentElement.parentElement
  const parPos = par.getBoundingClientRect();
  if (parPos.bottom < 0) {
    return
  }
  let windowH = this.getViewportHeight()
  if (!windowH || windowH <= 0) {
    return
  }
  if (parPos.top >= windowH) {
    return
  }
  const pos = elt.getBoundingClientRect();
  if (pos.bottom < 0 || pos.bottom < parPos.top || pos.top >= windowH ||
      pos.top < parPos.top || pos.top >= parPos.bottom) {
    par.scrollTop = pos.top - elt.parentElement.getBoundingClientRect().top
  }
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
      <button id="${this.prefix}-curr-clue-prev"
        class="xlv-small-button xlv-nextprev"
        title="${this.textLabels['curr-clue-prev.hover']}"
          >${this.textLabels['curr-clue-prev']}</button>
      <button id="${this.prefix}-curr-clue-next"
        class="xlv-small-button xlv-nextprev"
        title="${this.textLabels['curr-clue-next.hover']}"
          >${this.textLabels['curr-clue-next']}</button></span>`;
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
  this.cnavTo(next, false)
  this.refocus()
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
  this.cnavTo(prev, false)
  this.refocus()
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
  let colour = orphan ? this.colorScheme['orphan'] :
      this.colorScheme['active-clue'];
  for (let clueIndex of clueIndices) {
    let theClue = this.clues[clueIndex]
    if (theClue.anno || theClue.solution || (orphan && theClue.cellsOfOrphan)) {
      this.revealButton.disabled = false
    }
    if (!theClue.clueTR) {
      continue
    }
    theClue.clueTR.style.background = colour;
    if (this.cluesPanelLines > 0) {
      this.scrollIfNeeded(theClue.clueTR)
    }
    this.activeClues.push(theClue.clueTR)
  }
  this.currClueIndex = activeClueIndex
  this.currClueInner.innerHTML = this.getCurrClueButtons() +
    curr.fullDisplayLabel +
    `<span id="${this.prefix}-curr-clue-text"></span>`
  let clueSpan = document.getElementById(`${this.prefix}-curr-clue-text`)
  this.renderClueSpan(curr, clueSpan, true)
  if (curr.hints.length > 0) {
    const shown = curr.hintsDisplay ? curr.hintsDisplay.hintsShown : 0;
    curr.hintsDisplay = new ExolveHints(
        this, clueSpan, curr.hints, shown, true /* resize */);
  }

  document.getElementById(this.prefix + '-curr-clue-prev').addEventListener(
      'click', this.cnavPrev.bind(this))
  document.getElementById(this.prefix + '-curr-clue-next').addEventListener(
      'click', this.cnavNext.bind(this))
  let currLab = document.getElementById(this.prefix + '-curr-clue-label')
  if (currLab.parentElement.classList.contains('xlv-clickable')) {
    currLab.addEventListener(
        'click', this.toggleClueSolvedState.bind(this, this.currClueIndex))
  }
  if (this.clues[parentIndex].placeholderBlank) {
    let placeholder = ''
    let len = this.clues[parentIndex].placeholderBlank.size ||
              this.PLACEHOLDER_BLANK_LEN;
    if (this.clues[parentIndex].placeholder) {
      placeholder = this.clues[parentIndex].placeholder.replace(/\?/g, '·');
    }
    this.addPlaceholderBlank(this.currClueInner, true, len, placeholder, parentIndex);
    this.copyPlaceholderBlankToCurr(parentIndex)
    if (grabFocus && !this.usingGnav && parentIndex == activeClueIndex) {
      this.clues[parentIndex].placeholderBlank.focus();
    }
  }
  this.currClueInner.style.background = this.colorScheme['currclue'];
  this.updateClueState(parentIndex, false, null, false)
  this.currClue.style.display = '';
  this.resizeCurrClueAndControls();
  return gnav;
}

// The current gnav position is diagramless or does not have a known
// clue in the current direction.
Exolve.prototype.gnavIsClueless = function() {
  const gridCell = this.currCell()
  if (!gridCell) {
    return false
  }
  let aIndex = '';
  let dIndex = '';
  return (gridCell.isDgmless ||
     (this.currDir == 'A' &&
      (!gridCell.acrossClueLabel ||
       !(aIndex = this.getDirClueIndex('A', gridCell.acrossClueLabel)) ||
       !this.clues[aIndex] ||
       !this.clues[aIndex].clue)) ||
     (this.currDir == 'D' &&
      (!gridCell.downClueLabel ||
       !(dIndex = this.getDirClueIndex('D', gridCell.downClueLabel)) ||
       !this.clues[dIndex] ||
       !this.clues[dIndex].clue)) ||
     (this.currDir == 'Z' &&
      (!gridCell.z3dClueLabel ||
       !(zIndex = this.getDirClueIndex('Z', gridCell.z3dClueLabel)) ||
       !this.clues[zIndex] ||
       !this.clues[zIndex].clue)) ||
     (this.currDir.charAt(0) == 'X' &&
      (!gridCell.nodirClues ||
       !gridCell.nodirClues.includes(this.currDir))));
}

Exolve.prototype.cnavTo = function(activeClueIndex, grabFocus=true) {
  if (activeClueIndex == this.currClueIndex) {
    this.refocus();
    return;
  }
  this.deactivateCurrClue();
  let cellDir = this.cnavToInner(activeClueIndex, grabFocus)
  if (cellDir) {
    this.deactivateCurrCell();
    this.gnavToInner([cellDir[0], cellDir[1]], cellDir[2])
  } else {
    // If the currently active cells had a known clue association, deactivate.
    if (!this.gnavIsClueless()) {
      this.deactivateCurrCell();
    }
  }
  this.updateDisplayAndGetState()
}

Exolve.prototype.copyPlaceholderBlank = function(clueIndex) {
  if (this.hideCopyPlaceholders || this.activeCells.length < 1 ||
      !clueIndex || !this.clues[clueIndex] || !this.clues[clueIndex].clueTR) {
    return;
  }
  const inp = this.clues[clueIndex].placeholderBlank;
  if (!inp) {
    return;
  }
  const entry = inp.value;
  let splitter = '';
  if (this.langMaxCharCodes > 1 && entry.indexOf(' ') >= 0) {
    splitter = ' ';
  }
  const letters = [];
  const candLetters = entry.split(splitter);
  for (const letter of candLetters) {
    if (!this.caseCheck(letter)) {
      if (!this.allowChars || !this.allowChars[letter]) {
        continue;
      }
    }
    letters.push(letter);
  }
  if (letters.length < 1) {
    return;
  }
  if (letters.length != this.activeCells.length) {
    const msg = this.textLabels['confirm-mismatched-copy'];
    if (msg &&
        !this.maybeConfirm(msg + ' ' + letters.length +
                           ':' + this.activeCells.length)) {
      return;
    }
  }
  let index = 0
  let row = -1
  let col = -1
  for (let i = 0; i < letters.length; i++) {
    if (index >= this.activeCells.length) {
      break;
    }
    const x = this.activeCells[index++];
    row = x[0];
    col = x[1];
    const gridCell = this.grid[row][col];
    if (gridCell.prefill) {
      continue;
    }
    const letter = letters[i];
    const oldLetter = gridCell.currLetter;
    if (oldLetter != letter) {
      gridCell.currLetter = letter;
      const revealedChar = this.stateToDisplayChar(letter);
      gridCell.textNode.nodeValue = revealedChar;
      if (this.atCurr(row, col)) {
        this.gridInput.value = revealedChar;
      }
    }
  }
  this.adjustRebusFonts();
  if (index < this.activeCells.length) {
    // Advance to the next square.
    const x = this.activeCells[index];
    row = x[0];
    col = x[1];
  }
  if (row >= 0 && col >= 0) {
    this.activateCell(row, col);
  }
  this.updateActiveCluesState();
  this.updateAndSaveState();
}

// inCurr is set to true when this is called oninput in the currClue strip
// and false when called oninput in the clues table.
Exolve.prototype.updateOrphanEntry = function(clueIndex, inCurr, evt) {
  if (!clueIndex || !this.clues[clueIndex] || !this.clues[clueIndex].clueTR ||
      this.clues[clueIndex].parentClueIndex ||
      !this.clues[clueIndex].placeholderBlank) {
    return
  }
  evt.stopPropagation();
  const theInput = this.clues[clueIndex].placeholderBlank;
  if (!inCurr) {
    let cursor = theInput.selectionStart
    theInput.value = theInput.value.toUpperCase().trimLeft()
    theInput.selectionEnd = cursor
    this.updateAndSaveState()
  }
  let curr = document.getElementById(this.CURR_PLACEHOLDER_BLANK_ID)
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
Exolve.prototype.copyPlaceholderBlankToCurr = function(clueIndex) {
  if (!clueIndex || !this.clues[clueIndex] || !this.clues[clueIndex].clueTR ||
      this.clues[clueIndex].parentClueIndex ||
      !this.clues[clueIndex].placeholderBlank) {
    return
  }
  const clueInput = this.clues[clueIndex].placeholderBlank;
  const curr = document.getElementById(this.CURR_PLACEHOLDER_BLANK_ID);
  if (!curr) {
    return;
  }
  const currInputs = curr.getElementsByTagName('input');
  if (currInputs.length != 1) {
    return;
  }
  currInputs[0].value = clueInput.value;
}

Exolve.prototype.phBlankCopier = function(clueIndex, e) {
  this.copyPlaceholderBlank(clueIndex)
  e.stopPropagation()
}

Exolve.prototype.clueInputClick = function(e) {
  e.stopPropagation();
}

Exolve.prototype.addPlaceholderBlank = function(
    elt, inCurr, len, placeholder, clueIndex) {
  let html = '<span'
  if (inCurr) {
    html = html + ' id="' + this.CURR_PLACEHOLDER_BLANK_ID + '"'
  }
  if (len < placeholder.length) {
    len = placeholder.length;
  }
  html = html + ' class="xlv-nobr">' +
    '<input size="' + len + '" + style="max-width:' + len + 'ch"' +
    '" class="xlv-incluefill" placeholder="' + placeholder +
    '" type="text" ' +
    'title="' + this.textLabels['placeholder.hover'] + '" ' +
    'autocomplete="off" spellcheck="off"></input>'
  if (!this.hideCopyPlaceholders) {
    html = html + '<button title="' +
        this.textLabels['placeholder-copy.hover'] + '" ' +
        'class="xlv-small-button">' + this.textLabels['placeholder-copy'] +
        '</button>'
  }
  html = html + '</span>'
  elt.insertAdjacentHTML('beforeend', html)
  const incluefill = elt.lastElementChild.firstElementChild;
  incluefill.style.color = this.colorScheme['solution'];
  incluefill.addEventListener('input',
      this.updateOrphanEntry.bind(this, clueIndex, inCurr));
  incluefill.addEventListener('click',
      this.boundListeners['clue-input-click']);
  if (!this.hideCopyPlaceholders) {
    elt.lastElementChild.lastElementChild.addEventListener(
      'click', this.phBlankCopier.bind(this, clueIndex));
  }
  return incluefill;
}

Exolve.prototype.followDirOrder = function() {
  // Reorder clue panels to follow listed order in the specs.
  const dirs = ['A', 'D', 'Z', 'X'];
  const dirToElt = {
    'A': this.acrossPanel.parentElement,
    'D': this.downPanel.parentElement,
    'Z': this.z3dPanel.parentElement,
    'X': this.nodirPanel.parentElement,
  }
  dirs.sort(this.dirCmp.bind(this));
  let prev = null;
  for (let dir of dirs) {
    const elt = dirToElt[dir];
    if (prev) prev.after(elt);
    prev = elt;
  }
}

Exolve.prototype.dirCmp = function(d1, d2) {
  return this.dirOrder[d1.substr(0, 1)] - this.dirOrder[d2.substr(0, 1)]
}

Exolve.prototype.toggleCurrDir = function() {
  // toggle direction
  const gridCell = this.currCell();
  if (!gridCell) {
    this.currDir = 'A';
    return;
  }
  let choices = []
  if (gridCell.acrossClueLabel || gridCell.succA || gridCell.predA) {
    choices.push('A');
  }
  if (gridCell.downClueLabel || gridCell.succD || gridCell.predD) {
    choices.push('D');
  }
  if (gridCell.z3dClueLabel || gridCell.succZ || gridCell.predZ) {
    choices.push('Z');
  }
  if (gridCell.nodirClues) {
    choices = choices.concat(gridCell.nodirClues)
  }
  if (choices.length < 1) {
    this.currDir = 'A';
    return;
  }
  choices.sort(this.dirCmp.bind(this));
  let i = 0;
  while (i < choices.length && this.currDir != choices[i]) {
    i++;
  }
  if (i >= choices.length) {
    i = -1;
  }
  const newDir = choices[(i + 1) % choices.length];
  if (this.currDir == newDir) {
    return;
  }
  this.currDir = newDir;
}

/**
 * This can be called with a click event e, or with no argument
 * at all. In case of a click event, we only toggle if the shift
 * modifier is absent.
 */
Exolve.prototype.toggleCurrDirAndActivate = function(e) {
  this.usingGnav = true;
  if (!(e && e.shiftKey)) {
    this.toggleCurrDir();
  }
  this.activateCell(this.currRow, this.currCol);
}

Exolve.prototype.arrowNav = function(rincr, cincr, shouldLoop) {
  console.assert(rincr != 0 || cincr != 0, rincr, cincr);
  let row = this.currRow + rincr;
  let col = this.currCol + cincr;
  while (shouldLoop && this.rcValid(row, col) &&
         !this.grid[row][col].isLight &&
         !this.grid[row][col].isDgmless) {
    row += rincr;
    col += cincr;
  }
  if (this.rcValid(row, col)) {
    const gc = this.grid[row][col];
    if (gc.isLight || gc.isDgmless) {
      this.activateCell(row, col);
      return true;
    }
  }
  return false;
}

/**
 * Handle navigation keys. Used by a listener, and also used to auto-advance
 * after a cell is filled. Returns false only if a tab input was actually used.
 */
Exolve.prototype.handleKeyUpInner = function(key, shift=false) {
  const gridCell = this.currCell();
  if (key == 9 && !shift) {
    // tab
    if (this.usingGnav) {
      if (!gridCell || !this.currDir) {
        return false;
      }
      const gnav = gridCell['next' + this.currDir];
      if (!gnav) {
        return false;
      }
      this.currDir = gnav.dir;
      this.activateCell(gnav.cell[0], gnav.cell[1]);
    } else {
      if (!this.currClueIndex || !this.clues[this.currClueIndex] ||
          !this.clues[this.currClueIndex].next) {
        return false;
      }
      this.cnavTo(this.clues[this.currClueIndex].next);
    }
    return true
  } else if (key == 9 && shift) {
    // shift-tab
    if (this.usingGnav) {
      if (!gridCell || !this.currDir) {
        return false;
      }
      const gnav = gridCell['prev' + this.currDir];
      if (!gnav) {
        return false;
      }
      this.currDir = gnav.dir;
      this.activateCell(gnav.cell[0], gnav.cell[1]);
    } else {
      if (!this.currClueIndex || !this.clues[this.currClueIndex] ||
          !this.clues[this.currClueIndex].prev) {
        return false;
      }
      this.cnavTo(this.clues[this.currClueIndex].prev);
    }
    return true;
  }
  if (!this.currCellIsValid()) {
    return false;
  }

  this.usingGnav = true;
  if (key == 8) {
    if (gridCell.currLetter != '0' && gridCell.currLetter != '?' &&
        !gridCell.prefill) {
      return true;
    }
    // backspace in an empty or prefilled cell
    this.retreatCursorInLight();;
    return true;
  }
  if (key == 46) { // delete key
    if (gridCell && gridCell.isLight && !gridCell.prefill) {
      this.clearCell(this.currRow, this.currCol);
      this.updateActiveCluesState();
      this.updateAndSaveState();
    }
    return true;
  }  
  if (key == 13) {
    // Enter
    this.toggleCurrDirAndActivate();
  } else if (key == 39) {
    // right arrow
    if (!this.arrowNav(0, 1, true)) {
      /* Try one cell right-diagonally up then down */
      if (!this.arrowNav(-1, 1, false)) {
        this.arrowNav(1, 1, false);
      }
    }
  } else if (key == 37) {
    // left arrow
    if (!this.arrowNav(0, -1, true)) {
      /* Try one cell left-diagonally up then down */
      if (!this.arrowNav(-1, -1, false)) {
        this.arrowNav(1, -1, false);
      }
    }
  } else if (key == 40) {
    // down arrow
    if (!this.arrowNav(1, 0, true)) {
      /* Try one cell left-diagonally then right-diagonally down */
      if (!this.arrowNav(1, -1, false)) {
        this.arrowNav(1, 1, false);
      }
    }
  } else if (key == 38) {
    // up arrow
    if (!this.arrowNav(-1, 0, true)) {
      /* Try one cell left-diagonally then right-diagonally up */
      if (!this.arrowNav(-1, -1, false)) {
        this.arrowNav(-1, 1, false);
      }
    }
  }
  return true;
}

Exolve.prototype.handleKeyUp = function(e) {
  let key = e.which || e.keyCode
  if (key == 9) {
    return;  // Already handled with key-down.
  }
  this.handleKeyUpInner(key)
}

Exolve.prototype.muzzleEvent = function(e) {
  e.stopPropagation();
  e.preventDefault();
}

Exolve.prototype.fromNotesToGrid = function() {
  if (this.savedRow == this.currRow && this.savedCol == this.currCol) {
    /* Firefox (etc.?) do not scroll back correctly */
    window.scrollTo(this.savedScrollX || 0, this.savedScrollY || 0);
  }
  this.activateCell(this.currRow, this.currCol);
  this.refocus();
}

// For tab/shift-tab, ctrl-q, ctrl-Q, ctrl-B, ctrl-e
Exolve.prototype.handleKeyDown = function(e) {
  let key = e.which || e.keyCode
  this.lastKeyHadShift = e.shiftKey;
  if (key == 9) {
    if (this.handleKeyUpInner(key, e.shiftKey)) {
      // Tab input got used already.
      e.preventDefault()
    }
  } else if (e.ctrlKey && (e.key == 'q' || e.key == 'Q')) {
    this.muzzleEvent(e);
    if (e.key == 'Q') {
      this.clearAll();
    } else {
      this.clearCurr();
    }
  } else if (e.ctrlKey && e.key == 'B') {
    this.muzzleEvent(e);
    this.printNow('crossword');
  } else if (e.ctrlKey && e.key == '/') {
    if (this.notesPanel.contains(e.target) &&
        this.currCellIsValid()) {
      this.muzzleEvent(e);
      this.fromNotesToGrid();
    } else if (this.focusOnNotes()) {
      this.muzzleEvent(e);
    }
  } else if (e.ctrlKey && e.key == '*') {
    if (this.markAsFave()) {
      this.muzzleEvent(e);
    }
  }
}

Exolve.prototype.advanceCursor = function() {
  const gridCell = this.currCell()
  if (!gridCell) {
    return
  }
  const successor = gridCell['succ' + this.currDir];
  if (!successor) {
    return;
  }
  this.currDir = successor.dir;
  this.activateCell(successor.cell[0], successor.cell[1]);
}

Exolve.prototype.retreatCursorInLight = function() {
  const gridCell = this.currCell()
  if (!gridCell) {
    return
  }
  const pred = gridCell['pred' + this.currDir];
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
// logSolved can be true or false. If true, we call logClueSolve() if
// the clue went from solved-to-unsolved or vice versa or solved-to-solved
// but with some change.
Exolve.prototype.updateClueState =
    function(clueIndex, annoPrefilled, forceSolved, logSolved) {
  let cis = this.getLinkedClues(clueIndex);
  if (!cis || cis.length == 0) {
    return;
  }
  clueIndex = cis[0];  // Use parent for a linked child
  if (!clueIndex) {
    return;
  }
  const clue = this.clues[clueIndex];
  if (!clue) {
    return;
  }
  let solved = false;
  if (clue && clue.clueTR && clue.clueTR.className == 'xlv-solved') {
    solved = true;
  }
  let numFilled = 0;
  let numPrefilled = 0;
  for (const ci of cis) {
    const theClue = this.clues[ci]
    if (!theClue.clueTR) {
      numFilled = 0;
      break;
    }
    let isFullRet = this.isFull(ci);
    if (!isFullRet[0]) {
      numFilled = 0;
      break;
    }
    numFilled += isFullRet[1];
    if (isFullRet[0] == 2) {
      numPrefilled += isFullRet[1];
    }
  }
  if (forceSolved) {
    if (forceSolved == 'solved') {
      solved = true;
    } else {
      solved = false;
      // override for all-prefilled
      if (this.allCellsKnown(clueIndex) && numPrefilled == clue.enumLen) {
        solved = true;
      }
    }
  } else if ((clue.anno || clue.dispSol) && clue.annoSpan.style.display == '') {
    solved = true;
  } else if (this.allCellsKnown(clueIndex)) {
    solved = numFilled == clue.enumLen;
  }
  if (solved && numFilled == numPrefilled && annoPrefilled &&
      (clue.anno || clue.dispSol)) {
    this.revealClueAnno(clueIndex);
  }
  let cls = solved ? 'xlv-solved' : '';
  for (const ci of cis) {
    if (this.clues[ci].clueTR) {
      this.clues[ci].clueTR.setAttributeNS(null, 'class', cls);
    }
    if (ci == this.currClueIndex) {
      let currLab = document.getElementById(this.prefix + '-curr-clue-label');
      if (currLab) {
        currLab.setAttributeNS(
            null, 'class', 'xlv-curr-clue-label' + (cls ? (' ' + cls) : ''));
      }
    }
  }
  const lastEntry = clue.entry || '';
  clue.entry = this.getClueEntry(clueIndex);
  if (logSolved) {
    const wasFull = lastEntry && (lastEntry.indexOf('?') < 0);
    const isFull = clue.entry && (clue.entry.indexOf('?') < 0);
    if ((isFull != wasFull) || (isFull && (clue.entry != lastEntry))) {
      this.logClueSolve(clueIndex, isFull);
    }
  }
}

// Call updateClueState() on all clues active or crossing active cells.
Exolve.prototype.updateActiveCluesState = function() {
  let clueIndices = {}
  if (this.currClueIndex) {
    let lci = this.getLinkedClues(this.currClueIndex)
    for (const ci of lci) {
      clueIndices[ci] = true
    }
  }
  for (let x of this.activeCells) {
    let gridCell = this.grid[x[0]][x[1]]
    if (gridCell.acrossClueLabel) {
      let ci = this.getDirClueIndex('A', gridCell.acrossClueLabel);
      clueIndices[ci] = true
    }
    if (gridCell.downClueLabel) {
      let ci = this.getDirClueIndex('D', gridCell.downClueLabel);
      clueIndices[ci] = true
    }
    if (gridCell.z3dClueLabel) {
      let ci = this.getDirClueIndex('Z', gridCell.z3dClueLabel);
      clueIndices[ci] = true
    }
    if (gridCell.nodirClues) {
      for (const ci of gridCell.nodirClues) {
        clueIndices[ci] = true
      }
    }
  }
  for (let ci in clueIndices) {
    this.updateClueState(ci, false, null, true)
  }
}

/**
 * Highlight-Recent-Overwrites handling:
 *
 * When a grid-cell has an entry that gets *changed*, unless it
 * has a ".overwritten" field already set, we set it it to the
 * overwritten letter, and kick off a timer (configurable with
 * exolve-option highlight-overwritten-seconds). We also set the
 * overwritten text's CSS class to be xlv-overwritten, which kicks
 * off a timed animation that changes its color slowly.
 *
 * At the end of the timer, the function expireOverwrite() gets called on the
 * cell, which sets .overwritten to null and removes the xlv-overwritten class.
 *
 * If the user types into the cell and restores the overwritten
 * letter, then expireOverwrite() is called immediately.
 */
Exolve.prototype.expireOverwrite = function(gridCell) {
  if (!gridCell) {
    return;
  }
  if (gridCell.cellText) {
    gridCell.cellText.classList.remove('xlv-overwritten');
  }
  if (gridCell.overwritten) {
    gridCell.overwritten = null;
  }
  if (gridCell.overwrittenT) {
    clearTimeout(gridCell.overwrittenT);
    gridCell.overwrittenT = null;
  }
}

/**
 * This is the handler for a double-click in a cell. It enables the entry of
 * multiple letters into the current cell, but only if the crossword has rebus
 * cells or is in a language that has multi-char letters.
 */
Exolve.prototype.enableMultiLetterEntry = function() {
  if (!this.multiLetter) {
    return;
  }
  const gridCell = this.currCell();
  if (!gridCell || !gridCell.isLight || gridCell.noRebus) {
    return;
  }
  this.multiLetterCellRow = this.currRow;
  this.multiLetterCellCol = this.currCol;
}

/**
 * Only called from handleGridInput(), this checks if
 * multiple letters are to be allowed to be entered during the
 * current entry of letters into a cell.
 */
Exolve.prototype.checkMultiLetterMode = function(gridCell, entry) {
  if (!this.multiLetter) {
    return false;
  }
  const mRow = this.multiLetterCellRow;
  const mCol = this.multiLetterCellCol;
  /**
   * If multi-letter-mode gets enabled for reasons other than the last
   * double-click, or if that double-click was in some other cell, then clear
   * away that double-click's state.
   */
  this.multiLetterCellRow = -1;
  this.multiLetterCellCol = -1;
  if ((this.lastKeyHadShift && !gridCell.noRebus) || entry.length > 1) {
    return true;
  }
  if (this.currRow == mRow && this.currCol == mCol && !gridCell.noRebus) {
    this.multiLetterCellRow = mRow;
    this.multiLetterCellCol = mCol;
    return true;
  }
  return false;
}

Exolve.prototype.handleGridInput = function() {
  this.usingGnav = true;
  const gridCell = this.currCell();
  if (!gridCell) {
    return;
  }
  if (!gridCell.isLight && !gridCell.isDgmless) {
    return;
  }
  let newInput = this.gridInput.value;
  let currDisplayChar = this.stateToDisplayChar(gridCell.currLetter);
  const multiLetterMode = this.checkMultiLetterMode(gridCell, currDisplayChar);
  if (gridCell.currLetter != '0' && gridCell.currLetter != '?' &&
      newInput != currDisplayChar && !multiLetterMode) {
    // The "new" input may be before or after the old input.
    const index = newInput.indexOf(currDisplayChar);
    if (index == 0) {
      newInput = newInput.substr(1);
    }
  }
  let displayChar = newInput.replace(/\s+/g, ' ');
  if (!this.hasRebusCells || !multiLetterMode) {
    displayChar = newInput.substr(0, this.langMaxCharCodes);
  }
  let wasSpace = displayChar == ' ';
  if (wasSpace) {
    if (gridCell.isDgmless) {
      // spacebar creates a blocked cell in a diagramless puzzle cell
      displayChar = this.BLOCK_CHAR;
    } else {
      displayChar = '';
    }
  } else {
    displayChar = displayChar.toUpperCase();
    if (displayChar && !this.isValidDisplayChar(displayChar)) {
      // restore
      this.gridInput.value = gridCell.prefill ? '' :
          this.stateToDisplayChar(gridCell.currLetter);
      return;
    }
  }
  if (gridCell.prefill) {
    // Changes disallowed
    this.gridInput.value = '';
    this.advanceCursor();
    return;
  }
  const stateChar = this.displayToStateChar(displayChar);
  const oldLetter = gridCell.currLetter;
  gridCell.currLetter = stateChar;
  gridCell.textNode.nodeValue = displayChar;
  this.gridInput.value = displayChar;
  if (this.hasRebusCells) {
    const fontSize = this.cellLetterSize(displayChar);
    gridCell.cellText.style.fontSize = fontSize;
    this.gridInput.style.fontSize = fontSize;
  }
  if (oldLetter == '1' || stateChar == '1') {;
    let gridCellSym = this.symCell(this.currRow, this.currCol);
    if (gridCellSym.isDgmless) {
      let symLetter = (stateChar == '1') ? '1' : '0';
      let symChar = (stateChar == '1') ? this.BLOCK_CHAR : '';
      gridCellSym.currLetter = symLetter;
      gridCellSym.textNode.nodeValue = symChar;
    }
  }
  if (displayChar != '' && stateChar != '0' &&
      stateChar != oldLetter && oldLetter != '0' && oldLetter != '?' &&
      this.hltOverwrittenMillis > 0) {
    if (!gridCell.overwritten) {
      /**
       * We have newly overwritten an existing non-blank entry with a new
       * non-blank entry.
       */
      gridCell.overwritten = oldLetter;
      gridCell.cellText.classList.add('xlv-overwritten');
      gridCell.overwrittenT = setTimeout(
          this.expireOverwrite.bind(this, gridCell), this.hltOverwrittenMillis);
    } else if (gridCell.overwritten == stateChar) {
      this.expireOverwrite(gridCell);
    }
  }

  let cluesAffected = [];
  let index = this.getDirClueIndex('A', gridCell.acrossClueLabel);
  if (index && this.clues[index]) {
    cluesAffected.push(index);
  }
  index = this.getDirClueIndex('D', gridCell.downClueLabel);
  if (index && this.clues[index]) {
    cluesAffected.push(index);
  }
  index = this.getDirClueIndex('Z', gridCell.z3dClueLabel);
  if (index && this.clues[index]) {
    cluesAffected.push(index);
  }
  let otherClues = gridCell.nodirClues;
  if (otherClues) {
    cluesAffected = cluesAffected.concat(otherClues);
  }
  for (ci of cluesAffected) {
    this.updateClueState(ci, false, null, true);
  }

  this.updateAndSaveState();

  if (!multiLetterMode &&
      (wasSpace || this.isValidDisplayChar(displayChar))) {
    this.advanceCursor();
  }
}

Exolve.prototype.deactivator = function() {
  this.deactivateCurrCell();
  this.deactivateCurrClue();
  this.usingGnav = false;
}

Exolve.prototype.createListeners = function() {
  /**
   * Listeners used for various events. If someone wants to hack and
   * replace listeners, they can use removeEventListener() (they will
   * need to pass the appropriate listener among boundListeners[..]).
   */
  this.boundListeners = {};

  this.boundListeners['clue-input-click'] = this.clueInputClick.bind(this);
  this.boundListeners['key-up'] = this.handleKeyUp.bind(this);
  this.boundListeners['update'] = this.updateAndSaveState.bind(this, true);

  this.boundListeners['key-down'] = this.handleKeyDown.bind(this);

  this.boundListeners['grid-input'] = this.handleGridInput.bind(this);
  this.boundListeners['grid-cell-dblclick'] = this.enableMultiLetterEntry.bind(this);

  this.boundListeners['grid-cell-click'] = this.toggleCurrDirAndActivate.bind(this);

  this.boundListeners['deactivator'] = this.deactivator.bind(this)
  
  this.windowListeners = {};
  if (this.notTemp) {
    this.windowListeners['resize'] = this.handleResize.bind(this);
    this.windowListeners['beforeprint'] = this.handleBeforePrint.bind(this);
    this.windowListeners['afterprint'] = this.handleAfterPrint.bind(this);
  }
}

Exolve.prototype.bindListeners = function() {
  this.gridInput.addEventListener('keyup', this.boundListeners['key-up']);

  // Listen for tab/shift-tab, ctrl-q/Q everywhere in the puzzle area.
  this.frame.addEventListener('keydown', this.boundListeners['key-down']);

  this.gridInput.addEventListener('input', this.boundListeners['grid-input']);

  this.gridInputWrapper.addEventListener('click', this.boundListeners['grid-cell-click']);
  this.gridInputWrapper.addEventListener('dblclick', this.boundListeners['grid-cell-dblclick']);

  const boundDeactivator = this.boundListeners['deactivator'];
  this.background.addEventListener('click', boundDeactivator);
  // Clicking on the title/setter/preamble will also unselect the current clue.
  this.titleElt.addEventListener('click', boundDeactivator);
  this.setterElt.addEventListener('click', boundDeactivator);
  this.preambleElt.addEventListener('click', boundDeactivator);
  
  if (this.notTemp) {
    for (let e in this.windowListeners) {
      window.addEventListener(e, this.windowListeners[e]);
    }
  }
}

Exolve.prototype.recolourCells = function(scale=1) {
  // Set colours specified through exolve-colour.
  this.colourGroup.innerHTML = '';
  const dupes = {};
  for (let colourSpec of this.colourfuls) {
    for (let cccc of colourSpec.list) {
      for (let cell of cccc.cells) {
        const row = cell[0]
        const col = cell[1]
        if (dupes[[row, col, colourSpec.colour]]) continue;
        this.colourGroup.appendChild(
            this.makeCellDiv(row, col, colourSpec.colour, scale));
        dupes[[row, col, colourSpec.colour]] = true;
      }
    }
  }
  this.colourGroup.style.display = (this.colourfuls.length > 0) ? '' : 'none';
}

Exolve.prototype.cellLetterSize = function(entry) {
  if (!this.hasRebusCells || entry.length <= 1) {
    return this.letterSize + 'px';
  }
  const AVAILABLE_WIDTH = this.cellW - (2.5 * this.BAR_WIDTH);
  const width = this.measureTextWidth(entry);

  if (width <= AVAILABLE_WIDTH) {
    return this.letterSize + 'px';
  }
  const scaledSize = Math.max(6, this.letterSize * AVAILABLE_WIDTH / width);
  return scaledSize + 'px';
}

/**
 * Code and font size scaling idea contributed by DKMiller71.
 */
Exolve.prototype.measureTextWidth = function(entry) {
  /**
   * Re-use canvas object for better performance.
   */
  const canvas = this.canvas ?? (this.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = getComputedStyle(this.gridParent).getPropertyValue("font");
  const metrics = context.measureText(entry);
  return metrics.width;
}

Exolve.prototype.adjustRebusFonts = function() {
  if (!this.hasRebusCells) {
    return;
  }
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      const gridCell = this.grid[i][j];
      if (!gridCell.isLight) {
        continue;
      }
      const displayChar = this.stateToDisplayChar(gridCell.currLetter);
      const fontSize = this.cellLetterSize(displayChar);
      gridCell.cellText.style.fontSize = fontSize;
      if (this.atCurr(i, j)) {
        this.gridInput.style.fontSize = fontSize;
      }
    }
  }
}

Exolve.prototype.displayGrid = function() {
  const fontSize = this.cellLetterSize('');
  this.gridInput.style.fontSize = fontSize;
  this.gridInputWrapper.style.fontSize = fontSize;
  this.numCellsToFill = 0;
  this.numCellsPrefilled = 0;
  const cellColor = this.colorScheme['cell'];
  for (let i = 0; i < this.gridHeight; i++) {
    const cellTop = this.cellTopPos(i, this.GRIDLINE);
    for (let j = 0; j < this.gridWidth; j++) {
      const cellLeft = this.cellLeftPos(j, this.GRIDLINE);

      const gridCell = this.grid[i][j]
      gridCell.cellLeft = cellLeft;
      gridCell.cellTop = cellTop;
      if (gridCell.shapedCell && gridCell.hasOwnProperty('shapedCellX')) {
        gridCell.cellLeft = gridCell.shapedCellX;
        gridCell.cellTop = gridCell.shapedCellY;
      }
      if (!gridCell.isLight && !gridCell.isDgmless) {
        continue;
      }
      const cellGroup =
          document.createElementNS('http://www.w3.org/2000/svg', 'g');
      let activator = this.cellActivator.bind(this, i, j);

      this.numCellsToFill++
      if (gridCell.prefill) {
        this.numCellsPrefilled++
      }
      let cellRect;
      if (gridCell.shapedCell) {
        cellRect = this.makeCellSVG(
            gridCell.cellLeft, gridCell.cellTop,
            this.shapedCells[gridCell.shapedCell - 1].svgSpec, cellColor);
      } else {
        cellRect = this.makeRect(
            gridCell.cellLeft, gridCell.cellTop,
            this.cellW, this.cellH, cellColor);
      }
      cellGroup.appendChild(cellRect)

      const cellText =
          document.createElementNS('http://www.w3.org/2000/svg', 'text');
      cellText.setAttributeNS(
          null, 'x', gridCell.cellLeft - this.GRIDLINE + this.lightStartX);
      cellText.setAttributeNS(
          null, 'y', gridCell.cellTop - this.GRIDLINE + this.lightStartY);
      cellText.setAttributeNS(null, 'text-anchor', 'middle');
      cellText.setAttributeNS(null, 'editable', 'simple');
      let letter = '0'
      let cellClass = 'xlv-cell-text'
      if (gridCell.prefill) {
        letter = gridCell.solution
        cellText.style.fill = this.colorScheme['prefill']
        cellClass = 'xlv-cell-text xlv-prefill';
      } else {
        cellText.style.fill = this.colorScheme['light-text']
      }
      cellText.style.fontSize = fontSize;
      cellText.setAttributeNS(null, 'class', cellClass)

      const text = document.createTextNode(letter);
      cellText.appendChild(text);
      cellGroup.appendChild(cellText);

      gridCell.currLetter = letter;
      gridCell.textNode = text;
      gridCell.cellText = cellText;
      gridCell.cellRect = cellRect;
      gridCell.cellGroup = cellGroup;

      cellText.addEventListener('click', activator);
      cellRect.addEventListener('click', activator);

      if (gridCell.hasCircle) {
        const cellCircle =
            document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        cellCircle.setAttributeNS(null, 'cx', gridCell.cellLeft + (this.cellW/2));
        cellCircle.setAttributeNS(null, 'cy', gridCell.cellTop + (this.cellH/2));
        cellCircle.setAttributeNS(null, 'class', 'xlv-cell-circle');
        cellCircle.style.stroke = this.colorScheme['circle']
        cellCircle.setAttributeNS(null, 'r', this.circleR);
        cellGroup.appendChild(cellCircle)
        cellCircle.addEventListener('click', activator)
        gridCell.cellCircle = cellCircle
      }
      if (gridCell.decorators && gridCell.decorators.length > 0) {
        for (const dp of gridCell.decorators) {
          const d = dp[0];
          const cellDec = this.cellDecs[d - 1];
          const svgSpec = this.fillParams(cellDec.svgSpec, dp);
          const g = this.makeCellSVG(
              gridCell.cellLeft, gridCell.cellTop, svgSpec);
          cellGroup.appendChild(g)
          if (cellDec.clickable) {
            g.addEventListener('click', activator)
          }
        }
      }
      if ((gridCell.startsClueLabel && !gridCell.isDgmless &&
           !gridCell.skipNum && !this.hideInferredNumbers) ||
          gridCell.forcedClueLabel) {
        const cellNum =
            document.createElementNS('http://www.w3.org/2000/svg', 'text');
        let nx = this.NUMBER_START_X;
        let ny = this.numberStartY;
        if (gridCell.shapedCell) {
          const sc = this.shapedCells[gridCell.shapedCell - 1];
          nx = sc.labelX;
          ny = sc.labelY;
        }
        cellNum.setAttributeNS(null, 'x', gridCell.cellLeft - this.GRIDLINE + nx);
        cellNum.setAttributeNS(null, 'y', gridCell.cellTop - this.GRIDLINE + ny);
        cellNum.setAttributeNS(null, 'class', 'xlv-cell-num');
        cellNum.style.fill = this.colorScheme['light-label']
        cellNum.style.fontSize = this.numberSize + 'px'
        const numText = gridCell.forcedClueLabel ?
            gridCell.forcedClueLabel : gridCell.startsClueLabel;
        cellNum.innerHTML = numText;
        cellNum.addEventListener('click', activator);
        cellGroup.appendChild(cellNum);
        gridCell.cellNum = cellNum;
      }
      this.svg.appendChild(cellGroup);
    }
  }
  this.adjustRebusFonts();

  // Bars/word-ends to the right and under; hyphens.
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      let gridCell = this.grid[i][j]
      const cellGroup =
          document.createElementNS('http://www.w3.org/2000/svg', 'g');
      let emptyGroup = true
      if (gridCell.wordEndToRight && (j + 1) < this.gridWidth &&
          this.grid[i][j + 1].isLight) {
        const wordEndRect = this.makeRect(
            this.cellLeftPos(j + 1, this.GRIDLINE - this.SEP_WIDTH_BY2),
            this.cellTopPos(i, this.GRIDLINE),
            this.SEP_WIDTH, this.cellH, this.colorScheme['separator']);
        cellGroup.appendChild(wordEndRect)
        emptyGroup = false
      }
      if (gridCell.wordEndBelow && (i + 1) < this.gridHeight &&
          this.grid[i + 1][j].isLight) {
        const wordEndRect = this.makeRect(
            this.cellLeftPos(j, this.GRIDLINE),
            this.cellTopPos(i + 1, this.GRIDLINE - this.SEP_WIDTH_BY2),
            this.cellW, this.SEP_WIDTH, this.colorScheme['separator']);
        cellGroup.appendChild(wordEndRect)
        emptyGroup = false
      }
      if (gridCell.hyphenToRight) {
        const hw = (j + 1) < this.gridWidth ? this.hyphenW : this.hyphenWBy2
        const hyphenRect = this.makeRect(
            this.cellLeftPos(j + 1, this.GRIDLINE - this.hyphenWBy2),
            this.cellTopPos(
                i, this.GRIDLINE + this.cellHBy2 - this.SEP_WIDTH_BY2),
            hw, this.SEP_WIDTH, this.colorScheme['separator']);
        cellGroup.appendChild(hyphenRect)
        emptyGroup = false
      }
      if (gridCell.hyphenBelow) {
        const hh = (i + 1) < this.gridHeight ? this.hyphenW : this.hyphenWBy2
        const hyphenRect = this.makeRect(
            this.cellLeftPos(
                j, this.GRIDLINE + this.cellWBy2 - this.SEP_WIDTH_BY2),
            this.cellTopPos(i + 1, this.GRIDLINE - this.hyphenWBy2),
            this.SEP_WIDTH, hh, this.colorScheme['separator']);
        cellGroup.appendChild(hyphenRect)
        emptyGroup = false
      }
      if (gridCell.hasBarAfter) {
        const barRect = this.makeRect(
            this.cellLeftPos(j + 1, this.GRIDLINE - this.BAR_WIDTH_BY2),
            this.cellTopPos(i, this.GRIDLINE),
            this.BAR_WIDTH, this.cellH, this.colorScheme['background']);
        cellGroup.appendChild(barRect)
        emptyGroup = false
      }
      if (gridCell.hasBarUnder) {
        const barRect = this.makeRect(
            this.cellLeftPos(j, this.GRIDLINE),
            this.cellTopPos(i + 1, this.GRIDLINE - this.BAR_WIDTH_BY2),
            this.cellW, this.BAR_WIDTH, this.colorScheme['background']);
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

Exolve.prototype.makeGrid3D = function() {
  if (this.layers3d <= 1) {
    return;
  }
  // Set offset3d in each cell. Add background cells and boundary lines as we
  // do not use a full background for 3-d.
  for (let i = 0; i < this.gridHeight; i++) {
    const offset3d = this.offset3d * (this.h3dLayer - (i % this.h3dLayer));
    for (let j = 0; j < this.gridWidth; j++) {
      const gridCell = this.grid[i][j]
      gridCell.offset3d = offset3d;
      if (!gridCell.isLight && !gridCell.isDgmless) {
        gridCell.cellGroup =
            document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const cellRect = this.makeRect(
            gridCell.cellLeft, gridCell.cellTop, this.cellW, this.cellH,
            this.colorScheme['background']);
        gridCell.cellGroup.appendChild(cellRect);
        this.background.appendChild(gridCell.cellGroup);
      }
      const topLine = this.makeRect(
          gridCell.cellLeft - this.GRIDLINE, gridCell.cellTop - this.GRIDLINE,
          this.cellW + this.GRIDLINE, this.GRIDLINE,
          this.colorScheme['background']);
      gridCell.cellGroup.appendChild(topLine);
      if (i == this.gridHeight - 1) {
        const botLine = this.makeRect(
            gridCell.cellLeft - this.GRIDLINE,
            gridCell.cellTop + this.cellH,
            this.cellW + this.GRIDLINE, this.GRIDLINE,
            this.colorScheme['background']);
        gridCell.cellGroup.appendChild(botLine);
      }
      const leftLine = this.makeRect(
          gridCell.cellLeft - this.GRIDLINE, gridCell.cellTop - this.GRIDLINE,
          this.GRIDLINE, this.cellH + this.GRIDLINE,
          this.colorScheme['background']);
      gridCell.cellGroup.appendChild(leftLine);
      if (j == this.gridWidth - 1) {
        const rightLine = this.makeRect(
            gridCell.cellLeft + this.cellW, gridCell.cellTop - this.GRIDLINE,
            this.GRIDLINE, this.cellH + this.GRIDLINE,
            this.colorScheme['background']);
        gridCell.cellGroup.appendChild(rightLine);
      }
    }
  }
  for (let i = 0; i < this.gridHeight; i++) {
    for (let j = 0; j < this.gridWidth; j++) {
      const gridCell = this.grid[i][j];
      const g = gridCell.cellGroup;
      const origin = `${gridCell.cellLeft}px ${gridCell.cellTop}px`;
      const transform = this.skew3d + ` translate(${gridCell.offset3d}px)`;
      g.style.transformOrigin = origin;
      g.style.transform = transform;
      if (gridCell.miscGroup) {
        gridCell.miscGroup.style.transformOrigin = origin;
        gridCell.miscGroup.style.transform = transform;
      }
    }
  }
}

/**
 * API for customization: add small text to cell.
 */
Exolve.prototype.addCellText = function(row, col, text,
                                        h=16, w=10,
                                        atTop=true, toRight=false) {
  if (row < 0 || row >= this.gridHeight ||
      col < 0 || col >= this.gridWidth) {
    return;
  }
  const gridCell = this.grid[row][col];
  if (!gridCell.isLight && !gridCell.isDgmless) {
    return;
  }
  const cellText =
      document.createElementNS('http://www.w3.org/2000/svg', 'text');
  const xOff = toRight ? (this.cellW + this.GRIDLINE - (w + this.NUMBER_START_X)) : this.NUMBER_START_X;
  cellText.setAttributeNS(null, 'x', this.cellLeftPos(col, xOff));
  const yOff = atTop ? h : this.cellH + this.GRIDLINE - this.NUMBER_START_X;
  cellText.setAttributeNS(null, 'y', this.cellTopPos(row, yOff));
  cellText.textLength = w + 'px';
  cellText.style.fill = this.colorScheme['light-label'];
  cellText.style.fontSize = h + 'px';
  cellText.innerHTML = text;
  cellText.addEventListener('click', this.cellActivator.bind(this, row, col));
  gridCell.cellGroup.appendChild(cellText);
  return cellText;
}

Exolve.prototype.makeCellDiv = function(row, col, colour, scale=1) {
  const gridCell = this.grid[row][col];

  const asBar = this.colourOnlyCellBottom && (this.layers3d == 1);
  const rectTop = gridCell.cellTop + (asBar ? (this.cellH * 7 / 10) : 0);
  const rectLeft = gridCell.cellLeft;
  const rectH = (asBar ? (this.cellH * 3 / 10) : this.cellH);
  const rectW = this.cellW;

  const rect = document.createElement('div');
  rect.style.backgroundColor = colour;
  rect.setAttributeNS(null, 'class', 'xlv-coloured-cell');

  rect.style.left =  '' + (rectLeft * scale) + 'px';
  rect.style.top = '' + (rectTop * scale) + 'px';
  rect.style.width = '' + (rectW * scale) + 'px';
  rect.style.height = '' + (rectH * scale) + 'px';
  if (asBar) {
    rect.style.opacity = 0.4;
  }

  if (this.layers3d > 1) {
    rect.style.transformOrigin = 'top left';
    rect.style.transform =
      `${this.skew3d} translate(${gridCell.offset3d * scale}px)`;
  }
  rect.addEventListener(
      'click', this.cellActivator.bind(this, row, col));
  return rect;
}

Exolve.prototype.redisplayNinas = function(scale=1) {
  this.ninaGroup.innerHTML = '';
  this.ninaClassElements = [];
  let ninaColorIndex = 0;
  const dupes = {};
  for (let nina of this.ninas) {
    console.assert(nina.colour, nina);
    for (let cccc of nina.list) {
      if (cccc.cls) {
        // span-class-specified nina
        const elts = this.frame.getElementsByClassName(cccc.cls);
        if (!elts || elts.length == 0) {
          console.log('Nina ' + cccc.str + ' is not a cell/clue ' +
                      'location nor a class with html tags');
          continue;
        }
        for (let x = 0; x < elts.length; x++) {
          this.ninaClassElements.push({
            element: elts[x],
            colour: nina.colour,
          });
        }
      } else if (cccc.cells) {
        for (let cell of cccc.cells) {
          const row = cell[0]
          const col = cell[1]
          if (dupes[[row, col, nina.colour]]) continue;
          this.ninaGroup.appendChild(this.makeCellDiv(row, col, nina.colour, scale));
          dupes[[row, col, nina.colour]] = true;
        }
      }
    }
  }
}

Exolve.prototype.showNinas = function() {
  for (const ec of this.ninaClassElements) {
    ec.element.style.backgroundColor = ec.colour;
  }
  this.ninaGroup.style.display = '';
  this.ninasButton.innerHTML = this.textLabels['hide-ninas']
  this.ninasButton.title = this.textLabels['hide-ninas.hover']
  this.showingNinas = true
  if (this.ninas.length > 0 && this.noNinaButton) {
    // Show the "hide-ninas" button
    this.ninasButton.style.display = ''
  }
}

Exolve.prototype.hideNinas = function() {
  for (const ec of this.ninaClassElements) {
    ec.element.style.backgroundColor = 'transparent';
  }
  this.ninaGroup.style.display = 'none';
  this.ninasButton.innerHTML = this.textLabels['show-ninas']
  this.ninasButton.title = this.textLabels['show-ninas.hover']
  this.showingNinas = false
  if (this.ninas.length > 0 && this.noNinaButton) {
    // Hide the "show-ninas" button
    this.ninasButton.style.display = 'none'
  }
}

Exolve.prototype.toggleNinas = function() {
  if (this.showingNinas) {
    this.hideNinas()
  } else {
    if (!this.maybeConfirm(this.textLabels['confirm-show-ninas'])) {
      return
    }
    this.showNinas()
  }
}

Exolve.prototype.clearCell = function(row, col) {
  let gridCell = this.grid[row][col];
  let oldLetter = gridCell.currLetter;
  if (oldLetter != '0') {
    gridCell.currLetter = '0';
    gridCell.textNode.nodeValue = '';
    if (this.atCurr(row, col)) {
      this.gridInput.value = '';
    }
  }
  this.adjustRebusFonts();
  if (oldLetter == '1') {
    let gridSymCell = this.symCell(row, col);
    if (gridSymCell.isDgmless) {
      gridSymCell.currLetter = '0';
      gridSymCell.textNode.nodeValue = '';
    }
  }
}

// Returns a pair of numbers. The first number is 0 if not full, 1 if full,
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
    if (gridCell.currLetter == '0' || gridCell.currLetter == '?') {
      return [0, 0];
    }
  }
  return (numPrefills == cells.length) ? [2, cells.length] : [1, cells.length];
}

Exolve.prototype.clearCurr = function() {
  let clueIndices = []
  if (this.activeCells.length > 0) {
    let clueCells = null;
    if (this.currClueIndex) {
      clueCells = this.getAllCells(this.clueOrParentIndex(this.currClueIndex));
    }
    if (this.sameCells(this.activeCells, clueCells)) {
      clueIndices = this.getLinkedClues(this.currClueIndex);
    } else {
      for (let cell of this.activeCells) {
        const gridCell = this.grid[cell[0]][cell[1]]
        if (this.currDir == 'A' && gridCell.acrossClueLabel) {
          clueIndices.push(this.getDirClueIndex('A', gridCell.acrossClueLabel));
        }
        if (this.currDir == 'D' && gridCell.downClueLabel) {
          clueIndices.push(this.getDirClueIndex('D', gridCell.downClueLabel));
        }
        if (this.currDir == 'Z' && gridCell.z3dClueLabel) {
          clueIndices.push(this.getDirClueIndex('Z', gridCell.z3dClueLabel));
        }
      }
    }
  } else if (this.currClueIndex) {
    clueIndices = this.getLinkedClues(this.currClueIndex)
  }
  const currClues = {}
  for (const ci of clueIndices) {
    currClues[ci] = true
  }
  for (let clueIndex in currClues) {
    const theClue = this.clues[clueIndex]
    if (theClue.annoSpan) {
      theClue.annoSpan.style.display = 'none'
    }
    if (theClue.inClueAnnoReveals) {
      for (let c in theClue.inClueAnnoReveals) {
        for (let s of theClue.inClueAnnoReveals[c]) {
          s.className = ''
        }
      }
    }
  }
  const fullCrossers = []
  const others = []
  for (let x of this.activeCells) {
    const row = x[0]
    const col = x[1]
    const gridCell = this.grid[row][col]
    if (gridCell.prefill) {
      continue
    }
    if (gridCell.currLetter == '0' || gridCell.currLetter == '?') {
      continue
    }
    const crossers = [];
    const across = this.getDirClueIndex('A', gridCell.acrossClueLabel || '');
    if (this.clues[across] && !currClues[across]) crossers.push(across);
    const down = this.getDirClueIndex('D', gridCell.downClueLabel || '');
    if (this.clues[down] && !currClues[down]) crossers.push(down);
    const z3d = this.getDirClueIndex('Z', gridCell.z3dClueLabel || '');
    if (this.clues[z3d] && !currClues[z3d]) crossers.push(z3d);
    let hasFull = false;
    for (let crosser of crossers) {
      if (this.isFull(crosser)[0]) {
        hasFull = true;
        break;
      }
    }
    if (hasFull) {
      fullCrossers.push([row, col])
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
    this.updateClueState(this.currClueIndex, false, 'unsolved', true)
  }
  this.updateAndSaveState()
  this.refocus()
}

Exolve.prototype.clearAllHandler = function(ev) {
  this.clearAll();
}

Exolve.prototype.clearAll = function(conf=true) {
  let message = this.textLabels['confirm-clear-all'];
  let clearingPls = false;
  if (this.hasPlaceholders) {
    if (this.numCellsFilled == this.numCellsPrefilled) {
      message = this.textLabels['confirm-clear-all-orphans2'];
      clearingPls = true;
    } else {
      message = this.textLabels['confirm-clear-all-orphans1'];
    }
  }
  if (conf && !this.maybeConfirm(message)) {
    this.refocus();
    return false;
  }
  const fontSize = this.cellLetterSize('');
  for (let row = 0; row < this.gridHeight; row++) {
    for (let col = 0; col < this.gridWidth; col++) {
      let gridCell = this.grid[row][col];
      if (!gridCell.isLight && !gridCell.isDgmless) {
        continue;
      }
      if (gridCell.prefill) {
        continue;
      }
      gridCell.currLetter = '0';
      gridCell.textNode.nodeValue = '';
      if (this.atCurr(row, col)) {
        this.gridInput.value = '';
      }
    }
  }
  this.adjustRebusFonts();
  for (let a of this.answersList) {
    if (a.isq) {
      a.input.value = '';
    } else {
      break;
    }
  }
  for (let a of this.revelationList) {
    a.style.display = 'none';
  }
  for (let c in this.inClueAnnoReveals) {
    for (let s of this.inClueAnnoReveals[c]) {
      s.className = '';
    }
  }
  this.hideNinas();

  for (const ci of this.allClueIndices) {
    this.updateClueState(ci, false, 'unsolved', true);
    if (clearingPls && this.clues[ci].placeholderBlank) {
      this.clues[ci].placeholderBlank.value = '';
    }
  }
  if (clearingPls && this.currClue) {
    let clueInputs = this.currClue.getElementsByTagName('input');
    if (clueInputs.length == 1) {
      clueInputs[0].value = '';
    }
  }
  this.updateAndSaveState();
  this.refocus();
  return true;
}

/**
 * If there are alternative solutions, then this uses the current state
 * of the filled grid to determine which exolve-alternatives groups
 * are currently in use, and sets this.alts.activeGroups to be this set.
 */
Exolve.prototype.updateAltsActive = function() {
  if (!this.alts) {
    return;
  }
  this.alts.activeGroups.clear();
  for (const [cellKey, cellAlt] of this.alts.cellToAlt) {
    const cell = JSON.parse(cellKey);
    const gridCell = this.grid[cell[0]][cell[1]];
    if (gridCell.currLetter == cellAlt.letter) {
      this.alts.activeGroups.add(cellAlt.group);
    }
  }
}

/**
 * Forces the currently active set of exolve-alternatives groups to be the
 * modified by looking at the passed groups array and inclusionBits (bit #i
 * determines whether the group at that index is forced in or out).
 *
 * Only for all clues for which anno is visible (because the user has hit
 * "Reveal this/all"), and within them, only for all cells that currently
 * have a letter entry, changes the letter to what's needed by the newly
 * crafted active alternatives groups, if applicable. This is used as the
 * click handler for the revealed list of alternative solutions within a clue.
 */
Exolve.prototype.forceAlts = function(groups, inclusionBits) {
  if (!this.alts) {
    return;
  }
  this.updateAltsActive();
  let bit = 1;
  for (const g of groups) {
    if (bit & inclusionBits) {
      this.alts.activeGroups.add(g);
    } else {
      this.alts.activeGroups.delete(g);
    }
    bit = bit << 1;
  }
  for (const ci of this.allClueIndices) {
    const clue = this.clues[ci];
    if (!clue || clue.parentClueIndex || !clue.annoSpan ||
        clue.annoSpan.style.display != '') {
      continue;
    }
    const cells = this.getAllCells(ci);
    for (const cell of cells) {
      const solution = this.getSolutionActive(cell);
      if (!solution) continue;
      const r = cell[0];
      const c = cell[1];
      const gridCell = this.grid[r][c];
      if (!gridCell.currLetter || gridCell.currLetter == solution) {
        continue;
      }
      gridCell.currLetter = solution;
      const revealedChar = this.stateToDisplayChar(solution);
      gridCell.textNode.nodeValue = revealedChar;
      if (this.atCurr(r, c)) {
        this.gridInput.value = revealedChar;
      }
    }
    this.updateClueState(ci, false, null, true);
  }
  this.adjustRebusFonts();
  this.updateAndSaveState();
  this.refocus();
}

/**
 * Returns an array of objects that look like:
 * {
 *   solution: '...',
 *   dispGroups: [...], (1-based group numbers)
 *   bits: <bitmask>,
 * }
 */
Exolve.prototype.getClueSolutionsWithAlts = function(ci) {
  const clue = this.clues[ci];
  if (!clue || clue.parentClueIndex) {
    return null;
  }
  const cells = this.getAllCells(ci);
  const maxBits = clue.altsGroups ? (1 << clue.altsGroups.length) : 1;
  const results = [];
  for (let bits = 0; bits < maxBits; bits++) {
    const result = {
      solution: '',
      dispGroups: [],
      bits: bits,
    };
    if (clue.altsGroups) {
      console.assert(this.alts);
      /**
       * Temporarily set activeGroups to be only the groups implied by bits.
       */
      this.alts.activeGroups.clear();
      let bit = 1;
      for (const g of clue.altsGroups) {
        if (bit & bits) {
          this.alts.activeGroups.add(g);
          result.dispGroups.push(g + 1);
        }
        bit = bit << 1;
      }
      result.dispGroups.sort();
    }
    let haveSol = false;
    for (const cell of cells) {
      const s = this.getSolutionActive(cell);
      result.solution += (!s || s == '0' || s == '?') ? '?' :
        this.stateToDisplayChar(s);
      if (s && s != '0') haveSol = true;
    }
    if (!haveSol) return null;
    results.push(result);
  }
  return results;
}

/**
 * Call getSolutionActive() only for a valid light cell and only when there is a
 * solution. The solution returned is the one consistent with any currently
 * active alternatives choices, if any (from this.alts.activeGroups, set
 * forcibly or via this.updateAltsActive()).
 */
Exolve.prototype.getSolutionActive = function(cell) {
  const gridCell = this.grid[cell[0]][cell[1]];
  const defSol = gridCell.solution;
  if (!this.alts) {
    return defSol;
  }
  const cellKey = JSON.stringify(cell);
  if (!this.alts.cellToAlt.has(cellKey)) {
    return defSol;
  }
  const cellAlt = this.alts.cellToAlt.get(cellKey);
  if (this.alts.activeGroups.has(cellAlt.group)) {
    return cellAlt.letter;
  }
  return defSol;
}

Exolve.prototype.cellLightTogglerDone = function(button, text) {
  let cc = this.currCell()
  if (this.activeCells.length == 0 || !cc || (!cc.isLight && !cc.isDgmless) ||
      this.gridInputWrapper.style.display == 'none') {
    return
  }
  button.innerHTML = text
  this.cellNotLight = true
}

Exolve.prototype.cellLightToggler = function(button, text) {
  if (this.cellLightToggleTimer) {
    clearTimeout(this.cellLightToggleTimer)
    this.cellLightToggleTimer = null
  }
  this.cellLightToggleTimer = setTimeout(
      this.cellLightTogglerDone.bind(this, button, text), 500);
}

Exolve.prototype.checkCell = function() {
  this.cellNotLight = true;
  this.checkCurr();
}

Exolve.prototype.checkCurr = function() {
  if (this.cellLightToggleTimer) {
    clearTimeout(this.cellLightToggleTimer)
    this.cellLightToggleTimer = null
  }
  this.checkButton.innerHTML = this.textLabels['check']
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
  const fontSize = this.cellLetterSize('');
  this.updateAltsActive();
  for (let x of this.activeCells) {
    let row = x[0]
    let col = x[1]
    let gridCell = this.grid[row][col]
    const oldLetter = gridCell.currLetter
    if (this.getSolutionActive(x) == oldLetter) {
      allCorrectNum++
      continue
    }
    allCorrectNum = 0
    if (this.cellNotLight && !this.atCurr(row, col)) {
      continue;
    }
    gridCell.currLetter = '0'
    gridCell.textNode.nodeValue = ''
    if (this.atCurr(row, col)) {
      this.gridInput.value = ''
    }
    if (oldLetter == '1') {
      let gridSymCell = this.symCell(row, col)
      if (gridSymCell.isDgmless) {
        gridSymCell.currLetter = '0'
        gridSymCell.textNode.nodeValue = ''
      }
    }
    this.updateAltsActive();
  }
  this.adjustRebusFonts();
  this.updateActiveCluesState()
  this.updateAndSaveState()
  this.refocus()
  this.cellNotLight = false;
}

Exolve.prototype.checkAllHandler = function(ev) {
  this.checkAll();
}

Exolve.prototype.checkAll = function(conf=true, erase=true) {
  if (conf && !this.maybeConfirm(this.textLabels['confirm-check-all'])) {
    this.refocus();
    return false;
  }
  let allCorrect = true;
  this.updateAltsActive();
  for (let row = 0; row < this.gridHeight; row++) {
    for (let col = 0; col < this.gridWidth; col++) {
      const gridCell = this.grid[row][col];
      if (!gridCell.isLight && !gridCell.isDgmless) {
        continue;
      }
      if (this.getSolutionActive([row,col]) == gridCell.currLetter) {
        continue;
      }
      allCorrect = false;
      if (!erase) continue;
      gridCell.currLetter = '0';
      gridCell.textNode.nodeValue = '';
      if (this.atCurr(row, col)) {
        this.gridInput.value = '';
      }
      this.updateAltsActive();
    }
  }
  for (const ci of this.allClueIndices) {
    this.updateClueState(ci, false, null, true);
  }
  this.updateAndSaveState();
  this.refocus();
  return allCorrect;
}

Exolve.prototype.revealClueAnno = function(ci) {
  const clueIndices = this.getLinkedClues(ci);
  for (const clueIndex of clueIndices) {
    const theClue = this.clues[clueIndex];
    if (theClue.annoSpan) {
      theClue.annoSpan.style.display = '';
    }
    if (theClue.placeholderBlank) {
      if (theClue.solution) {
        theClue.placeholderBlank.value = theClue.solution;
        if (clueIndex == this.currClueIndex) {
          this.copyPlaceholderBlankToCurr(clueIndex);
        }
      }
    }
    if (theClue.inClueAnnoReveals) {
      for (let c in theClue.inClueAnnoReveals) {
        for (let s of theClue.inClueAnnoReveals[c]) {
          s.className = c;
        }
      }
    }
  }
}

Exolve.prototype.revealCell = function() {
  this.cellNotLight = true;
  this.revealCurr();
}

Exolve.prototype.revealCurr = function() {
  if (this.cellLightToggleTimer) {
    clearTimeout(this.cellLightToggleTimer);
    this.cellLightToggleTimer = null;
  }
  this.revealButton.innerHTML = this.textLabels['reveal'];
  // If active cells are present and usingGnav, we reveal only those (the
  // current clue might be pointing to a random orphan).
  let clueIndexForAnnoReveal = null;
  let addCellsFromOrphanClue = null;
  if (this.usingGnav && this.activeCells.length > 0 && !this.cellNotLight) {
    if (this.currClueIndex && !this.isOrphan(this.currClueIndex)) {
      clueIndexForAnnoReveal = this.currClueIndex;
    }
    if (this.currClueIndex && this.activeCells.length > 1 &&
        (this.isOrphan(this.currClueIndex) ||
         !this.allCellsKnown(this.currClueIndex)) &&
        this.szCellsToOrphan > 0) {
      const orphanClueForCells =
          this.cellsToOrphan[JSON.stringify(this.activeCells)];
      if (orphanClueForCells) {
        this.deactivateCurrClue();
        this.cnavToInner(orphanClueForCells);
        clueIndexForAnnoReveal = orphanClueForCells;
        addCellsFromOrphanClue = this.clues[orphanClueForCells];
      }
    }
  } else if (this.currClueIndex && !this.cellNotLight) {
    clueIndexForAnnoReveal = this.currClueIndex;
    const parentClueIndex =
      this.clues[this.currClueIndex].parentClueIndex || this.currClueIndex;
    if (this.isOrphanWithReveals(parentClueIndex)) {
      this.deactivateCurrCell();
    }
  }
  if (clueIndexForAnnoReveal) {
    if (!addCellsFromOrphanClue) {
      const clue = this.clues[clueIndexForAnnoReveal];
      if (clue.cellsOfOrphan) {
        addCellsFromOrphanClue = clue;
      }
    }
    this.revealClueAnno(clueIndexForAnnoReveal);
  }
  if (addCellsFromOrphanClue) {
    const activeCellsSet = {};
    for (let rowcol of this.activeCells) {
      activeCellsSet[JSON.stringify(rowcol)] = true;
    }
    for (let rowcol of addCellsFromOrphanClue.cellsOfOrphan) {
      const gridCell = this.grid[rowcol[0]][rowcol[1]];
      if (!activeCellsSet[JSON.stringify(rowcol)]) {
        gridCell.cellRect.style.fill = this.colorScheme['active'];
        this.activeCells.push(rowcol);
      }
    }
  }
  this.updateAltsActive();
  for (let x of this.activeCells) {
    const row = x[0];
    const col = x[1];
    if (this.cellNotLight && !this.atCurr(row, col)) {
      continue;
    }
    const gridCell = this.grid[row][col];
    if (gridCell.prefill) {
      continue;
    }
    const oldLetter = gridCell.currLetter;
    const letter = this.getSolutionActive(x);
    if (letter && letter != '0' && letter != '?' &&
        this.getSolutionActive(x) != oldLetter) {
      gridCell.currLetter = letter;
      const revealedChar = this.stateToDisplayChar(letter);
      gridCell.textNode.nodeValue = revealedChar;
      if (this.atCurr(row, col)) {
        this.gridInput.value = revealedChar;
      }
      this.updateAltsActive();
    }
    if (oldLetter == '1' || letter == '1') {
      const gridSymCell = this.symCell(row, col);
      if (gridSymCell.isDgmless) {
        const symLetter = (letter == '1') ? '1' : '0';
        const symChar = (letter == '1') ? this.BLOCK_CHAR : '';
        gridSymCell.currLetter = symLetter;
        gridSymCell.textNode.nodeValue = symChar;
      }
      this.updateAltsActive();
    }
  }
  this.adjustRebusFonts();
  this.updateActiveCluesState();
  if (this.currClueIndex && !this.cellNotLight) {
    this.updateClueState(this.currClueIndex, false, 'solved', true);
  }
  this.updateAndSaveState();
  this.refocus();
  this.cellNotLight = false;
}

Exolve.prototype.revealAllHandler = function(ev) {
  this.revealAll();
}

Exolve.prototype.revealAll = function(conf=true) {
  if (conf && !this.maybeConfirm(this.textLabels['confirm-reveal-all'])) {
    this.refocus();
    return false;
  }
  this.updateAltsActive();
  for (let row = 0; row < this.gridHeight; row++) {
    for (let col = 0; col < this.gridWidth; col++) {
      let gridCell = this.grid[row][col];
      if (!gridCell.isLight && !gridCell.isDgmless) {
        continue;
      }
      if (gridCell.prefill) {
        continue;
      }
      const cell = [row, col];
      const solution = this.getSolutionActive(cell);
      if (solution && solution != gridCell.currLetter) {
        gridCell.currLetter = solution;
        const revealedChar = this.stateToDisplayChar(solution);
        gridCell.textNode.nodeValue = revealedChar;
        if (this.atCurr(row, col)) {
          this.gridInput.value = revealedChar;
        }
        this.updateAltsActive();
      }
    }
  }
  this.adjustRebusFonts();
  for (let a of this.answersList) {
    if (a.ans) {
      a.input.value = a.ans;
    }
  }
  for (let a of this.revelationList) {
    a.style.display = '';
  }
  for (let c in this.inClueAnnoReveals) {
    for (let s of this.inClueAnnoReveals[c]) {
      s.className = c;
    }
  }
  this.showNinas();
  for (const ci of this.allClueIndices) {
    this.revealClueAnno(ci);
    this.updateClueState(ci, false, 'solved', true);
  }
  this.updateAndSaveState();
  this.refocus();
  return true;
}

Exolve.prototype.refocus = function() {
  if (this.gridInputWrapper.style.display != 'none') {
    this.gridInput.focus()
  }
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
    if (this.caseCheck(text[i].toUpperCase())) {
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

Exolve.prototype.scratchPadMath = function() {
  const text = this.scratchPad.value.trim();
  if (!text.endsWith('=')) {
    return;
  }
  const parts = text.split('-');
  if (parts.length != 2) {
    return;
  }
  const a = parts[0].trim();
  const b = parts[1].slice(0, parts[1].length - 1).trim();
  if (!a || !b) {
    return;
  }
  const letterCounter = (s) => {
    counts = {};
    for (const c of s) {
      const cu = c.toUpperCase();
      if (!this.isValidDisplayChar(cu)) {
        continue;
      }
      counts[cu] = counts.hasOwnProperty(cu) ? counts[cu] + 1 : 1;
    }
    return counts;
  };
  countsB = letterCounter(b);
  let aMod = '';
  let bDel = '';
  for (const c of a) {
    const cu = c.toUpperCase();
    if ((countsB[cu] ?? 0) > 0) {
      bDel += c;
      countsB[cu] -= 1;
    } else {
      aMod += c;
    }
  }
  aMod = aMod.trim();
  const bDelCounts = letterCounter(bDel);
  let bMod = '';
  for (const c of b) {
    const cu = c.toUpperCase();
    if ((bDelCounts[cu] ?? 0) > 0) {
      bDelCounts[cu] -= 1;
    } else {
      bMod += c;
    }
  }
  bMod = bMod.trim();
  let result = aMod;
  if (bMod) {
    result += ' - ' + bMod;
  }
  this.scratchPad.value = result;
}

Exolve.prototype.submitSolution = function() {
  let message = this.textLabels['confirm-submit']
  let state = this.updateDisplayAndGetState()
  if (this.numCellsFilled != this.numCellsToFill) {
    message = this.textLabels['confirm-incomplete-submit']
  }
  if (!this.maybeConfirm(message)) {
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
  this.clearButton.title = this.textLabels['clear.hover']
  this.clearAllButton.title = this.textLabels['clear-all.hover']
  this.clearButton.disabled = true
  if (!this.hasUnsolvedCells) {
    this.checkButton.style.display = ''
    this.checkButton.title = this.textLabels['check.hover']
    this.checkButton.disabled = true
    this.checkAllButton.style.display = ''
    this.checkAllButton.title = this.textLabels['check-all.hover']
    this.revealAllButton.style.display = ''
    this.revealAllButton.title = this.textLabels['reveal-all.hover']
    if (this.showCellLevelButtons) {
      document.getElementById(
          this.prefix + '-buttons-extra-row').style.display = '';
      this.checkcellButton.style.display = ''
      this.checkcellButton.title = this.textLabels['checkcell.hover']
      this.checkcellButton.disabled = true
      this.revealcellButton.style.display = ''
      this.revealcellButton.title = this.textLabels['revealcell.hover']
      this.revealcellButton.disabled = true
    }
  }
  if (!this.hasUnsolvedCells || this.hasReveals) {
    this.revealButton.style.display = ''
    this.revealButton.title = this.textLabels['reveal.hover']
    this.revealButton.disabled = true
  }
  if (this.ninas.length > 0 && !this.noNinaButton) {
    this.ninasButton.style.display = ''
    this.ninasButton.title = this.textLabels['show-ninas.hover']
  }
  if (this.submitURL) {
    this.submitButton.style.display = ''
    this.submitButton.title = this.textLabels['submit.hover']
  }
}

Exolve.prototype.togglePanel = function(toggler, toggleable, evt=null) {
  if (toggleable.style.display == 'none') {
    if (this.toggleable && this.toggleable != toggleable) {
      this.toggleable.style.display = 'none';
      this.toggler.classList.remove('xlv-active-toggler');
    }
    if (toggleable == this.notesPanel) {
      this.refreshNotesPanel();
    }
    toggleable.style.display = '';
    toggler.classList.add('xlv-active-toggler');
    this.toggleable = toggleable;
    this.toggler = toggler;
  } else {
    toggleable.style.display = 'none';
    toggler.classList.remove('xlv-active-toggler');
    this.toggleable = null;
    this.toggler = null;
  }
  if (evt) {
    evt.preventDefault();
  }
}

Exolve.prototype.logClueSolve = function(ci, isFull) {
  if (!this.notTemp) return;
  const lastCounter = this.notes.solved[ci] ?
      (this.notes.solved[ci].counter || 0) : 0;
  if (lastCounter > 0) {
    /* Remove this clue from the sequence of solves */
    for (let ci2 of this.allClueIndices) {
      if (!this.notes.solved[ci2]) {
        continue;
      }
      if (this.notes.solved[ci2].counter &&
          this.notes.solved[ci2].counter > lastCounter) {
        this.notes.solved[ci2].counter--;
        this.refreshClueNotes(ci2);
      }
    }
    --this.notes.counter;
    console.assert(this.notes.counter >= 0, this.notes);
  }
  if (isFull) {
    this.notes.solved[ci] = {
      counter: ++this.notes.counter,
      timestamp: Date.now(),
    };
  } else {
    delete this.notes.solved[ci];
  }
  this.refreshClueNotes(ci);
}

Exolve.prototype.getNotesElement = function(defaultToOverall) {
  if (!this.notTemp || !this.notesToggler.offsetParent) {
    /** The notes button has been hidden */
    return null;
  }
  const clue = this.currParentClue();
  let elt = clue ? clue.notesInput : null;
  if (!elt && defaultToOverall) {
    elt = this.notesInput;
  }
  if (!elt) {
    return null;
  }
  if (this.toggleable != this.notesPanel) {
    this.togglePanel(this.notesToggler, this.notesPanel);
  }
  return elt;
}

Exolve.prototype.focusOnNotes = function() {
  const elt = this.getNotesElement(true);
  if (!elt) {
    return false;
  }
  this.savedScrollX = window.pageXOffset;
  this.savedScrollY = window.pageYOffset;
  this.savedRow = this.currRow;
  this.savedCol = this.currCol;
  elt.focus();
  return true;
}

Exolve.prototype.markAsFave = function() {
  const elt = this.getNotesElement(false);
  if (!elt) {
    return false;
  }
  if (!elt.innerText.trim().startsWith('*')) {
    elt.insertAdjacentHTML('afterbegin', '* ');
    this.saveNotesChanges();
  }
  return true;
}

Exolve.prototype.saveNotesChanges = function() {
  this.notes.overall = this.notesInput.innerHTML;
  for (const ci of this.allClueIndices) {
    const clue = this.clues[ci];
    if (!clue || !clue.notesInput) {
      continue;
    }
    this.notes.clues[ci] = clue.notesInput.innerHTML;
  }
  this.updateAndSaveState();
}

Exolve.prototype.refreshClueNotes = function(ci) {
  const clue = this.clues[ci];
  if (!clue || !clue.notesInput || !clue.solvedAt) {
    return;
  }
  clueNotes = this.notes.clues[ci] || '';
  clue.notesInput.innerHTML = clueNotes;
  let solvedAt = '';
  const solved = this.notes.solved[ci];
  if (solved && this.notesSeq.checked) {
    solvedAt += '#' + solved.counter + '. ';
  }
  if (this.notesEntries.checked) {
    const entry = clue.entry;
    if (entry && entry.indexOf('?') < 0) {
      solvedAt += entry + '. ';
    }
  }
  if (solved && this.notesTimes.checked) {
    solvedAt += '<span style="font-size:8px !important">' +
      (new Date(solved.timestamp)).toLocaleString() + '</span>. ';
  }
  clue.solvedAt.innerHTML = solvedAt;
}

Exolve.prototype.refreshNotesPanel = function() {
  this.notesInput.innerHTML = this.notes.overall || '';
  for (const ci of this.allClueIndices) {
    this.refreshClueNotes(ci);
  }
}

Exolve.prototype.copyNotesSuccessEnd = function() {
  this.notesContents.style.opacity = '1';
}

Exolve.prototype.copyNotesSuccess = function() {
  this.notesContents.style.opacity = '0.4';
  setTimeout(this.copyNotesSuccessEnd.bind(this), 300); 
}

Exolve.prototype.copyNotes = function() {
  if(typeof ClipboardItem === "undefined") {
    alert('Sorry, this is not yet supported in your browser!');
    return;
  }
  const type = "text/html";

  /** Temporarily remove the notebook background */
  const cls = 'xlv-overall-notes';
  this.notesInput.classList.remove(cls);
  const blob = new Blob([this.notesContents.innerHTML], {type});
  this.notesInput.classList.add(cls);

  const data = [new ClipboardItem({[type]: blob})];
  navigator.clipboard.write(data).then(
      this.copyNotesSuccess.bind(this),
      function () {
        console.log('Somehow failed to copy notes to the clipboard');
      });
}

Exolve.prototype.emailNotes = function() {
  let url = 'mailto:';
  if (this.email) {
    url += this.email.trim();
  }
  url += '?';
  if (this.title) {
    url += '&subject=' + encodeURIComponent(this.title);
  }
  /** On Firefox, innerText maps '\n<br>' to '\n'\n', fix that: */
  const notesText = this.notesContents.innerText.replace(/\n\n/g, '\n');
  url += '&body=' + encodeURIComponent(notesText);
  window.open(url, '_blank');
}

Exolve.prototype.makeNotesPanel = function() {
  /**
   * Note that inline CSS is used in the notes contents area, so that
   *  formatted text can be copied from it.
   */
  let html = `
  <div class="xlv-notes-header"> 
    <div>
      <button id="${this.prefix}-notes-copy"
          title="${this.textLabels['copy-notes.hover']}"
          class="xlv-small-button">${this.textLabels['copy-notes']}</button>
      <button id="${this.prefix}-notes-email"
          title="${this.textLabels['email-notes.hover']}${this.email ?
            this.textLabels['email-notes-recipients.hover'] + this.email : ''}"
          class="xlv-small-button">${this.textLabels['email-notes']}</button>
    </div>
    <div>
      <label for="${this.prefix}-notes-seq">
        ${this.textLabels['show-notes-seq']}</label>
      <input id="${this.prefix}-notes-seq" checked=true type="checkbox"></input>
    </div>
    <div>
      <label for="${this.prefix}-notes-entries">
        ${this.textLabels['show-notes-entries']}</label>
      <input id="${this.prefix}-notes-entries"
            checked=true type="checkbox"></input>
    </div>
    <div>
      <label for="${this.prefix}-notes-times">
        ${this.textLabels['show-notes-times']}</label>
      <input id="${this.prefix}-notes-times" type="checkbox"></input>
    </div>
    <ul class="xlv-notes-help">${this.textLabels['notes-help']}</ul>
  </div>
  <div class="xlv-notes-contents"
      id="${this.prefix}-notes-contents">
    <style>
    .xlv-clue-notes {
      outline: none;
      width: 60%;
    }
    .xlv-overall-notes {
      background-image:
        repeating-linear-gradient(to bottom, transparent, transparent 13px, silver 14px);
      min-height: 3em;
      outline: none;
      width: 95%;
    }
    </style>
    <div contenteditable=true id="${this.prefix}-overall-notes"
        class="xlv-overall-notes">
    </div>
    <div>`;
  let dir = '';
  for (const ci of this.allClueIndices) {
    const clue = this.clues[ci];
    if (!clue || clue.parentClueIndex) continue;
    if (clue.dir != dir) {
      dir = clue.dir;
      const label =
        ((dir == 'A' && this.layers3d == 1) ? this.textLabels['across-label'] :
        ((dir == 'A' && this.layers3d > 1) ? this.textLabels['3d-ac-label'] :
        ((dir == 'D' && this.layers3d == 1) ? this.textLabels['down-label'] :
        ((dir == 'D' && this.layers3d > 1) ? this.textLabels['3d-aw-label'] :
        ((dir == 'Z' && this.layers3d > 1) ? this.textLabels['3d-dn-label'] :
          this.textLabels['nodir-label'])))));
      html += `
      <p><b>${label}</b></p>`
    }
    html += `
      <div style="border-bottom:1px solid lightgray">
        <b>${clue.label}.</b>
        <span id="${this.prefix}-clue-solved-at-${ci}">
        </span>
        <span contenteditable=true class="xlv-clue-notes"
            id="${this.prefix}-clue-notes-${ci}">
        </span>
      </div>`;
  }
  html += '</div></div>';
  this.notesPanel.innerHTML = html;
  this.notesContents = document.getElementById(this.prefix + '-notes-contents');

  document.getElementById(this.prefix + '-notes-copy').addEventListener(
      'click', this.copyNotes.bind(this));
  document.getElementById(this.prefix + '-notes-email').addEventListener(
      'click', this.emailNotes.bind(this));

  const settingsHandler = this.refreshNotesPanel.bind(this);
  this.notesSeq = document.getElementById(
      this.prefix + '-notes-seq');
  this.notesSeq.addEventListener('change', settingsHandler);
  this.notesTimes = document.getElementById(this.prefix + '-notes-times');
  this.notesTimes.addEventListener('change', settingsHandler);
  this.notesEntries = document.getElementById(this.prefix + '-notes-entries');
  this.notesEntries.addEventListener('change', settingsHandler);

  const inputHandler = this.saveNotesChanges.bind(this);
  this.notesInput = document.getElementById(this.prefix + '-overall-notes');
  this.notesInput.addEventListener('input', inputHandler);
  for (const ci of this.allClueIndices) {
    const clue = this.clues[ci];
    if (!clue || clue.parentClueIndex) continue;
    clue.notesInput = document.getElementById(
        this.prefix + '-clue-notes-' + ci);
    clue.notesInput.addEventListener('input', inputHandler);
    clue.solvedAt = document.getElementById(
        this.prefix + '-clue-solved-at-' + ci);
    clue.notesInput.parentElement.title = (
        clue.clueSpan ? clue.clueSpan.innerText : '');
  }
}

Exolve.prototype.deleteStorage = function(id, timestamp) {
  if (id) {
    if (!this.maybeConfirm(this.textLabels['confirm-delete-id'] +
                           ' ' + id + '?')) {
      return
    }
  } else {
    if (!this.maybeConfirm(this.textLabels['confirm-delete-older'] + ' ' +
                 (new Date(timestamp)).toLocaleString() + '?')) {
      return
    }
  }
  document.getElementById(this.prefix + '-storage-list').style.display = 'none';
  if (id) {
    window.localStorage.removeItem('xlvstate:' + id);
  } else {
    const keysToDelete = [];
    for (let idx = 0; idx < window.localStorage.length; idx++) {
      let key = window.localStorage.key(idx)
      if (!key.startsWith('xlvstate:')) {
        continue;
      }
      let lsVal;
      try {
        lsVal = JSON.parse(window.localStorage.getItem(key));
      } catch (err) {
        continue;
      }
      if (lsVal.timestamp < timestamp) {
        keysToDelete.push(key);
      }
    }
    for (let key of keysToDelete) {
      window.localStorage.removeItem(key);
    }
  }
  this.manageStorage(null);
}

Exolve.prototype.manageStorage = function(e) {
  let b = document.getElementById(this.prefix + '-manage-storage')
  let slist = document.getElementById(this.prefix + '-storage-list')
  if (slist.style.display == 'none') {
    b.title = this.textLabels['manage-storage-close.hover']
    let saved = [];
    let bytes = 0;
    for (let idx = 0; idx < window.localStorage.length; idx++) {
      let key = window.localStorage.key(idx)
      if (!key.startsWith('xlvstate:')) {
        continue;
      }
      bytes += key.length;
      let lsVal;
      try {
        lsVal = window.localStorage.getItem(key);
        bytes += lsVal.length;
        lsVal = JSON.parse(lsVal);
      } catch (err) {
        continue;
      }
      saved.push({
        timestamp: lsVal.timestamp,
        id: key.substr(9)
      });
    }
    b.innerText = this.textLabels['manage-storage-close'] +
                  ' ' + (bytes/1024).toFixed(1) + ' KB';
    saved.sort(function(a, b) {return b.timestamp - a.timestamp;});
    let html = '<table>'
    let x = 0
    for (let s of saved) {
      html += `
      <tr>
        <td>${s.id}</td>
        <td><button class="xlv-small-button"
               title="Delete this puzzle's saved state"
               id="${this.prefix}-delstor-${x}">
                 &times; this</button></td>
        <td><button class="xlv-small-button"
               title="Delete saved states for ALL puzzles older than this"
               id="${this.prefix}-delprev-${x}">
                 &times older</button></td>
        <td>${(new Date(s.timestamp)).toLocaleString()}</td>
      </tr>
      `;
      x += 1;
    }
    html += '<table>'
    slist.innerHTML = html
    x = 0
    for (let s of saved) {
      document.getElementById(`${this.prefix}-delstor-${x}`).
        addEventListener('click', this.deleteStorage.bind(this, `${s.id}`, 0));
      document.getElementById(`${this.prefix}-delprev-${x}`).
        addEventListener('click', this.deleteStorage.bind(this, '', s.timestamp));
      x += 1;
    }
    slist.style.display = ''
  } else {
    slist.style.display = 'none'
    b.innerText = this.textLabels['manage-storage']
    b.title = this.textLabels['manage-storage.hover']
  }
}

/**
 * mode can be one of: 'page' 'crossword' 'wysiwyg'
 */
Exolve.prototype.printNow = function(mode) {
  if (mode == 'page') {
    this.printAsIs = false;
    this.printOnlyCrossword = false;
  } else if (mode == 'crossword') {
    this.printAsIs = false;
    this.printOnlyCrossword = true;
  } else {
    /* wysiwyg */
    this.printAsIs = true;
    this.printOnlyCrossword = false;
  }
  window.print();
  /**
   * As of Sept 2022, Chrome has a bug wherein sometimes (usually after the
   * first page load), window.print() does not conclude with an 'afterprint'
   * event. window.print() is modal and handleAfterPrint() can be safely
   * called twice, so just call it here.
   */
  this.handleAfterPrint();
}

Exolve.prototype.handleAfterPrint = function() {
  if (this.printingChanges) {
    this.printAsIs = false;
    this.printOnlyCrossword = false;
    if (this.printingChanges.inksaver) {
      this.changeBG(this.colorScheme['background']);
    }
    if (this.printingChanges.hiddenDisplays) {
      for (let display in this.printingChanges.hiddenDisplays) {
        const elts = this.printingChanges.hiddenDisplays[display];
        for (let elt of elts) {
          elt.style.display = display;
        }
      }
    }
    if (this.printingChanges.moves) {
      // Undo the moves in reverse order.
      for (let i = this.printingChanges.moves.length - 1; i >= 0; i--) {
        const move = this.printingChanges.moves[i];
        move.target.insertBefore(move.elem, move.sibling);
      }
    }
    if (this.printingChanges.extras) {
      for (let extra of this.printingChanges.extras) {
        extra.remove();
      }
    }
    if (this.printingChanges.explnHtml) {
      this.explanations.innerHTML = this.printingChanges.explnHtml;
    }
    this.setColumnLayout();
    this.recolourCells();
    this.redisplayNinas();

    // Restore active clue/cells.
    if (this.printingChanges.usingGnav) {
      this.currDir = this.printingChanges.currDir;
      this.activateCell(this.printingChanges.currRow,
                        this.printingChanges.currCol);
    } else {
      this.cnavTo(this.printingChanges.currClueIndex);
    }

    if (this.printingChanges.pageYOffset) {
      window.scrollTo({top: this.printingChanges.pageYOffset});
    }
  }
  this.printingChanges = null;
}

Exolve.prototype.parseFontSize = function(str) {
  const ret = {
    number: NaN,
    unit: '',
    str: str,
  };
  const strStart = str.search(/[a-zA-Z]/);
  if (strStart < 0) return ret;
  ret.number = parseFloat(str.substr(0, strStart));
  ret.unit = str.substr(strStart);
  return ret;
}

Exolve.prototype.setPrintFont = function(fromMenu) {
  if (!this.printFontMenu || !this.printFontInput) return;
  if (fromMenu && this.printFontMenu.value != 'other') {
    this.printFontInput.value = this.printFontMenu.value;
  }
  if (this.printFontInput.value != this.printFontInput.value.toLowerCase()) {
    this.printFontInput.value = this.printFontInput.value.toLowerCase();
  }
  const parsedFont = this.parseFontSize(this.printFontInput.value);
  if (isNaN(parsedFont.number)) {
    this.printFontInput.value = '18px';
  } else {
    this.printFontInput.value = '' + parsedFont.number + parsedFont.unit;
  }
  if (!fromMenu) {
    if (['18px', '22px', '26px', '14px'].includes(this.printFontInput.value)) {
      this.printFontMenu.value = this.printFontInput.value;
    } else {
      this.printFontMenu.value = 'other';
    }
  }
}

/**
 * Given an img element, make it point to a QR code for the
 * given URL. Set the size (width, height) of the image to
 * dim
 */
Exolve.prototype.makeQRCodeImg = function(img, url, dim) {
  const payload = encodeURI(url.trim());
  const qrAPI = "https://quickchart.io/qr?size=" + dim + "&text=" + payload;
  img.setAttributeNS(null, 'width', dim);
  img.setAttributeNS(null, 'height', dim);
  img.setAttributeNS(null, 'src', qrAPI);
}

Exolve.prototype.qrRefresher = function() {
  if (!this.qrCheckbox.checked) {
    this.qrPanel.style.display = 'none';
    return;
  }
  this.qrPanel.style.display = '';
  this.makeQRCodeImg(this.qrImg, this.qrData.value, this.qrSize.value);
  this.qrCTA.innerHTML = this.qrCTAInput.value;
}

Exolve.prototype.qrUrlImgsReady = function() {
  if (!this.qrUrlImgs || this.qrUrlImgs.length == 0) {
    return false;
  }
  for (const img of this.qrUrlImgs) {
    if (!img.complete) return false;
  }
  return true;
}

Exolve.prototype.qrUrlsRefresher = function() {
  if (!this.qrUrlsCheckbox.checked) {
    this.qrUrlsPanel.style.display = 'none';
    return;
  }
  if (!this.qrUrlImgs) {
    this.qrUrlImgs = [];
    const links = this.explanations.getElementsByTagName('a');
    if (links.length > 0) {
      const linksTR = document.createElement('tr');
      this.qrUrlsTable.appendChild(linksTR);
      for (let i = 0; i < links.length; i++) {
        const iPlus1 = i + 1;
        const linkName = 'Link-' + iPlus1;
        const link = links[i];
        const href = link.href;
        const img = document.createElement('img');
        this.makeQRCodeImg(img, href, 96);
        const td = document.createElement('td');
        td.insertAdjacentElement('beforeend', img);
        td.insertAdjacentHTML('beforeend', '<br><center>' + linkName + '</center>');
        linksTR.insertAdjacentElement('beforeend', td);
        this.qrUrlImgs.push(img);
      }
    }
  }
  this.qrUrlsPanel.style.display = '';
}

Exolve.prototype.makeQRsInExplanations = function() {
  if (!this.qrUrlImgs || this.qrUrlImgs.length == 0) {
    return;
  }
  const links = this.explanations.getElementsByTagName('a');
  for (let i = 0; i < links.length; i++) {
    const iPlus1 = i + 1;
    const linkName = 'Link-' + iPlus1;
    const link = links[i];
    link.insertAdjacentHTML('afterend', `<sup>${linkName}</sup>`);
  }
  this.explanations.insertAdjacentHTML(
      'beforeend',
      `<b>${this.textLabels['print-url-qrcodes-heading']}</b><br>`);
  const par = this.qrUrlsTable.parentElement;
  const sib = this.qrUrlsTable.nextSibling;
  this.printingChanges.moves.push(
      {'elem': this.qrUrlsTable, 'target': par, 'sibling': sib});
  this.explanations.insertAdjacentElement('beforeend', this.qrUrlsTable);
}

Exolve.prototype.getPrintSettings = function() {
  const pageSizeElt = document.getElementById(this.prefix + '-page-size');
  const pageMarginsElt = document.getElementById(this.prefix + '-page-margins');

  const margins = [0, 0, 0, 0];
  const marginStrs = pageMarginsElt.value.trim().split(/\s+/);
  for (let i = 0; i < 4; i++) {
    if (i >= marginStrs.length) break;
    const val = parseFloat(marginStrs[i]);
    if (!isNaN(val) && val >= 0.0) margins[i] = val;
  }
  for (i = marginStrs.length; i < 4; i++) {
    if ((i - 2) >= 0) margins[i] = margins[i - 2];
    else if ((i - 1) >= 0) margins[i] = margins[i - 1];
  }

  const page = (pageSizeElt ? pageSizeElt.value : 'letter') || 'letter';

  const widthIn = ((page == 'letter' || page == 'legal') ? 8.5 :
                  ((page == '6in 9in') ? 6.0 :
                  ((page == 'A4') ? 210.0/25.4 :
                  ((page == 'A3') ? 297.0/25.4 :
                  ((page == 'A5') ? 148.0/25.4 :
                  ((page == 'B5') ? 176.0/25.4 :
                  ((page == 'B4') ? 250.0/25.4 :
                  ((page == 'ledger') ? 11.0 : 8.5))))))));
  const heightIn = ((page == 'letter') ? 11.0 :
                   ((page == '6in 9in') ? 9.0 :
                   ((page == 'A4') ? 297.0/25.4 :
                   ((page == 'A3') ? 420.0/25.4 :
                   ((page == 'A5') ? 210.0/25.4 :
                   ((page == 'B5') ? 250.0/25.4 :
                   ((page == 'B4') ? 353.0/25.4 :
                   ((page == 'legal') ? 14.0 :
                   ((page == 'ledger') ? 17.0 : 11.0)))))))));
  const font = this.parseFontSize(
      (this.printFontInput ? this.printFontInput.value : '18px') || '18px');

  const scope = document.getElementById(this.prefix + '-print-scope').value;
  const inksaver = document.getElementById(this.prefix + '-print-inksaver').checked;
  const pTitle = document.getElementById(this.prefix + '-print-title');
  const pSetter = document.getElementById(this.prefix + '-print-setter');
  const pPreamble = document.getElementById(this.prefix + '-print-preamble');
  const pExplanations = document.getElementById(this.prefix + '-print-explanations');
  const pCopyright = document.getElementById(this.prefix + '-print-copyright');
  const pQuestions = document.getElementById(this.prefix + '-print-questions');
  const pHeader = document.getElementById(this.prefix + '-print-header');
  const pFooter = document.getElementById(this.prefix + '-print-footer');
  const pGridScale = document.getElementById(this.prefix + '-print-grid-scale');
  const onlyCrossword = this.printOnlyCrossword || false;
  return {
    scope: scope,
    page: page,
    font: font,
    onlyCrossword: onlyCrossword,
    margins: margins,
    pageWidthIn: widthIn,
    pageHeightIn: heightIn,
    gridScale: pGridScale.value,
    title: pTitle.checked,
    setter: pSetter.checked,
    preamble: pPreamble.checked,
    explanations: pExplanations.checked,
    copyright: pCopyright.checked,
    questions: pQuestions.checked,
    inksaver: inksaver,
    header: pHeader.value.trim(),
    footer: pFooter.value.trim(),
    qr: this.qrCheckbox.checked && this.qrImg.complete,
    qrUrls: this.qrUrlsCheckbox.checked && this.qrUrlImgsReady(),
  };
}

Exolve.prototype.changeBG = function(color) {
  if (this.layers3d > 1) {
    for (const g of this.background.children) {
      for (const rect of g.children) {
        rect.style.fill = color;
      }
    }
  } else {
    this.background.style.fill = color;
  }
}

Exolve.prototype.hideEltBeforePrint = function(elt) {
  const display = elt.style.display;
  if (!this.printingChanges.hiddenDisplays[display]) {
      this.printingChanges.hiddenDisplays[display] = [];
  }
  this.printingChanges.hiddenDisplays[display].push(elt);
  elt.style.display = 'none';
}

Exolve.prototype.handleBeforePrint = function() {
  if (this.printAsIs) {
    return;
  }
  /**
   * If some other crossword on this same web page is trying to get printed
   * with printOnlyCrossword=true or printAsIs=true, then bail out.
   */
  for (let id in exolvePuzzles) {
    const other = exolvePuzzles[id];
    if (typeof other === 'object' && other !== null &&
        other.id && other.id != this.id &&
        (other.printOnlyCrossword || other.printAsIs)) {
      return;
    }
  }

  this.printingChanges = {
    currRow: this.currRow, currCol: this.currCol,
    usingGnav: this.usingGnav, currClueIndex: this.currClueIndex,
    currDir: this.currDir,
    pageYOffset: window.pageYOffset,
    extras: [],
    moves: [],
    hiddenDisplays: {},
    inksaver: false,
    explnHtml: null,
  };
  // Unhighlight current cell/clue (handleAfterPrint() will restore).
  this.deactivator();

  const settings = this.getPrintSettings();

  /**
   * When onlyClues is true, we do not print the grid, and we print
   * the clues in two columns, one for Across and one for Down + any other.
   */
  const onlyClues = (settings.scope == 'only-clues');
  const onlyGrid = (settings.scope == 'only-grid');
  const allInScope = (settings.scope == 'all');

  if (settings.onlyCrossword) {
    /**
     * Note: prior to v1.42, the code used to move all body children
     * into the "hider" element. But this somehow caused problems with
     * the exolve stylesheet in "widgets". Now we only move non-element
     * non-script/link nodes. Element nodes directly get their style.display
     * set to none.
     */
    const puzSibling = this.frame.nextSibling;
    const puzParent = this.frame.parentNode;
    document.body.insertAdjacentElement('afterbegin', this.frame);
    this.printingChanges.moves.push(
        {'elem': this.frame, 'target': puzParent, 'sibling': puzSibling});

    const hider = document.createElement('div');
    hider.className = 'xlv-dont-print';
    const topNonEltNodes = [];
    for (let i = 0; i < document.body.childNodes.length; i++) {
      const node = document.body.childNodes[i];
      if (node.nodeType == Node.ELEMENT_NODE) {
        if (node.nodeName == 'LINK' || node.nodeName == 'SCRIPT') continue;
        if (node.isSameNode(this.frame)) continue;
        this.hideEltBeforePrint(node);
        continue;
      }
      topNonEltNodes.push({'node': node, 'sibling': node.nextSibling});
    }
    // topNonEltNodes[] is not a live list, unlike d.b.childNodes[]
    for (let nodeSib of topNonEltNodes) {
      hider.insertBefore(nodeSib.node, null);
      this.printingChanges.moves.push(
          {'elem': nodeSib.node, 'target': document.body, 'sibling': nodeSib.sibling});
    }
    document.body.insertAdjacentElement('beforeend', hider);
    this.printingChanges.extras.push(hider);

    const customStyles = document.createElement('style');
    customStyles.insertAdjacentHTML('beforeend', `
    body {
      background: none !important;
    }
    #${this.prefix}-frame {
      position: absolute;
      left: 0;
      top: 0;
    }
    `);
    this.frame.appendChild(customStyles);
    this.printingChanges.extras.push(customStyles);
  }

  if (this.copyright) {
    const par = this.copyrightElt.parentElement;
    const sibling = this.copyrightElt.nextSibling;
    const moveTo = onlyGrid ? this.gridParent : this.controlsEtc;
    moveTo.insertAdjacentElement('afterbegin', this.copyrightElt);
    this.printingChanges.moves.push(
        {'elem': this.copyrightElt, 'target': par, 'sibling': sibling});
  }

  if (settings.header) {
    const header = document.createElement('div');
    header.innerHTML = settings.header;
    this.frame.insertAdjacentElement('afterbegin', header);
    this.printingChanges.extras.push(header);
  }
  if (settings.footer) {
    const footer = document.createElement('div');
    footer.innerHTML = settings.footer;
    this.frame.insertAdjacentElement('beforeend', footer);
    this.printingChanges.extras.push(footer);
  }
  if (!settings.title) {
    this.hideEltBeforePrint(this.titleElt);
  }
  if (!settings.setter) {
    this.hideEltBeforePrint(this.setterElt);
  }
  if (!settings.preamble) {
    this.hideEltBeforePrint(this.preambleElt);
  }
  if (!settings.explanations) {
    this.hideEltBeforePrint(this.explanations);
  }
  if (!settings.copyright) {
    this.hideEltBeforePrint(this.copyrightElt);
  }
  if (!settings.questions) {
    this.hideEltBeforePrint(this.questions);
  }
  if (onlyGrid) {
    this.hideEltBeforePrint(this.cluesContainer);
  } else if (onlyClues) {
    this.hideEltBeforePrint(this.gridParent);
  }

  if (settings.qr) {
    const par = this.qrTable.parentElement;
    const sib = this.qrTable.nextSibling;
    this.printingChanges.moves.push(
        {'elem': this.qrTable, 'target': par, 'sibling': sib});
    const qrHeight = this.qrTable.clientHeight + 'px';
    const container = document.createElement('div');
    container.style.position = 'fixed';
    if (this.qrLocation.value == 'bottom-right') {
      container.style.right = 0;
    } else if (this.qrLocation.value == 'bottom-left') {
      container.style.left = 0;
    }
    container.style.bottom = 0;
    container.style.minHeight = qrHeight;
    this.frame.insertAdjacentElement('beforeend', container);
    this.printingChanges.extras.push(container);
    container.insertAdjacentElement('afterbegin', this.qrTable);
  }
  if (settings.explanations && settings.qrUrls) {
    this.printingChanges.explnHtml = this.explanations.innerHTML;
    this.makeQRsInExplanations();
  }
  if (settings.inksaver) {
    this.printingChanges.inksaver = true;
    const defs = document.createElementNS(
        'http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
    <pattern id="shading" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect stroke="${this.colorScheme['background']}" fill="none"
        stroke-width="1" x="0" y="0" width="4" height="4"/>
    </pattern>
    `;
    this.svg.insertAdjacentElement('afterbegin', defs);
    this.printingChanges.extras.push(defs);
    this.changeBG('url(#shading)');
  }

  let zoomPerc = 100;
  const pageIn = settings.pageWidthIn -
    (settings.margins[1] + settings.margins[3]);
  if (pageIn <= 7) {
    /* Without this, Chrome does not fit page correctly. */
    zoomPerc = 70;
  }

  const customStyles = document.createElement('style');
  customStyles.innerHTML = `
  @page {
    size: ${settings.page};
    margin: ${settings.margins[0]}in ${settings.margins[1]}in ${settings.margins[2]}in ${settings.margins[3]}in;
  }
  @media all {
    body {
      zoom: ${zoomPerc}%;
      margin: 0;
    }
    #${this.prefix}-frame {
      width: 992px;
    }
    #${this.prefix}-frame .xlv-preamble {
      margin: 8px 0 20px;
    }
    #${this.prefix}-frame .xlv-clues {
      padding-bottom: 0;
      margin-bottom: 0;
    }
    #${this.prefix}-frame div,
    #${this.prefix}-frame table {
      color: black;
      font-size: ${settings.font.str};
    }
    #${this.prefix}-frame .xlv-title {
      font-size: ${settings.font.number * 1.5}${settings.font.unit};
    }
    #${this.prefix}-frame .xlv-anno-text {
      font-size: ${settings.font.number * 0.75}${settings.font.unit} !important;
    }
    #${this.prefix}-frame .xlv-copyright {
      font-size: ${settings.font.number * 0.625}${settings.font.unit} !important;
    }
    .xlv-button,
    .xlv-clear-area,
    .xlv-controls,
    .xlv-dont-print,
    .xlv-postscript,
    .xlv-saving,
    .xlv-small-button,
    .xlv-frame .xlv-small-button,
    .xlv-small-print,
    .xlv-submit,
    .xlv-status {
      display: none;
    }
    #${this.prefix}-frame .xlv-clues-box {
      max-height: none !important;
    }
    #${this.prefix}-frame .xlv-clues-panel {
      margin-right: 0;
    }
    .xlv-coloured-cell, .xlv-clues {
      color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .xlv-print-break {
      page-break-after: always;
      break-after: page;
      page-break-inside: unset;
      break-inside: unset;
    }
  }
  `;
  this.frame.appendChild(customStyles);
  this.printingChanges.extras.push(customStyles);

  let threeColumns = false;
  if (this.numCellsToFill == this.numCellsFilled) {
    if (this.printCompleted3Cols && allInScope) {
      threeColumns = true;
    }
  } else {
    if (!this.printIncomplete2Cols && allInScope) {
      threeColumns = true;
    }
  }
  if (onlyGrid) {
    this.printOnlyGrid(settings);
  } else if (threeColumns) {
    this.printThreeColumns(settings);
  } else {
    this.printTwoColumns(settings);
  }
}

Exolve.prototype.addPrintedCluesTable = function(elem, width, num) {
  const box = document.createElement('div');
  box.className = 'xlv-clues-box';
  box.style.width = width + 'px'
  const table = document.createElement('table');
  table.className = 'xlv-clues-table';
  table.id = this.prefix + '-printed-clues-table-' + num;
  box.appendChild(table);
  elem.insertAdjacentElement('beforeend', box);
  return table;
}

Exolve.prototype.printOnlyGrid = function(settings) {
  const GRID_WIDTH = 1.5 * 488;

  const svgWidth = this.boxW + (2 * this.offsetLeft)
  const svgHeight = this.boxH + (2 * this.offsetTop)
  const goodGridDim = GRID_WIDTH;
  const scale = settings.gridScale ? settings.gridScale :
      Math.min(1.75, goodGridDim / svgWidth);
  const scaledW = svgWidth * scale;
  const scaledH = svgHeight * scale;

  const bPos = this.frame.getBoundingClientRect();
  const left = 0.5 * (scale - 1) * svgWidth;

  const customStyles = document.createElement('style');
  customStyles.innerHTML = `
  #${this.prefix}-grid-panel {
    width: 100%;
  }
  #${this.prefix}-grid-parent {
    transform: translate(-${left}px,0) scale(${scale});
    transform-origin: top left;
  }
  #${this.prefix}-grid-parent-centerer {
    height: ${'' + scaledH + 'px'};
    text-align: center;
  }
  #${this.prefix}-frame .xlv-questions,
  #${this.prefix}-frame .xlv-explanations {
    width: ${bPos.width}px;
  }
  #${this.prefix}-frame .xlv-copyright {
    position: absolute;
    right: 0;
    bottom: -16px;
  }
  `;
  this.frame.appendChild(customStyles);
  this.printingChanges.extras.push(customStyles);
}

Exolve.prototype.printTwoColumns = function(settings) {
  const COLUMN_WIDTH = 488;
  const COLUMN_SEP = 16;
  console.assert(COLUMN_SEP + (2 * COLUMN_WIDTH) == 992);

  const onlyClues = (settings.scope == 'only-clues');

  const svgWidth = this.boxW + (2 * this.offsetLeft)
  const svgHeight = this.boxH + (2 * this.offsetTop)
  const goodGridDim = COLUMN_WIDTH;
  const scale = settings.gridScale ? settings.gridScale :
      Math.min(1.75, goodGridDim / svgWidth);
  const scaledH = onlyClues ? 0 : (svgHeight * scale);

  const customStyles = document.createElement('style');
  customStyles.innerHTML = `
  #${this.prefix}-grid {
    transform: scale(${scale});
    transform-origin: top left;
  }
  #${this.prefix}-grid-parent-centerer {
    text-align: left;
    height: ${'' + scaledH + 'px'};
  }
  #${this.prefix}-frame .xlv-wide-box {
    width: ${COLUMN_WIDTH}px;
  }
  #${this.prefix}-frame .xlv-clues,
  #${this.prefix}-frame .xlv-clues-flex {
    display: block;
  }
  `;
  this.frame.appendChild(customStyles);
  this.printingChanges.extras.push(customStyles);

  const controlsEtcH = this.controlsEtc.clientHeight;

  // We need to apply the print media style, with an additional 2-col
  // grid layout. We'll then measure clue row heights and balance
  // them across 2 columns.
  const customStyles2 = document.createElement('style');
  let customStyles2HTML = `
  #${this.prefix}-frame .xlv-grid-and-clues-flex {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: ${COLUMN_SEP}px;
    grid-template-rows: ${scaledH + controlsEtcH}px max-content;
    row-gap: ${COLUMN_SEP}px;
  }
  #${this.prefix}-frame .xlv-grid-panel {
    grid-row-start: 1;
    grid-row-end: 2;
    grid-column-start: 1;
    grid-column-end: 2;
    padding: 0;
  }
  #${this.prefix}-clues {
    grid-row-start: 1;
    grid-row-end: 3;
    grid-column-start: 2;
    grid-column-end: 3;
  }
  #${this.prefix}-printed-clues-1 {
    grid-row-start: ${onlyClues ? 1 : 2};
    grid-row-end: 3;
    grid-column-start: 1;
    grid-column-end: 2;
  }
  `;
  customStyles2.innerHTML = customStyles2HTML;
  this.frame.appendChild(customStyles2);
  this.printingChanges.extras.push(customStyles2);

  this.recolourCells(scale);
  this.redisplayNinas(scale)

  let extraTableNum = 1;

  // Extra clues column in the first column.
  const printedClues1 = document.createElement("div");
  printedClues1.id = `${this.prefix}-printed-clues-1` 
  printedClues1.className = 'xlv-clues xlv-clues-panel';
  let printedTable1 = this.addPrintedCluesTable(
      printedClues1, COLUMN_WIDTH, extraTableNum++);
  this.gridcluesContainer.appendChild(printedClues1);

  this.equalizeClueWidths(COLUMN_WIDTH);
  this.printingChanges.extras.push(printedClues1);

  const cluesPanels = this.frame.getElementsByClassName('xlv-clues-panel');
  const cluesTables = [];
  const clues = [];

  let minH = 1000;
  let h = 0;
  let firstDownClue = -1;
  for (let p = 0; p < cluesPanels.length; p++) {
    const cluesPanel = cluesPanels[p];
    cluesTables.push(null);
    const heading = cluesPanel.firstElementChild;
    if (!heading || cluesPanel.children.length != 2 ||
        !cluesPanel.children[1].firstElementChild) {
      continue;
    }
    const cluesTable = cluesPanel.children[1].firstElementChild;
    cluesTables[p] = cluesTable;
    const clueTRs = cluesTable.getElementsByTagName("tr");

    if (this.hasDownClues && cluesTable == this.downClues) {
      firstDownClue = clues.length;
    }

    for (let c = 0; c < clueTRs.length; c++) {
      const clue = {
        'tr': clueTRs[c],
        'p': p,
        'c': c,
        'heading': (c == 0) ? heading : null
      };
      let ch = clue.tr.getBoundingClientRect().height;
      if (ch < minH) minH = ch;
      h += ch;
      if (c == 0) {
        h += heading.getBoundingClientRect().height;
      }
      clue.h = h;
      clues.push(clue);
    }
  }

  const gridPanelH = this.gridPanel.getBoundingClientRect().height;
  let best1end = 0;
  let bestGap = 1000;
  for (let i = 0; i < clues.length; i++) {
    const h1 = clues[i].h;
    const h2 = h - clues[i].h;
    let gap = h1 + gridPanelH - h2;
    if (gap > bestGap) break;
    gap = Math.abs(gap);
    if (gap < bestGap) {
      bestGap = gap;
      best1end = i + 1;
    }
  }

  if (onlyClues && firstDownClue >= 0) {
    /* Forget balancing, move Down clues to top */
    best1end = firstDownClue;
  }

  // Move clue #s [0, best1end) to the first column.
  for (let c = 0; c < best1end; c++) {
    const clue = clues[c];
    if (clue.heading) {
      this.printingChanges.moves.push(
          {'target': cluesPanels[clue.p], 'elem': clue.heading,
            'sibling': clue.heading.nextSibling});
      if (printedTable1.children.length > 0) {
        printedTable1 = this.addPrintedCluesTable(printedClues1,
            COLUMN_WIDTH, extraTableNum++);
      }
      printedTable1.insertAdjacentElement('beforebegin', clue.heading);
    }
    this.printingChanges.moves.push(
        {'target': cluesTables[clue.p], 'elem': clue.tr,
          'sibling': clue.tr.nextSibling});
    printedTable1.insertAdjacentElement('beforeend', clue.tr);
  }

  // Hide emptied clue panels.
  for (let p = 0; p < cluesPanels.length; p++) {
    const cluesTable = cluesTables[p];
    if (!cluesTable) continue;
    const clueTRs = cluesTable.getElementsByTagName("tr");
    if (clueTRs.length > 0) continue;
    this.hideEltBeforePrint(cluesPanels[p]);
  }

  this.paginate(settings);
}

Exolve.prototype.printThreeColumns = function(settings) {
  /**
   * Note that this is never used when only-{grid,clues} options are set.
   */
  const COLUMN_WIDTH = 320;
  const COLUMN_SEP = 16;
  console.assert((2 * COLUMN_SEP) + (3 * COLUMN_WIDTH) == 992);

  const svgWidth = this.boxW + (2 * this.offsetLeft)
  const svgHeight = this.boxH + (2 * this.offsetTop)
  const goodGridDim = COLUMN_SEP + 2 * COLUMN_WIDTH;
  const scale = settings.gridScale ? settings.gridScale :
      Math.min(1.75, goodGridDim / svgWidth);
  const scaledH = svgHeight * scale;

  const customStyles = document.createElement('style');
  customStyles.innerHTML = `
  #${this.prefix}-grid-parent-centerer {
    text-align: left;
    height: ${'' + scaledH + 'px'};
  }
  #${this.prefix}-grid {
    transform: scale(${scale});
    transform-origin: top left;
  }
  #${this.prefix}-frame .xlv-wide-box {
    width: ${COLUMN_SEP + (2 * COLUMN_WIDTH)}px;
  }
  #${this.prefix}-frame .xlv-clues,
  #${this.prefix}-frame .xlv-clues-flex {
    display: block;
  }
  `;
  this.frame.appendChild(customStyles);

  const controlsEtcH = this.controlsEtc.clientHeight;

  // We need to apply the print media style, with an additional 3-col
  // grid layout. We'll then measure clue row heights and balance
  // them across 3 columns.
  const customStyles2 = document.createElement('style');
  customStyles2.innerHTML = `
  #${this.prefix}-frame .xlv-grid-and-clues-flex {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    column-gap: ${COLUMN_SEP}px;
    grid-template-rows: ${scaledH + controlsEtcH}px max-content;
    row-gap: ${COLUMN_SEP}px;
  }
  #${this.prefix}-frame .xlv-grid-panel {
    grid-row-start: 1;
    grid-row-end: 2;
    grid-column-start: 1;
    grid-column-end: 3;
    padding: 0;
  }
  #${this.prefix}-clues {
    grid-row-start: 1;
    grid-row-end: 3;
    grid-column-start: 3;
    grid-column-end: 4;
  }
  #${this.prefix}-printed-clues-1 {
    grid-row-start: 2;
    grid-row-end: 3;
    grid-column-start: 1;
    grid-column-end: 2;
  }
  #${this.prefix}-printed-clues-2 {
    grid-row-start: 2;
    grid-row-end: 3;
    grid-column-start: 2;
    grid-column-end: 3;
  }
  `;
  this.frame.appendChild(customStyles2);

  this.recolourCells(scale);
  this.redisplayNinas(scale)

  let extraTableNum = 1;

  // Extra clues column in the first column.
  const printedClues1 = document.createElement("div");
  printedClues1.id = `${this.prefix}-printed-clues-1` 
  printedClues1.className = 'xlv-clues xlv-clues-panel';
  let printedTable1 = this.addPrintedCluesTable(
      printedClues1, COLUMN_WIDTH, extraTableNum++);
  this.gridcluesContainer.appendChild(printedClues1);

  // Extra clues column in the second column.
  const printedClues2 = document.createElement("div");
  printedClues2.id = `${this.prefix}-printed-clues-2` 
  printedClues2.className = 'xlv-clues xlv-clues-panel';
  let printedTable2 = this.addPrintedCluesTable(
      printedClues2, COLUMN_WIDTH, extraTableNum++);
  this.gridcluesContainer.appendChild(printedClues2);

  this.equalizeClueWidths(COLUMN_WIDTH);
  this.printingChanges.extras.push(printedClues1, printedClues2, customStyles, customStyles2);

  const cluesPanels = this.frame.getElementsByClassName('xlv-clues-panel');
  const cluesTables = [];
  const clues = [];

  let minH = 1000;
  let h = 0;
  for (let p = 0; p < cluesPanels.length; p++) {
    const cluesPanel = cluesPanels[p];
    cluesTables.push(null);
    const heading = cluesPanel.firstElementChild;
    if (!heading || cluesPanel.children.length != 2 ||
        !cluesPanel.children[1].firstElementChild) {
      continue;
    }
    const cluesTable = cluesPanel.children[1].firstElementChild;
    cluesTables[p] = cluesTable;
    const clueTRs = cluesTable.getElementsByTagName("tr");

    for (let c = 0; c < clueTRs.length; c++) {
      const clue = {
        'tr': clueTRs[c],
        'p': p,
        'c': c,
        'heading': (c == 0) ? heading : null
      };
      let ch = clue.tr.getBoundingClientRect().height;
      if (ch < minH) minH = ch;
      h += ch;
      if (c == 0) {
        h += heading.getBoundingClientRect().height;
      }
      clue.h = h;
      clues.push(clue);
    }
  }

  const gridPanelH = this.gridPanel.getBoundingClientRect().height;
  let best1end = 0;
  let best2end = 0;
  let bestGap = 1000;
  for (let i = 0; i < clues.length; i++) {
    const h1 = clues[i].h;
    for (let j = i + 1; j < clues.length; j++) {
      const h2 = clues[j].h - clues[i].h;
      const gap12 = Math.abs(h2 - h1);
      const h3 = h - clues[j].h;
      const gap13 = Math.abs(h1 + gridPanelH - h3);
      const gap23 = Math.abs(h2 + gridPanelH - h3);
      const gap = gap12 + gap23 + gap13;
      if (gap < bestGap) {
        bestGap = gap;
        best1end = i + 1;
        best2end = j + 1;
      }
    }
  }

  // Move clue #s [0, best1end) to the first column and
  // [best1end, best2end) to the second column.
  for (let c = 0; c < best2end; c++) {
    const clue = clues[c];
    let tableDest = (c < best1end) ? printedTable1 : printedTable2;
    if (clue.heading) {
      this.printingChanges.moves.push(
          {'target': cluesPanels[clue.p], 'elem': clue.heading,
           'sibling': clue.heading.nextSibling});
      if (tableDest.children.length > 0) {
        const cluesDest = (c < best1end) ? printedClues1 : printedClues2;
        tableDest = this.addPrintedCluesTable(cluesDest, COLUMN_WIDTH,
            extraTableNum++);
        if (c < best1end) {
          printedTable1 = tableDest;
        } else {
          printedTable2 = tableDest;
        }
      }
      tableDest.insertAdjacentElement('beforebegin', clue.heading);
    }
    this.printingChanges.moves.push(
        {'target': cluesTables[clue.p], 'elem': clue.tr,
         'sibling': clue.tr.nextSibling});
    tableDest.insertAdjacentElement('beforeend', clue.tr);
  }

  // Hide emptied clue panels.
  for (let p = 0; p < cluesPanels.length; p++) {
    const cluesTable = cluesTables[p];
    if (!cluesTable) continue;
    const clueTRs = cluesTable.getElementsByTagName("tr");
    if (clueTRs.length > 0) continue;
    this.hideEltBeforePrint(cluesPanels[p]);
  }

  this.paginate(settings);
}

Exolve.prototype.paginate = function(settings) {
  const outerBox = this.frame.getBoundingClientRect();
  const bodyBox = document.body.getBoundingClientRect();
  if (outerBox.top - bodyBox.top > 5 || outerBox.left - bodyBox.left > 5) {
    // Not much point trying to paginate.
    return;
  }

  let whRatio = 1.0;
  const marginV = settings.margins[0] + settings.margins[2];
  const marginH = settings.margins[1] + settings.margins[3];
  if (settings.pageWidthIn > marginH && settings.pageHeightIn > marginV) {
    whRatio = ((settings.pageWidthIn - marginH) /
               (settings.pageHeightIn - marginV));
  }

  const pageHeight = Math.floor(outerBox.width / whRatio);
  const cluesPanels = this.frame.getElementsByClassName('xlv-clues-panel');

  const getBreaker = () => {
    const breaker = document.createElement('div');
    breaker.innerHTML = '&nbsp;';
    breaker.className = 'xlv-print-break';
    return breaker;
  };

  /**
   * Figure out which clues to insert page-breaks before.
   */
  const breakBefores = [];

  for (let p = 0; p < cluesPanels.length; p++) {
    const clueTRs = cluesPanels[p].getElementsByTagName("tr");
    let lastBottom = 0;
    for (let c = 0; c < clueTRs.length; c++) {
      const box = clueTRs[c].getBoundingClientRect();
      const bottom = (box.top - outerBox.top) + box.height;
      if (c > 0 && lastBottom < pageHeight && bottom > pageHeight) {
        breakBefores.push([clueTRs[c], Math.ceil(pageHeight - lastBottom)]);
      }
      lastBottom = bottom;
    }
  }
  for (let eh of breakBefores) {
    const breaker = getBreaker();
    breaker.style.height = '' + eh[1] + 'px';
    eh[0].insertAdjacentElement('beforebegin', breaker);
    this.printingChanges.extras.push(breaker);
  }
}

/**
 * This can be called without an instance, i.e., like:
 *   Exolve.prototype.fileDownload(...);
 */
Exolve.prototype.fileDownload = function(data, contentType, fileName) {
  const blob = new Blob([data], {type: contentType});

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

Exolve.prototype.saveGridSvgFile = function(fname) {
  const clone = this.svg.cloneNode(true);

  /* Capture colours as SVG rects. Hacky. */
  for (const g of [this.ninaGroup, this.colourGroup]) {
    if (g.style.display == 'none') {
      continue;
    }
    for (const r of g.children) {
      const x = parseFloat(r.style.left);
      const y = parseFloat(r.style.top);
      const w = parseFloat(r.style.width);
      const h = parseFloat(r.style.height);
      const colour = r.style.backgroundColor;
      const rect = this.makeRect(x, y, w, h, colour);
      rect.setAttributeNS(null, 'class', 'xlv-coloured-cell');
      if (r.style.transform) {
        rect.style.transform = r.style.transform;
      }
      clone.insertAdjacentElement('beforeend', rect);
    }
  }

  /**
   * The following is also a bit hacky, but not worth reproducing
   * the entire stylesheet for this obscure feature.
   */
  const styleHeader = '' +
  `<style>
  .xlv-cell-num,
  .xlv-cell-text {
    font-family: sans-serif;
  }
  .xlv-cell-circle {
    fill: rgba(0,0,0,0.0);
  }
  .xlv-coloured-cell {
    fill-opacity: 0.25;
    transform-box: fill-box;
  }
  </style>
  `;

  clone.insertAdjacentHTML('afterbegin', styleHeader);
  const svgString = new XMLSerializer().serializeToString(clone);
  this.fileDownload(svgString, 'image/svg+xml', fname);
}

Exolve.prototype.printGridSvg = function() {
  const fname = document.getElementById(
      this.prefix + '-print-grid-svg-file-name').value.trim();
  if (!fname) {
    alert('Please provide a non-blank file name');
    return;
  }
  this.saveGridSvgFile(fname);
}

Exolve.prototype.javaHash = function(arr) {
  const str = arr.join(' ');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

Exolve.prototype.createIdIfNeeded = function() {
  if (!this.id) {
    const idHashFodders = [];
    for (let r = 0; r < this.gridHeight; r++) {
      let rowstr = '';
      for (let c = 0; c < this.gridWidth; c++) {
        const gridCell = this.grid[r][c];
        rowstr += gridCell.isLight ? '0' : '.';
        if (gridCell.hasBarAfter) rowstr += '|';
        if (gridCell.hasBarUnder) rowstr += '_';
        if (gridCell.isDiagramless) rowstr += '*';
      }
      idHashFodders.push(rowstr);
    }
    for (const ci of this.allClueIndices) {
      const clue = this.clues[ci];
      let label = ci;
      if (clue.childrenClueIndices && clue.childrenClueIndices.length > 0) {
        label += ',' + clue.childrenClueIndices.join(',');
      }
      idHashFodders.push(label + ' ' + clue.clue);
    }
    const hash = this.javaHash(idHashFodders);
    this.id = `xlv-#${hash.toString(36)}`;
  }
  if (exolvePuzzles[this.id]) {
    this.throwErr('Puzzle id ' + this.id + ' is already in use');
  }
  exolvePuzzles[this.id] = this;
  document.getElementById(this.prefix + '-id-span').innerText = this.id;
}

Exolve.prototype.createPuzzle = function() {
  this.init()
  this.createListeners();

  this.parseAndDisplayPrelude()
  this.parseAndDisplayExplanations()
  this.parseAndDisplayMaker()

  this.parseGrid()
  this.markClueStartsUsingGrid()
  this.parseClueLists()

  this.processClueChildren()
  this.clueSolutionsToGridSolutions();

  this.parseAlternatives();

  this.createIdIfNeeded();

  this.finalClueTweaks()
  this.setWordEndsAndHyphens();
  this.setUpGnav()

  this.applyStyles()

  this.redisplayQuestions();
  this.displayClues();

  this.displayGridBackground();
  this.displayGrid();

  if (this.layers3d > 1) {
    this.makeGrid3D();
  }

  /**
   * Now that we know light numbering:
   */
  this.parseColoursNinasEtc();
  this.recolourCells();
  this.redisplayNinas();

  this.displayButtons();
  this.parseAndDisplayPS();
  this.makeNotesPanel();
  this.resizeCurrClueAndControls();
  this.setColumnLayout();

  this.restoreState();
  this.checkConsistency();

  this.bindListeners();

  this.loadWebifi();

  if (this.customizer) {
    this.customizer(this);
  }
}

/**
 * createExolve(puzzleText) is just a convenient wrapper that looks for
 *     the customizeExolve() function.
 * See documentation of parameters above the Exolve constructor definition.
 */
function createExolve(puzzleText, containerId="",
                      provideStateUrl=true, visTop=0, maxDim=0) {
  const customizer = (typeof customizeExolve === 'function') ?
      customizeExolve : null;
  const p = new Exolve(puzzleText, containerId, customizer,
                       provideStateUrl, visTop, maxDim);
  return p;
}

/*
 * The global variable "puzzleText" should have been set to the puzzle specs.
 * @deprecated use createExolve() or the Exolve() constructor.
 */
function createPuzzle() {
  return createExolve(puzzleText, "");
}
