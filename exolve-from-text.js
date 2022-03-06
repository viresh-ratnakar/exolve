/*
MIT License

Copyright (c) 2022 Viresh Ratnakar

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

Version: Exolve v1.31 March 3, 2022
*/

/**
 * exolveFromText() converts lines of text that mainly have the clues,
 * but may optionally have title/byline/preamble before the clues into
 * Exolve. The grid is inferred from clue numbers and enums. The clues
 * sections must have "Across" and "Down" headings. You can typically copy
 * such text from PDFs of crosswords, which is the main use-case enabled by
 * this in exolve-player.
 *
 * You shouldn't use this code to cheat on a crossword that has been presented
 * diagramlessly :-).
 *
 * The return value is an array of possible grids. Each matched grid is returned
 * as an object that looks like: {
 *   'grid': '...',
 *   'exolve': '...',
 * }
 * Here the 'grid' value has just the text lines containing the grid (in
 * Exolve format). The 'exolve' value is the full Exolve-formatted crossword.
 *
 * If a grid could not be inferred, [] is returned.
 *
 * Occasionally, multiple grids may match the pattern implied by the clues. They
 * are all returned in the array.
 *
 * This assumes that the grid is in a standard, blocked, UK-style format:
 *
 * - The grid is symmetric and is derived by blackening some cells in
 *   one of the four possible chequered template starting points.
 * - No light is shorter than 3 letters.
 * - Enums are provided for all clues. The only exception is child clues
 *   in linked groups.
 * - For a linked group of clues, the component lights split the linked
 *   entry at exactly word-breaks or hyphens. Moreover (to keep the
 *   algorithm complexity in check), only one extra word-break/hyphen in the
 *   entry is supported (compared to the number of linked clues).
 */
