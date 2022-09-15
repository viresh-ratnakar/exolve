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

Version: Exolve v1.44 September 14, 2022
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
 * Usage:
 *   const cadidates = exolveFromText(w, h, text, filename);
 *   const results = [];
 *   for (let candidate of candidates) {
 *     console.log('Trying ' + candidate.name);
 *     candidate.infer(results);
 *     if (results.length > 0) {
 *       break;
 *     }
 *   }
 *   for (let result of results) {
 *     // Use result.exolve()
 *   }
 *
 * This API is broken up like this because there may be several
 * variations to be tried (chequered variants, symmetries, etc.) which may take
 * a while, so it might be useful to give some UI signals to the user (see
 * usage in exolve-player.html for an example).
 *
 * Each matched grid is returned as an object (in the "results" array) that
 * has functions .gridSpecLines() and .exolve() that return the grid specs
 * and the full exolve specs, respectively.
 *
 * Usually, only one grid gets matched, but occasionally, multiple grids may
 * match the pattern implied by the clues. They are all returned in the
 * results array.
 *
 * This assumes that the grid is in a standard, blocked, UK-style format:
 *
 * - The grid is symmetric using one of 180/90/-90/hflip/vflip symmetries.
 * - Every 4x4 area has at least one black cell.
 * - No light is shorter than 3 letters.
 * - Enums are provided for all clues. The only exception is child clues
 *   in linked groups.
 * - For a linked group of clues, the component lights split the linked
 *   entry at exactly word-breaks or hyphens. Moreover (to keep the
 *   algorithm complexity in check), only one extra word-break/hyphen in the
 *   entry is supported (compared to the number of linked clues).
 */
