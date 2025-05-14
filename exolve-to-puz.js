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

let exolveToPuzChars8859 = null;

function exolveToPuzCksum(uint8array, offset, len, cksum) {
  for (let i = 0; i < len; i++) {
    if (cksum & 0x0001) {
      cksum = (cksum >> 1) | 0x8000;
    } else {
      cksum = cksum >> 1;
    }
    cksum += uint8array[offset + i];
    cksum = cksum & 0xffff;
  }
  return cksum;
}

function exolveToPuzShort(buffer, offset, shortval) {
  buffer[offset] = shortval & 0xFF;
  buffer[offset + 1] = shortval >> 8;
}

function exolveToPuzEnc8859(s, buffer, offset) {
  if (!exolveToPuzChars8859) {
    exolveToPuzChars8859 = {};
    const decoder = new TextDecoder('iso-8859-1');
    const buff = new Uint8Array(1);
    for (let i = 128; i < 256; i++) {
      buff[0] = i;
      const char = decoder.decode(buff);
      exolveToPuzChars8859[char] = i;
    }
  }
  const chars8859 = exolveToPuzChars8859;
  for (let i = 0; i < s.length; i++) {
    let code = s.charCodeAt(i);
    if (code >= 128) {
      const char = s.charAt(i);
      if (chars8859.hasOwnProperty(char)) {
        code = chars8859[char];
      } else {
        throw 'Character not supported in ISO-8859-1: ' + char;
      }
    }
    buffer[offset++] = code;
  }
  return offset;
}

