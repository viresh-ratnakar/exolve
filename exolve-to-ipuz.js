/*
MIT License

Copyright (c) 2020 Viresh Ratnakar

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

Version: Exolve v1.63, May 13, 2025
*/

function exolveToIpuzAddClue(xlvp, showEnums, ci, cluesArray) {
  const clue = xlvp.clues[ci];
  if (clue.reversed) {
    throw 'Reversed clues like ' + ci + ' are not supported';
  }
  const ipuzClue = {
    number: clue.label,
    label: clue.displayLabel,
    clue: xlvp.formatClue(clue.clue, false, showEnums, false),
  };
  if (clue.childrenClueIndices.length > 0) {
    ipuzClue.number = [clue.label];
    for (const chi of clue.childrenClueIndices) {
      const chClue = xlvp.clues[chi];
      ipuzClue.number.push(chClue.label);
    }
  }
  if (clue.solution) {
    ipuzClue.answer = clue.solution;
  }
  if (clue.anno) {
    ipuzClue.explanation = clue.anno;
  }
  cluesArray.push(ipuzClue);
}

function exolveToIpuzAddCell(xlvp, gridCell, cellsArray, solCellsArray=null) {
  const ipuzCell = {
    cell: '#',
  };
  if (gridCell.isLight) {
    ipuzCell.cell = gridCell.startsClueLabel ?? '0';
    ipuzCell.style = {};
    if (gridCell.hasCircle) {
      ipuzCell.style.shapebg = 'circle';
    }
    let bars = '';
    if (gridCell.hasBarUnder) {
      bars += 'B';
    }
    if (gridCell.hasBarAfter) {
      bars += 'R';
    }
    if (bars) {
      ipuzCell.style.barred = bars;
    }
  }
  cellsArray.push(ipuzCell);
  if (!solCellsArray) {
    return;
  }
  const ipuzSolCell = {
    value: '#',
  };
  if (gridCell.isLight) {
    ipuzSolCell.value = xlvp.stateToDisplayChar(gridCell.solution) ?? '0';
  }
  solCellsArray.push(ipuzSolCell);
}

function exolveToIpuz(xlvp, showEnums=true) {
  try {
    if (xlvp.layers3d > 1) {
      throw 'This puzzle has lights other than across/down';
    }
    if (xlvp.hasNodirClues) {
      throw 'Nodir clues are not yet supported';
    }
    if (xlvp.hasDgmlessCells > 1) {
      throw 'This puzzle has diagramless cells';
    }
    if (xlvp.allowChars) {
      throw 'This puzzle uses special characters';
    }
    const ipuz = {
      version: "http://ipuz.org/v2",
      kind: [ showEnums ?
          "http://ipuz.org/crossword/crypticcrossword#1" :
          "http://ipuz.org/crossword#1" ],
      dimensions: {
        width: xlvp.gridWidth,
        height: xlvp.gridHeight,
      },
      puzzle: new Array(xlvp.gridHeight),
      clues: {
        Across: [],
        Down: [],
      },
    };
    if (xlvp.title) {
      ipuz.title = xlvp.title;
    }
    if (xlvp.copyright) {
      ipuz.copyright = xlvp.copyright;
    }
    if (xlvp.setter) {
      ipuz.author = xlvp.setter;
    }
    const preamble = xlvp.preambleElt.innerHTML.trim();
    if (preamble) {
      ipuz.intro = preamble;
    }
    const explanations = xlvp.explanations.innerHTML.trim();
    if (explanations) {
      ipuz.explanation = explanations;
    }
    if (showEnums) {
      ipuz.showenumerations = true;
    }
    if (!xlvp.hasUnsolvedCells) {
      ipuz.solution = new Array(xlvp.gridGeight);
    }
    for (let i = 0; i < xlvp.gridHeight; i++) {
      ipuz.puzzle[i] = [];
      const ipuzCells = ipuz.puzzle[i];
      let ipuzSolCells = null;
      if (!xlvp.hasUnsolvedCells) {
        ipuz.solution[i] = [];
        ipuzSolCells = ipuz.solution[i];
      }
      for (let j = 0; j < xlvp.gridWidth; j++) {
        const gridCell = xlvp.grid[i][j];
        /** Add cell */
        exolveToIpuzAddCell(xlvp, gridCell, ipuzCells, ipuzSolCells);
        if (!gridCell.isLight) {
          continue;
        }
        /** Add clue(s) if cell starts light(s) */
        if (gridCell.startsAcrossClue) {
          const ci = 'A' + gridCell.startsClueLabel;
          exolveToIpuzAddClue(xlvp, showEnums, ci, ipuz.clues.Across);
        }
        if (gridCell.startsDownClue) {
          const ci = 'D' + gridCell.startsClueLabel;
          exolveToIpuzAddClue(xlvp, showEnums, ci, ipuz.clues.Down);
        }
      }
    }
    return JSON.stringify(ipuz);

  } catch (err) {
    alert('Cannot save this crossword as .ipuz: ' + err);
    return null;
  }
}