exolveFromText = function(w, h, text, fname='') {
  let sections = {
    title: '',
    setter: '',
    preamble: '',
    copyright: '',
    across: [],
    down: [],
    file: fname || '[provided text]',
  };
  let seenClues = false;
  let inDown = false;

  const lines = exolveFromTextClean(text).split('\n');

  const clueStartRE = /^\s*\d{1,2}(?!\d)([ ]*[,&][ ]*[aAdD][^ ]*)*/;
  const clueRE = /^\s*\d{1,2}(?!\d)([ ]*[,&][ ]*[aAdD][^ ]*)*.*\([0-9, '-]+\)/;
  const childRE = /^\s*\d{1,2}(?!\d)\s*see /i;
  const wordsRE = /[a-zA-Z]+/;
  const copyrightRE = /^\s*(copyright|\(c\)|Ⓒ)/i;
  const titleAndSetterRE = /^\s*(.+)\sby\s(.+)/i; 
  const bylineRE = /^\s*(?:(?:set\sby)|(?:by))[^a-zA-Z0-9]*\s([a-zA-Z0-9].+)/i; 
  const acrossRE = /^[^a-zA-Z0-9]*across[^a-zA-Z0-9]*$/i;
  const downRE = /^[^a-zA-Z0-9]*down[^a-zA-Z0-9]*$/i; 

  let joinedLine = '';
  for (let rawLine of lines) {
    let line = rawLine.replace(/\s/g, ' ').replace(/\s+/g, ' ').trim();
    if (seenClues) {
      if (!inDown && downRE.test(line)) {
        inDown = true;
        joinedLine = '';
        continue;
      }
      if (clueRE.test(line) || childRE.test(line)) {
        if (joinedLine) {
          const tryLine = joinedLine + ' ' + line;
          if (clueRE.test(tryLine) || childRE.test(tryLine)) {
            line = tryLine;
          } else {
            console.log('Ignored potential clue start: ' + joinedLine);
          }
        }
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

/**
 * Do lots of cleaning of the text.
 */
exolveFromTextClean = function(s) {
  /**
   * Strip out non-alphanumeric weird characters preceding a number and after
   * some leading space after a newline ("bullets" are often found here).
   */
  s = s.replace(/\n\s+[^\w"',\.\(\)-]*([1-9][0-9]*)/g, '\n $1');

  /**
   * Insert newlines between clues that got stitched together (a common
   * PDF-to-text failure mode).
   */
  s = s.replace(/(\([1-9 ][0-9 ,'-]*\))\s*([1-9][0-9]*)/g, '$1\n$2');

  /**
   * If the word DOWN itself has been spliced to the preceding line, separate
   * it out. But be careful: only do it if it is clear that this is the
   * start of the down section. Heuristics used for that: a drop in clue
   * number, position of DOWN right after enum and before clue#.
   */
  const downSplicedMatch = s.match(
      /(.*)([^0-9])([1-9][0-9]*)(\s*[^()]*)(\([0-9 ,'-]*\))[ \t]*DOWN\s*([1-9][0-9]*)(.*)/i);
  if (downSplicedMatch && downSplicedMatch.length == 8) {
    const prevNum = parseInt(downSplicedMatch[3]);
    const nextNum = parseInt(downSplicedMatch[6]);
    if (nextNum < prevNum) {
      s = s.substr(0, downSplicedMatch.index) +
        downSplicedMatch[1] + downSplicedMatch[2] + downSplicedMatch[3] +
        downSplicedMatch[4] + '(' + downSplicedMatch[5] + ')\nDown\n' +
        downSplicedMatch[6] + downSplicedMatch[7] +
        s.substr(downSplicedMatch.index + downSplicedMatch[0].length);
    }
  }
  return s;
}

exolveFromTextAddChild = function(sections, par, child) {
  const parDir = par.charAt(0);
  const parNum = par.substr(1);
  const childDir = child.charAt(0);
  const childNum = child.substr(1);
  if (parDir != childDir || (parDir != 'A' && parDir != 'D')) {
    return false;
  }
  const arr = parDir == 'A' ? sections.across : sections.down;
  arr.push(`${childNum} See ${parNum}`);
  arr.sort((c1, c2) => {
    const c1i = parseInt(c1);
    const c2i = parseInt(c2);
    return c1i - c2i;
  });
  return true;
}

exolveFromTextSections = function(w, h, sections) {
  if (w <= 0 || h <= 0) {
    console.log('Width and height must both be at least 1');
    return [];
  }
  if (!sections.across || sections.across.length <= 0 ||
      !sections.down || sections.down.length <= 0) {
    console.log('Text has to contain at least one across clue and one down clue');
    return [];
  }
  let specs = '';
  /**
   * Create an invisible Exolve puzzle with a fully blank and diagramless grid,
   * to parse just the clues.
   */
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
  specs += `
    exolve-maker:
      Converted by exolve-from-text.js from ${sections.file}`
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

  let puz;
  try {
    puz = new Exolve(tempSpecs, xlvpid, null, false, 0, 0, false);
  } catch (err) {
    const re = /^.*Invalid child ([AD][0-9][0-9]*) in ([AD][0-9][0-9]*)/i;
    const missingChild = err.toString().match(re);
    if (missingChild && missingChild.length == 3 &&
        exolveFromTextAddChild(sections, missingChild[2], missingChild[1])) {
      console.log('Adding ' + missingChild[1] +
          ' as child clue for ' + missingChild[2]);
      return exolveFromTextSections(w, h, sections);
    }
    console.log('Exolve had fatal errors in parsing clues: ' + err);
    console.log(err.stack);
    return [];
  }

  const inferrer = new ExolveGridInferrer(puz, specs);
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
      return [];
    }
    if (inferrer.lights.length <= num) {
      inferrer.lights.length = num + 1;
    }
    if (!inferrer.lights[num]) {
      inferrer.lights[num] = {};
    }
    if (clue.enumLen == 0 && !clue.parentClueIndex) {
      console.log(puz);
      return [];
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
    return [];
  }

  let numLights = 0;
  for (let i = 1; i < inferrer.lights.length; i++) {
    if (!inferrer.lights[i]) {
      console.log('Found missing clue ' + i);
      return [];
    }
    if (!('A' in inferrer.lights[i]) && !('D' in inferrer.lights[i])) {
      console.log('Found a hole at clue ' + i);
      return [];
    }
    for (let dir of ['A', 'D']) {
      if (!(dir in inferrer.lights[i])) {
        continue;
      }
      numLights++;

      const light = inferrer.lights[i][dir];
      if (light.clue.childrenClueIndices && light.clue.childrenClueIndices.length > 0) {
        inferrer.parents.push([i, dir]);
      } else if (!light.clue.parentClueIndex) {
        light.len = light.clue.enumLen;
      }
    }
  }
  console.log('There are ' + numLights + ' lights over ' +
              w + 'x' + h + ' = ' + (w*h) + ' cells.');

  const candidates = [];
  const inferrers = inferrer.expandLinkedGroups();

  for (let rowpar = 0; rowpar < 2; rowpar++) {
    for (let colpar = 0; colpar < 2; colpar++) {
      for (let inferrer of inferrers) {
        const candidate = inferrer.clone();
        for (let r = 0; r < h; r++) {
          for (let c = 0; c < w; c++) {
            if (((r % 2) != rowpar) && ((c % 2) != colpar)) {
              candidate.grid[r][c] = '.';
            }
          }
        }
        candidate.name = 'Chequered template ' + rowpar + '' + colpar;
        candidate.appendWithSyms(candidates);
      }
    }
  }
  for (let inferrer of inferrers) {
    const candidate = inferrer.clone();
    candidate.name = 'Non-chequered template';
    candidate.appendWithSyms(candidates);
  }
  return candidates;
}

function ExolveRowCol(h, w, row=0, col=0) {
  this.h = h;
  this.w = w;
  this.row = row;
  this.col = col;
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
  return new ExolveRowCol(this.h, this.w, this.row, this.col);
}

ExolveRowCol.prototype.isLessThan = function(other) {
  return this.row < other.row ||
         (this.row == other.row && this.col < other.col);
}

/**
 * Captures a candidate inferred grid. Grid entries with '_' have not
 * been decided at any point.
 */
function ExolveGridInferrer(puz, specs) {
  this.puz = puz;
  this.specs = specs;
  this.w = puz.gridWidth;
  this.h = puz.gridHeight;
  /* The 'cursor': the next light will be placed at a cell here onwards */
  this.rowcol = new ExolveRowCol(this.h, this.w);

  this.grid = null;
  /* lights[x]['A'/'D'] (for x = 1,2,..) has the specs for that light */
  this.lights = null;
  /* mapped[x] (for x = 1,2,..) is the cell where label x has been placed */
  this.mapped = null;
  this.name = '';
}

ExolveGridInferrer.prototype.clone = function(newLights=false) {
  const copy = new ExolveGridInferrer(this.puz, this.specs);
  copy.rowcol.row = this.rowcol.row;
  copy.rowcol.col = this.rowcol.col;
  copy.mapped = this.mapped.slice();
  copy.parents = this.parents;
  copy.sym = this.sym;
  copy.name = this.name;

  copy.grid = new Array(this.h);
  for (let r = 0; r < this.h; r++) {
    copy.grid[r] = this.grid[r].slice();
  }
  // expandLinkedGroups() makes shallow copies of some lights[] objects.
  // But for other cloning, using the same lights is fine.
  if (newLights) {
    copy.lights = JSON.parse(JSON.stringify(this.lights));
  } else {
    copy.lights = this.lights;
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
  return this.canStartA(rc) || this.canStartD(rc);
}

ExolveGridInferrer.prototype.isViable = function(connectivity=false) {
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
  if (connectivity) {
    if (!this.isConnected()) {
      return false;
    }
  }
  return true;
}

/**
 * Default symmetry is 180 degrees.
 */
ExolveGridInferrer.prototype.sym = (rc) => new ExolveRowCol(
    rc.h, rc.w, rc.h - 1 - rc.row, rc.w - 1 - rc.col);
ExolveGridInferrer.prototype.symListRect = {
  '180 deg.': ExolveGridInferrer.prototype.sym,
  'Hor. flip': (rc) => new ExolveRowCol(rc.h, rc.w, rc.row, rc.w - 1 - rc.col),
  'Ver. flip': (rc) => new ExolveRowCol(rc.h, rc.w, rc.h - 1 - rc.row, rc.col),
};
ExolveGridInferrer.prototype.symListSq = {
  '90-R deg.': (rc) => new ExolveRowCol(rc.w, rc.h, rc.w - 1 - rc.col, rc.h - 1 - rc.row),
  '90-L deg.': (rc) => new ExolveRowCol(rc.w, rc.h, rc.col, rc.row),
}

/**
 * Returns a list of rowcols rc2 such that rc-rc2 form a diagonal
 * with 0s in the two cross-diagonal cells.
 */
ExolveGridInferrer.prototype.threeZerosAll = function(rc) {
  console.assert(this.grid[rc.row][rc.col] == '0', rc);
  const ret = [];
  const row = rc.row;
  const col = rc.col;
  const prow = row - 1;
  const pcol = col - 1;
  const nrow = row + 1;
  const ncol = col + 1;
  if (prow >= 0 && pcol >= 0 &&
      this.grid[row][pcol] == '0' &&
      this.grid[prow][col] == '0') {
    ret.push(new ExolveRowCol(rc.h, rc.w, prow, pcol));
  }
  if (nrow < this.h && ncol < this.w &&
      this.grid[row][ncol] == '0' &&
      this.grid[nrow][col] == '0') {
    ret.push(new ExolveRowCol(rc.h, rc.w, nrow, ncol));
  }
  if (prow >= 0 && ncol < this.w &&
      this.grid[row][ncol] == '0' &&
      this.grid[prow][col] == '0') {
    ret.push(new ExolveRowCol(rc.h, rc.w, prow, ncol));
  }
  if (nrow < this.h && pcol >= 0 &&
      this.grid[nrow][col] == '0' &&
      this.grid[row][pcol] == '0') {
    ret.push(new ExolveRowCol(rc.h, rc.w, nrow, pcol));
  }
  return ret;
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
  const sym = this.sym(rc);
  if (this.grid[sym.row][sym.col] != '_' &&
      this.grid[sym.row][sym.col] != letter) {
    return false;
  }
  this.grid[rc.row][rc.col] = letter;
  this.grid[sym.row][sym.col] = letter;
  if (letter == '0') {
    const mustBlock = this.threeZerosAll(rc);
    for (let rc2 of mustBlock) {
      if (!this.setGrid(rc2, '.')) {
        return false;
      }
    }
  }
  return true;
}

/**
 * For each linked group, split total length into chunks at word/hyphen
 * boundaries to infer component lengths. Allow at most one extra chunk,
 * to keep complexity in check. Handle some special cases too.
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
      /* See if this is still workable as a special case */
      const special = [];
      if (grp.length == 2 && phParts.length == 1) {
        if (clue.placeholder.length == 6) {
          special.push([3,3])
        } else if (clue.placeholder.length == 7) {
          special.push([3,4])
          special.push([4,3])
        } else if (clue.placeholder.length == 8) {
          special.push([3,5])
          special.push([4,4])
          special.push([5,3])
        }
      } else if (grp.length == 3 && phParts.length == 1 &&
                 clue.placeholder.length == 9) {
        special.push([3,3,3])
      }
      if (special.length > 0) {
        choices.push(special);
        continue;
      }
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
        const updatedCand = cand.clone(true);
        for (let j = 0; j < grp.length; j++) {
          const cci = grp[j];
          const num = cci.substr(1);
          const dir = cci.substr(0, 1);
          const light = updatedCand.lights[num][dir];
          console.assert(light.len == 0, light);
          const lightCopy = {
            label: light.label,
            dir: light.dir,
            clue: light.clue,
            len: choice[j],
          };
          updatedCand.lights[num][dir] = lightCopy;
        }
        updatedCandidates.push(updatedCand);
      }
    }
    if (updatedCandidates.length < 1) {
      console.log('No linked group choice available for ' + grp[0]);
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

ExolveGridInferrer.prototype.appendWithSyms = function(candidates) {
  for (let symName in this.symListRect) {
    const candidate = this.clone();
    candidate.name = this.name + ': ' + symName;
    candidate.sym = this.symListRect[symName];
    candidates.push(candidate);
  }
  if (this.w == this.h) {
    for (let symName in this.symListSq) {
      const candidate = this.clone();
      candidate.sym = this.symListSq[symName];
      candidate.name = this.name + ': ' + symName;
      candidates.push(candidate);
    }
  }
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
        return;
      }
      this.rowcol.incr(1);
    }
    if (!this.isViable(true)) {
      return;
    }
    results.push(this);
    return;
  }
  const lights = this.lights[this.mapped.length];
  const rowcolStart = this.rowcol.clone();
  let numUnsetCellsSet = 0;

  /* Only consider blackening up to these many cells */
  const maxToBlacken = 5;
  while (this.rowcol.isValid() && numUnsetCellsSet <= maxToBlacken) {
    const gridCell = this.grid[this.rowcol.row][this.rowcol.col];
    if (gridCell == '_') {
      numUnsetCellsSet++;
    }
    let candidate = this.clone();
    this.rowcol.incr(1);
    console.assert(('A' in lights) || ('D' in lights), lights);
    for (let dir of ['A', 'D']) {
      if (!(dir in lights)) {
        continue;
      }
      const light = lights[dir];
      console.assert(light.len >= 3, light);
      candidate = candidate.mapLight(dir, light.len, rowcolStart);
      if (!candidate) {
        break;
      }
    }
    if (!candidate) {
      continue;
    }
    candidate.mapped.push(candidate.rowcol.clone());
    candidate.rowcol.incr(1);
    if (!candidate.isViable()) {
      continue;
    }
    candidate.infer(results);
  }
}

ExolveGridInferrer.prototype.isConnected = function() {
  let cells = []
  let visited = new Array(this.h)
  for (let i = 0; i < this.h; i++) {
    visited[i] = new Array(this.w)
    for (let j = 0; j < this.w; j++) {
      visited[i][j] = false
      if (this.grid[i][j] != '.') {
        cells.push([i,j])
      }
    }
  }
  if (cells.length == 0) return false;
  let reachable = [cells[0]]
  visited[cells[0][0]][cells[0][1]] = true;
  let x = 0;
  while (x < reachable.length) {
    let r = reachable[x][0];
    let c = reachable[x][1];
    x++;
    if (c > 0 && this.grid[r][c-1] != '.' && !visited[r][c-1]) {
      visited[r][c-1] = true
      reachable.push([r,c-1])
    }
    if (c < this.w - 1 && this.grid[r][c+1] != '.' && !visited[r][c+1]) {
      visited[r][c+1] = true
      reachable.push([r,c+1])
    }
    if (r > 0 && this.grid[r-1][c] != '.' && !visited[r-1][c]) {
      visited[r-1][c] = true
      reachable.push([r-1,c])
    }
    if (r < this.h - 1 && this.grid[r+1][c] != '.' && !visited[r+1][c]) {
      visited[r+1][c] = true
      reachable.push([r+1,c])
    }
  }
  return reachable.length == cells.length;
}

/**
 * Return the grid in Exolve format. If a cell's blockiness
 * hasn't yet been determined, it is made diagramless.
 */
ExolveGridInferrer.prototype.gridSpecLines = function() {
  let lines = ''
  for (let r = 0; r < this.h; r++) {
    let rowLine = '';
    for (let c = 0; c < this.w; c++) {
      const gridCell = this.grid[r][c];
      rowLine += (gridCell == '_' ? '0*' : (gridCell + ' '));
    }
    lines += `
      ${rowLine}`;
  }
  return lines;
}
/**
 * Return the crossword in Exolve format, if fully filled. Otherwise return null.
 */
ExolveGridInferrer.prototype.exolve = function() {
  return this.specs + this.gridSpecLines() + '\n  exolve-end';
}