function exolveToPuz(xlvp, showEnums=true) {
  try {
    if (xlvp.layers3d > 1) {
      throw 'This puzzle has lights other than across/down';
    }
    if (xlvp.hasDgmlessCells > 1) {
      throw 'This puzzle has diagramless cells';
    }
    if (xlvp.allowChars) {
      throw 'This puzzle uses special characters';
    }
    /**
     * Generously estimate length of the buffer needed.
     */
    const estDotPuzLen = 10000 + (2 * xlvp.puzzleText.length);
    const buffer = new Uint8Array(estDotPuzLen);
    let offset = 0;

    offset = 0x02;
    offset = exolveToPuzEnc8859('ACROSS&DOWN', buffer, offset);
    buffer[offset++] = 0;

    offset = 0x18;
    offset = exolveToPuzEnc8859('1.3', buffer, offset);
    buffer[offset++] = 0;

    offset = 0x2c;
    buffer[offset++] = xlvp.gridWidth;
    buffer[offset++] = xlvp.gridHeight;

    exolveToPuzShort(buffer, 0x2E, xlvp.allClueIndices.length);
    buffer[0x30] = 1;  // Unknown bitmask

    const numCells = xlvp.gridWidth * xlvp.gridHeight;

    let solution = '';
    let playerState = '';
    const orderedClueIndices = [];
    const circleLocs = [];
    for (let i = 0; i < xlvp.gridHeight; i++) {
      for (let j = 0; j < xlvp.gridWidth; j++) {
        const gridCell = xlvp.grid[i][j];
        if (gridCell.hasBarAfter || gridCell.hasBarUnder) {
          throw 'This puzzle has barred cells';
        }
        if (!gridCell.isLight) {
          solution = solution + '.';
          playerState = playerState + '.';
        } else {
          solution = solution + (gridCell.solution != '0' ?
            xlvp.stateToDisplayChar(gridCell.solution) : '?');
          playerState = playerState + '-';
          if (gridCell.startsAcrossClue) {
            orderedClueIndices.push('A' + gridCell.startsClueLabel);
          }
          if (gridCell.startsDownClue) {
            orderedClueIndices.push('D' + gridCell.startsClueLabel);
          }
          if (gridCell.hasCircle) {
            circleLocs.push((i * xlvp.gridWidth) + j);
          }
        }
      }
    }
    if (xlvp.allClueIndices.length != orderedClueIndices.length) {
      throw 'Non-standard clue types';
    }

    offset = 0x34;
    offset = exolveToPuzEnc8859(solution, buffer, offset);
    offset = exolveToPuzEnc8859(playerState, buffer, offset);

    const titleOffset = offset;
    offset = exolveToPuzEnc8859(xlvp.title ?? '', buffer, offset);
    const titleLen = offset - titleOffset;
    buffer[offset++] = 0;

    const setterOffset = offset;
    offset = exolveToPuzEnc8859(xlvp.setter ?? '', buffer, offset);
    const setterLen = offset - setterOffset;
    buffer[offset++] = 0;

    const copyrightOffset = offset;
    offset = exolveToPuzEnc8859(xlvp.copyright ?? '', buffer, offset);
    const copyrightLen = offset - copyrightOffset;
    buffer[offset++] = 0;

    const clueOffsets = [];
    const clueLens = [];
    for (const ci of orderedClueIndices) {
      const theClue = xlvp.clues[ci];
      if (theClue.reversed) {
        throw 'Reversed clues are not supported';
      }
      const startOffset = offset;
      clueOffsets.push(startOffset);
      let puzClue = xlvp.formatClue(
          theClue.clueSpan.innerText.replace(/\s+/g,' '),
          false, showEnums, false);
      if (theClue.children.length > 0) {
        const chI = theClue.displayLabel.indexOf(',');
        if (chI >= 0) {
          const chLabel = theClue.displayLabel.substr(chI + 1).trim();
          if (chLabel) {
            puzClue = '(+'+ chLabel + ') ' + puzClue;
          }
        }
      }
      offset = exolveToPuzEnc8859(puzClue, buffer, offset);
      clueLens.push(offset - startOffset);
      buffer[offset++] = 0;
    }
    /**
     * If the puzzle has a preamble, set it as "Notes". We retain any HTML
     * formatting, but note that most .puz players would not apply such
     * formatting (exolve-player does).
     */
    const notesOffset = offset;
    offset = exolveToPuzEnc8859(xlvp.preambleElt.innerHTML.trim(), buffer, offset);
    const notesLen = offset - notesOffset;
    buffer[offset++] = 0;

    let gextOffset = -1;
    if (circleLocs.length > 0) {
      gextOffset = offset;
      offset = exolveToPuzEnc8859('GEXT', buffer, offset);
      exolveToPuzShort(buffer, offset, numCells);
      offset += 4;
      for (const loc of circleLocs) {
        buffer[offset + loc] = 0x80;
      }
      offset += numCells;
      buffer[offset++] = 0;
      const c_gext = exolveToPuzCksum(buffer, gextOffset + 8, numCells, 0);
      exolveToPuzShort(buffer, gextOffset + 6, c_gext);
    }

    /**
     * Need to fill checksums
     */
    const c_cib = exolveToPuzCksum(buffer, 0x2C, 8, 0);
    exolveToPuzShort(buffer, 0x0E, c_cib);

    let cksum = c_cib;
    cksum = exolveToPuzCksum(buffer, 0x34, numCells, cksum);
    cksum = exolveToPuzCksum(buffer, 0x34 + numCells, numCells, cksum);

    if (titleLen > 0) {
      cksum = exolveToPuzCksum(buffer, titleOffset, titleLen + 1, cksum);
    }
    if (setterLen > 0) {
      cksum = exolveToPuzCksum(buffer, setterOffset, setterLen + 1, cksum);
    }
    if (copyrightLen > 0) {
      cksum = exolveToPuzCksum(
          buffer, copyrightOffset, copyrightLen + 1, cksum);
    }
    for (let i = 0; i < orderedClueIndices.length; i++) {
      cksum = exolveToPuzCksum(buffer, clueOffsets[i], clueLens[i], cksum);
    }
    if (notesLen > 0) {
      cksum = exolveToPuzCksum(buffer, notesOffset, notesLen + 1, cksum);
    }
    exolveToPuzShort(buffer, 0x00, cksum);

    const c_sol = exolveToPuzCksum(buffer, 0x34, numCells, 0);
    const c_grid = exolveToPuzCksum(buffer, 0x34 + numCells, numCells, 0);
    let c_part = 0;
    if (titleLen > 0) {
      c_part = exolveToPuzCksum(buffer, titleOffset, titleLen + 1, c_part);
    }
    if (setterLen > 0) {
      c_part = exolveToPuzCksum(buffer, setterOffset, setterLen + 1, c_part);
    }
    if (copyrightLen > 0) {
      c_part = exolveToPuzCksum(
          buffer, copyrightOffset, copyrightLen + 1, c_part);
    }
    for (let i = 0; i < orderedClueIndices.length; i++) {
      c_part = exolveToPuzCksum(buffer, clueOffsets[i], clueLens[i], c_part);
    }

    buffer[0x10] = 0x49 ^ (c_cib & 0xFF);
    buffer[0x11] = 0x43 ^ (c_sol & 0xFF);
    buffer[0x12] = 0x48 ^ (c_grid & 0xFF);
    buffer[0x13] = 0x45 ^ (c_part & 0xFF);

    buffer[0x14] = 0x41 ^ ((c_cib & 0xFF00) >> 8);
    buffer[0x15] = 0x54 ^ ((c_sol & 0xFF00) >> 8);
    buffer[0x16] = 0x45 ^ ((c_grid & 0xFF00) >> 8);
    buffer[0x17] = 0x44 ^ ((c_part & 0xFF00) >> 8);
    return buffer.slice(0, offset);
  } catch (err) {
    alert('Cannot save this crossword as .puz: ' + err);
    return null;
  }
}