exolveFromText = function(w, h, text) {
  let sections = {
    title: '',
    setter: '',
    preamble: '',
    copyright: '',
    across: [],
    down: [],
  };
  let seenClues = false;
  let inDown = false;
  const lines = text.split('\n');

  const clueStartRE = /^\s*\d+([ ]*[,&][ ]*[aAdD][^ ]*)*/;
  const clueRE = /^\s*\d+([ ]*[,&][ ]*[aAdD][^ ]*)*.*\([0-9, '-]+\)/;
  const childRE = /^\s*\d+.*see /i;
  const wordsRE = /[a-zA-Z]+/;
  const copyrightRE = /^\s*(copyright|\(c\)|Ⓒ)/i;
  const titleAndSetterRE = /^\s*(.+)\sby\s(.+)/i; 
  const bylineRE = /^\s*(?:(?:set\sby)|(?:by))[^a-zA-Z0-9]*\s([a-zA-Z0-9].+)/i; 
  const acrossRE = /^[^a-zA-Z0-9]*across[^a-zA-Z0-9]*$/i;
  const downRE = /^[^a-zA-Z0-9]*down[^a-zA-Z0-9]*$/i; 

  let joinedLine = '';
  for (let rawLine of lines) {
    const line = rawLine.replace(/\s/g, ' ').replace(/\s+/g, ' ').trim();
    if (seenClues) {
      if (!inDown && downRE.test(line)) {
        inDown = true;
        joinedLine = '';
        continue;
      }
      if (clueRE.test(line) || childRE.test(line)) {
        if (!inDown) sections.across.push(line.trim());
        else sections.down.push(line.trim());
        joinedLine = '';
      } else if (clueStartRE.test(line)) {
        joinedLine = line;
      } else {
        joinedLine = joinedLine + ' ' + line;
        if (clueRE.test(joinedLine) || childRE.test(joinedLine)) {
          if (!inDown) sections.across.push(joinedLine.trim());
          else sections.down.push(joinedLine.trim());
          joinedLine = '';
        }
      }
      continue;
    }
    /* !seenClues */
    if (acrossRE.test(line)) {
      seenClues = true;
      continue;
    }
    const tsMatch = line.match(titleAndSetterRE);
    if (tsMatch && tsMatch.length == 3) {
      sections.title = tsMatch[1].trim();
      if (sections.title.toLowerCase().endsWith(' set')) {
        sections.title = sections.title.substr(0, sections.title.length - 4);
      }
      sections.setter = tsMatch[2].trim();
      continue;
    }
    const byMatch = line.match(bylineRE);
    if (byMatch && byMatch.length == 2) {
      sections.setter = byMatch[1].trim();
      continue;
    }
    if (copyrightRE.test(line)) {
      sections.copyright = line.trim();
      continue;
    }
    if (wordsRE.test(line)) {
      if (!sections.title) {
        sections.title = line.trim();
      } else {
        if (sections.preamble) sections.preamble += ' ';
        sections.preamble += line;
      }
    }
  }
  return exolveFromTextSections(w, h, sections);
}

exolveFromTextSections = function(w, h, sections) {
  if (w <= 0 || h <= 0) {
    console.log('Width and height must both be at least 1');
    return null;
  }
  if (!sections.across || sections.across.length <= 0 ||
      !sections.down || sections.down.length <= 0) {
    console.log('Text has to contain at least one across clue and one down clue');
    return null;
  }
  let specs = '';
  // Create an invisible Exolve puzzle.
  const xlvpid = 'xlvp-from-text-temp';
  document.body.insertAdjacentHTML('beforeend',
      `<div id="${xlvpid}" style="display:none"/>`);
  const div = document.getElementById(xlvpid);

  specs = `
  exolve-begin
    exolve-width: ${w}
    exolve-height: ${h}
  `;
  if (sections.title) {
    specs += `
    exolve-title: ${sections.title}`;
  }
  if (sections.setter) {
    specs += `
    exolve-setter: ${sections.setter}`;
  }
  if (sections.copyright) {
    specs += `
    exolve-copyright: ${sections.copyright}`;
  }
  if (sections.preamble) {
    specs += `
    exolve-preamble:
${sections.preamble}`;
  }
  specs += `
    exolve-across:`;
  for (let acrossClue of sections.across) {
  specs += `
      ${acrossClue}`;
  }
  specs += `
    exolve-down:`;
  for (let downClue of sections.down) {
  specs += `
      ${downClue}`;
  }
  specs += `
    exolve-grid:`;
  let gridSpecLines = '';
  for (let r = 0; r < h; r++) {
    let rowSpec = '';
    for (let c = 0; c < w; c++) {
      rowSpec += '0*';  /* diagramless, so lights are not inferred from grid */
    }
    gridSpecLines += `
      ${rowSpec}`;
  }

  const tempSpecs = specs + gridSpecLines + `
    exolve-option: ignore-unclued ignore-enum-mismatch
    exolve-id: ${xlvpid}
  exolve-end`;

  const puz = new Exolve(tempSpecs, xlvpid, null, false, 0, 0, false);

  const inferrer = new ExolveGridInferrer(puz);
  if (exolvePuzzles && exolvePuzzles[xlvpid]) {
    delete exolvePuzzles[xlvpid];
  }
  div.remove();

  inferrer.grid = new Array(h);
  for (let r = 0; r < h; r++) {
    inferrer.grid[r] = new Array(w);
    for (let c = 0; c < w; c++) {
      inferrer.grid[r][c] = '_';
    }
  }
  maxwh = Math.max(w, h);
  inferrer.lights = [null];
  inferrer.parents = [];
  inferrer.mapped = [null];
  for (let ci of puz.allClueIndices) {
    let clue = puz.clues[ci];
    let num = parseInt(clue.label);
    if (isNaN(num) || num <= 0) {
      console.log('Found non-positive-number clue label: ' + clue.label);
      return null;
    }
    if (inferrer.lights.length <= num) {
      inferrer.lights.length = num + 1;
    }
    if (!inferrer.lights[num]) {
      inferrer.lights[num] = {};
    }
    if (clue.enumLen == 0 && !clue.parentClueIndex) {
      console.log('Found non-linked-child clue without parent: ' + clue.label + clue.dir);
      return null;
    }
    inferrer.lights[num][clue.dir] = {
      label: num,
      dir: clue.dir,
      clue: clue,
      len: 0,
    };
  }
  if (inferrer.lights.length < 2) {
    console.log('Did not find any clues');
    return null;
  }

  for (let i = 1; i < inferrer.lights.length; i++) {
    if (!inferrer.lights[i]) {
      console.log('Found missing clue ' + i);
      return null;
    }
    if (!('A' in inferrer.lights[i]) && !('D' in inferrer.lights[i])) {
      console.log('Found a hole at clue ' + i);
      return null;
    }
    for (let dir of ['A', 'D']) {
      if (!(dir in inferrer.lights[i])) {
        continue;
      }
      const light = inferrer.lights[i][dir];
      if (light.clue.childrenClueIndices && light.clue.childrenClueIndices.length > 0) {
        inferrer.parents.push([i, dir]);
      } else if (!light.clue.parentClueIndex) {
        light.len = light.clue.enumLen;
      }
    }
  }

  const results = [];

  const candidates = inferrer.expandLinkedGroups();

  // Even in chequered templates, sometimes we find grids with a few lights in
  // "non-light" rows/cols. Keep everything blank in the middle 5x5 to find
  // some such grids (the shenanigans are more likely to be near the middle).
  const midClear = 5;
  const midRowStart = Math.floor((h/2) - (midClear/2));
  const midColStart = Math.floor((w/2) - (midClear/2));
  for (let rowpar = 0; rowpar < 2; rowpar++) {
    for (let colpar = 0; colpar < 2; colpar++) {
      for (let candidateBase of candidates) {
        const candidate = candidateBase.clone();
        for (let r = 0; r < h; r++) {
          for (let c = 0; c < w; c++) {
            if (h >= midClear + 2 && w >= midClear + 2 &&
                r >= midRowStart && r < midRowStart + midClear &&
                c >= midColStart && c < midColStart + midClear) {
              continue;
            }
            if (((r % 2) != rowpar) && ((c % 2) != colpar)) {
              candidate.grid[r][c] = '.';
            }
          }
        }
        candidate.infer(results);
      }
    }
  }
  const matches = [];
  for (let inf of results) {
    gridSpecLines = inf.gridSpecLines();
    if (gridSpecLines) {
      matches.push({
        'grid': gridSpecLines,
        'exolve': specs + gridSpecLines + '\n  exolve-end',
      });
    }
  }
  return matches;
}

function ExolveRowCol(w, h) {
  this.w = w;
  this.h = h;
  this.row = 0;
  this.col = 0;
}

ExolveRowCol.prototype.isValid = function() {
  return this.row >= 0 && this.row < this.h &&
         this.col >= 0 && this.col < this.w;
}

ExolveRowCol.prototype.incr = function(delta) {
  this.col += delta;
  if (delta > 0) {
    while (this.col >= this.w) {
      this.row++;
      this.col -= this.w;
    }
  } else if (delta < 0) {
    while (this.col < 0) {
      this.row--;
      this.col += this.w;
    }
  }
}
ExolveRowCol.prototype.clone = function() {
  const copy = new ExolveRowCol(this.w, this.h);
  copy.row = this.row;
  copy.col = this.col;
  return copy;
}
ExolveRowCol.prototype.sym = function() {
  const symcell = new ExolveRowCol(this.w, this.h);
  symcell.row = this.h - 1 - this.row;
  symcell.col = this.w - 1 - this.col;
  return symcell;
}

ExolveRowCol.prototype.isLessThan = function(other) {
  return this.row < other.row ||
         (this.row == other.row && this.col < other.col);
}

/**
 * Captures a candidate inferred grid. Grid entries with '_' have not
 * been decided at any point.
 */
function ExolveGridInferrer(puz) {
  this.puz = puz;
  this.w = puz.gridWidth;
  this.h = puz.gridHeight;
  /* The 'cursor': the next light will be placed at a cell here onwards */
  this.rowcol = new ExolveRowCol(this.w, this.h);

  this.grid = null;
  /* lights[x]['A'/'D'] (for x = 1,2,..) has the specs for that light */
  this.lights = null;
  /* mapped[x] (for x = 1,2,..) is the cell where label x has been placed */
  this.mapped = null;
}

ExolveGridInferrer.prototype.clone = function() {
  const copy = new ExolveGridInferrer(this.puz);
  copy.rowcol.row = this.rowcol.row;
  copy.rowcol.col = this.rowcol.col;
  copy.mapped = this.mapped.slice();
  copy.parents = this.parents;

  copy.grid = new Array(this.h);
  for (let r = 0; r < this.h; r++) {
    copy.grid[r] = this.grid[r].slice();
  }
  copy.lights = new Array(this.lights.length);
  for (let i = 1; i < this.lights.length; i++) {
    copy.lights[i] = {};
    for (let dir of ['A', 'D']) {
      if (dir in this.lights[i]) {
        copy.lights[i][dir] = {};
        for (let k in this.lights[i][dir]) {
          copy.lights[i][dir][k] = this.lights[i][dir][k];
        }
      }
    }
  }
  return copy;
}

ExolveGridInferrer.prototype.canStartA = function(rc) {
  if (!rc.isValid()) {
    return false;
  }
  const gcell = this.grid[rc.row][rc.col];
  if (gcell == '.') {
    return false;
  }
  if ((rc.col == 0 || this.grid[rc.row][rc.col - 1] == '.') &&
      rc.col < rc.w - 1 && this.grid[rc.row][rc.col + 1] != '.') {
    return true;
  }
  return false;
}

ExolveGridInferrer.prototype.canStartD = function(rc) {
  if (!rc.isValid()) {
    return false;
  }
  const gcell = this.grid[rc.row][rc.col];
  if (gcell == '.') {
    return false;
  }
  if ((rc.row == 0 || this.grid[rc.row - 1][rc.col] == '.') &&
      rc.row < rc.h - 1 && this.grid[rc.row + 1][rc.col] != '.') {
    return true;
  }
  return false;
}

ExolveGridInferrer.prototype.canStart = function(rc) {
  if (!rc.isValid()) {
    return false;
  }
  const gcell = this.grid[rc.row][rc.col];
  if (gcell == '.') {
    return false;
  }
  if ((rc.col == 0 || this.grid[rc.row][rc.col - 1] == '.') &&
      rc.col < rc.w - 1 && this.grid[rc.row][rc.col + 1] != '.') {
    return true;
  }
  if ((rc.row == 0 || this.grid[rc.row - 1][rc.col] == '.') &&
      rc.row < rc.h - 1 && this.grid[rc.row + 1][rc.col] != '.') {
    return true;
  }
  return false;
}

ExolveGridInferrer.prototype.isValid = function() {
  for (let par of this.parents) {
    const clue = this.lights[par[0]][par[1]].clue;
    const grp = this.puz.getLinkedClues('' + par[1] + par[0]);
    let tot = 0;
    for (let cci of grp) {
      const light = this.lights[cci.substr(1)][cci.substr(0, 1)];
      if (light.len < 3) {
        return false;
      }
      tot += light.len;
    }
    if (tot != clue.enumLen) {
      return false;
    }
  }
  return true;
}

/**
 * Set entry at rc and its symmetric locaion to letter if possible. Return
 * false if either one is already set to something else.
 */
ExolveGridInferrer.prototype.setGrid = function(rc, letter) {
  if (!rc.isValid()) return false;
  if (this.grid[rc.row][rc.col] != '_' &&
      this.grid[rc.row][rc.col] != letter) {
    return false;
  }
  const sym = rc.sym();
  if (this.grid[sym.row][sym.col] != '_' &&
      this.grid[sym.row][sym.col] != letter) {
    return false;
  }
  this.grid[rc.row][rc.col] = letter;
  this.grid[sym.row][sym.col] = letter;
  return true;
}

/**
 * For each linked group, split total length into chunks at word/hyphen
 * boundaries to infer component lengths. Allow at most one extra chunk,
 * to keep complexity in check.
 */
ExolveGridInferrer.prototype.expandLinkedGroups = function() {
  if (this.parents.length < 1) {
    return [this];
  }
  const choices = [];
  for (let par of this.parents) {
    const clue = this.lights[par[0]][par[1]].clue;
    const phParts = clue.placeholder.split(/[ -]/);
    const grp = this.puz.getLinkedClues('' + par[1] + par[0]);
    if (grp.length > phParts.length) {
      console.log('Clue ' + par[1] + par[0] + ' has ' + grp.length + ' linked parts but enum only has ' + phParts.length);
      return [];
    }
    if (grp.length < phParts.length - 1) {
      console.log('Clue ' + par[1] + par[0] + ' has ' + grp.length + ' linked parts and enum has too many more parts: ' + phParts.length);
      return [];
    }
    const myChoices = [];
    const phPartsLens = [];
    for (let phPart of phParts) phPartsLens.push(phPart.length);
    if (grp.length == phPartsLens.length) {
      myChoices.push(phPartsLens);
    } else {
      console.assert(grp.length == phPartsLens.length - 1, grp.length, phPartsLens.length);
      /* We'll skip one of the boundaries in each split-choice. */
      for (let skip = 1; skip < phPartsLens.length; skip++) {
        const myChoicesEntry = [];
        for (let i = 0; i < phPartsLens.length; i++) {
          if (i == skip - 1) {
            continue;
          } else if (i == skip) {
            myChoicesEntry.push(phPartsLens[i - 1] + phPartsLens[i]);
          } else {
            myChoicesEntry.push(phPartsLens[i]);
          }
        }
        myChoices.push(myChoicesEntry);
      }
    }
    choices.push(myChoices);
  }
  let candidates = [this];
  for (let i = 0; i < this.parents.length; i++) {
    const par = this.parents[i];
    const grp = this.puz.getLinkedClues('' + par[1] + par[0]);
    const updatedCandidates = [];
    for (let choice of choices[i]) {
      let usable = true;
      for (let l of choice) {
        if (l < 3) {
          usable = false;
          break;
        }
      }
      if (!usable) {
        continue;
      }
      for (let cand of candidates) {
        const updatedCand = cand.clone();
        for (let j = 0; j < grp.length; j++) {
          const cci = grp[j];
          const light = updatedCand.lights[cci.substr(1)][cci.substr(0, 1)];
          console.assert(light.len == 0, light);
          light.len = choice[j];
        }
        updatedCandidates.push(updatedCand);
      }
    }
    if (updatedCandidates.length < 1) {
      console.log('No linked group choce available for ' + grp[0]);
      return [];
    }
    candidates = updatedCandidates;
  }
  return candidates;
}

/**
 * Place a light along direction dir at the current this.rowcol cursor, making
 * sure no other light can start at any cell preceding that, starting at
 * cell rowcolStart.
 *
 * Return a new, updated ExolveGridInferrer object or null if there is a
 * conflict.
 */
ExolveGridInferrer.prototype.mapLight = function(dir, len, rowcolStart) {
  if (!this.rowcol.isValid() || len <= 1) {
    return null;
  }
  const mapped = this.clone();
  for (let rowcol = rowcolStart.clone();
       rowcol.isValid() && rowcol.isLessThan(this.rowcol); rowcol.incr(1)) {
    if (!mapped.canStart(rowcol)) {
      mapped.setGrid(rowcol, '.');
      continue;
    }
    if (mapped.setGrid(rowcol, '.')) {
      continue;
    }
    if (mapped.canStartA(rowcol)) {
      const nextA = rowcol.clone();
      nextA.incr(1);
      if (!mapped.setGrid(nextA, '.')) {
        return null;
      }
    }
    if (mapped.canStartD(rowcol)) {
      const nextD = rowcol.clone();
      nextD.incr(this.w);
      if (!mapped.setGrid(nextD, '.')) {
        return null;
      }
    }
  }
  if (dir == 'A') {
    if (!mapped.canStartA(this.rowcol)) {
      return null;
    }
    let rowcol = this.rowcol.clone();
    for (let l = 0; l < len; l++) {
      if (!rowcol.isValid() || rowcol.row != this.rowcol.row) {
        return null;
      }
      if (!mapped.setGrid(rowcol, '0')) {
        return null;
      }
      rowcol.incr(1);
    }
    if (rowcol.isValid() && rowcol.row == this.rowcol.row) {
      if (!mapped.setGrid(rowcol, '.')) {
        return null;
      }
    }
  }
  if (dir == 'D') {
    if (!mapped.canStartD(this.rowcol)) {
      return null;
    }
    let rowcol = this.rowcol.clone();
    for (let l = 0; l < len; l++) {
      if (!rowcol.isValid() || rowcol.col != this.rowcol.col) {
        return null;
      }
      if (!mapped.setGrid(rowcol, '0')) {
        return null;
      }
      rowcol.incr(this.w);
    }
    if (rowcol.isValid() && rowcol.col == this.rowcol.col) {
      if (!mapped.setGrid(rowcol, '.')) {
        return null;
      }
    }
  }
  return mapped;
}

/**
 * Infer the remaining grid recursively. Append any fully successfully
 * filled grids to results.
 */
ExolveGridInferrer.prototype.infer = function(results) {
  if (this.mapped.length == this.lights.length) {
    while (this.rowcol.isValid()) {
      this.setGrid(this.rowcol, '.');
      if (this.canStart(this.rowcol)) {
        return false;
      }
      this.rowcol.incr(1);
    }
    if (!this.isValid()) {
      return;
    }
    results.push(this);
    return;
  }
  const lights = this.lights[this.mapped.length];
  const rowcolStart = this.rowcol.clone();
  let numUnsetCellsSet = 0;
  /* Only consider blackening up to 5 open cells, to keep complexity in check */
  while (this.rowcol.isValid() && numUnsetCellsSet <= 5) {
    if (this.grid[this.rowcol.row][this.rowcol.col] == '_') {
      numUnsetCellsSet++;
    }
    let candidates = [this.clone()];
    this.rowcol.incr(1);
    for (let dir of ['A', 'D']) {
      if (!(dir in lights)) {
        continue;
      }
      const light = lights[dir];
      const dirCands = candidates.slice();
      candidates = [];
      for (let candidate of dirCands) {
        console.assert(light.len >= 3, light);
        const candidateMapped = candidate.mapLight(dir, light.len, rowcolStart);
        if (candidateMapped) {
          candidates.push(candidateMapped);
        }
      }
    }
    for (let candidate of candidates) {
      if (!candidate.isValid()) {
        continue;
      }
      candidate.mapped.push(candidate.rowcol.clone());
      candidate.rowcol.incr(1);
      candidate.infer(results);
    }
  }
}

/**
 * Return the grid in Exolve format, if fully filled. Otherwise return null.
 */
ExolveGridInferrer.prototype.gridSpecLines = function() {
  if (this.rowcol.isValid()) {
    return '';
  }
  let lines = ''
  for (let r = 0; r < this.h; r++) {
    let rowLine = '';
    for (let c = 0; c < this.w; c++) {
      if (this.grid[r][c] == '_') {
        return '';
      }
      rowLine += this.grid[r][c];
    }
    lines += `
      ${rowLine}`;
  }
  return lines;
}
