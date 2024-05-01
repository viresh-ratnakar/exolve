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

Version: Exolve v1.57 May 1, 2024
*/

function exolveFromPuzNextNull(buffer, offset) {
  if (offset <= 0) {
    return buffer.length;
  }
  while (offset < buffer.length && buffer[offset] != 0) {
    offset++;
  }
  return offset;
}

function exolveFromPuz(buffer, fname='') {
  const dotPuzShort = function(buffer, offset) {
    return (buffer[offset + 1] << 8) + buffer[offset];
  }
  buffer = new Uint8Array(buffer);
  let offset = 0;

  const encoder = new TextEncoder("utf-8")
  const decoder = new TextDecoder("iso-8859-1")

  offset = 0x02
  let fileMagic = encoder.encode("ACROSS&DOWN")
  for (let x of fileMagic) {
    if (buffer[offset++] != x) {
      return '';
    }
  }

  offset = 0x2c
  const width = buffer[offset++];
  const height = buffer[offset++];

  const numClues = dotPuzShort(buffer, 0x2E);

  const numCells = width * height;

  let exolveGrid = '';
  offset = 0x34;
  for (let i = 0; i < height; i++) {
    exolveGrid += '    ';
    for (let j = 0; j < width; j++) {
      let solution = decoder.decode(buffer.slice(offset, offset + 1));
      offset++;
      exolveGrid += solution
    }
    exolveGrid += '\n';
  }
  const dummyContainer = document.createElement('div');
  dummyContainer.style.display = 'none';
  let dummyId = `puzxlv-${Math.random().toString(36).substring(2, 8)}`
  dummyContainer.id = dummyId;
  document.body.appendChild(dummyContainer);

  // We use the Exolve code to figure out clue numbering:
  const tempPuz = new Exolve(`
  exolve-begin
  exolve-width: ${width}
  exolve-height: ${height}
  exolve-id: ${dummyId}
  exolve-grid:
${exolveGrid}
  exolve-end
  `, dummyId, null, false, 0, 0, false);

  dummyContainer.remove();

  offset += numCells;
  nextNull = exolveFromPuzNextNull(buffer, offset);
  const title = decoder.decode(buffer.slice(offset, nextNull)).trim();
  offset = nextNull + 1;

  nextNull = exolveFromPuzNextNull(buffer, offset);
  let setter = decoder.decode(buffer.slice(offset, nextNull)).trim();
  if (setter.toLowerCase().substr(0, 3) == 'by ') {
    setter = setter.substr(3).trim();
  }
  offset = nextNull + 1;

  nextNull = exolveFromPuzNextNull(buffer, offset);
  let copyright = decoder.decode(buffer.slice(offset, nextNull)).trim();
  let c0 = copyright.charAt(0);
  if (c0 == 'Ⓒ' || c0 == '©') {
    copyright = copyright.substr(1).trim();
  }
  offset = nextNull + 1;

  let orderedClueIndices = []
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      let gridCell = tempPuz.grid[i][j]
      if (!gridCell.isLight) {
        continue;
      }
      if (gridCell.startsAcrossClue) {
        orderedClueIndices.push('A' + gridCell.startsClueLabel)
      }
      if (gridCell.startsDownClue) {
        orderedClueIndices.push('D' + gridCell.startsClueLabel)
      }
    }
  }

  let acrossClues = '';
  let downClues = '';
  for (let ci of orderedClueIndices) {
    let theClue = tempPuz.clues[ci]
    nextNull = exolveFromPuzNextNull(buffer, offset);
    if (theClue.dir == 'A') {
      acrossClues += '    ' + theClue.label + ' ' +
        decoder.decode(buffer.slice(offset, nextNull)) + '\n';
    } else {
      downClues += '    ' + theClue.label + ' ' +
        decoder.decode(buffer.slice(offset, nextNull)) + '\n';
    }
    offset = nextNull + 1;
  }

  nextNull = exolveFromPuzNextNull(buffer, offset);
  let notes = decoder.decode(buffer.slice(offset, nextNull)).trim();
  offset = nextNull + 1;

  const gext = 'GEXT';
  while (offset + 8 + numCells <= buffer.length) {
    if (buffer[offset] == gext.charCodeAt(0) &&
        buffer[offset + 1] == gext.charCodeAt(1) &&
        buffer[offset + 2] == gext.charCodeAt(2) &&
        buffer[offset + 3] == gext.charCodeAt(3)) {
      offset += 8;
      exolveGrid = '';
      for (let i = 0; i < height; i++) {
        exolveGrid += '    ';
        for (let j = 0; j < width; j++) {
          exolveGrid += tempPuz.grid[i][j].solution;
          if (buffer[offset++] & 0x80) {
            exolveGrid += '@';
          } else {
            exolveGrid += ' ';
          }
        }
        exolveGrid += '\n';
      }
      break;
    } else {
      offset++;
    }
  }
  tempPuz.destroy();

  if (!fname) {
    fname = 'unknown'
  }
  let preamble = '';
  if (notes) {
    preamble = `
  exolve-preamble:
${notes}`;
  }
  return `  exolve-begin
  exolve-width: ${width}
  exolve-height: ${height}
  exolve-title: ${title}${preamble}
  exolve-setter: ${setter}
  exolve-copyright: ${copyright}
  exolve-option: ignore-enum-mismatch
  exolve-maker:
    Converted by exolve-from-puz.js from ${fname}
  exolve-grid:
${exolveGrid}
  exolve-across:
${acrossClues}
  exolve-down:
${downClues}
  exolve-end
  `;
}

