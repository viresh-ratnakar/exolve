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

/**
 * exolveFromIpuz() converts the ipuz object, which should be in the ipuz
 * crossword format (http://ipuz.org/crossword) to a string in the Exolve
 * format and returns it. Upon any error, this returns the empty string.
 *
 * The following ipuz features are currently unsupported:
 * - Clue directions other than Across and Down.
 * - Omitted cells (they get rendered as black cells).
 */
exolveFromIpuz = function(ipuz, fname='') {
  if (!ipuz['dimensions']) {
    console.log('ipuz: missing "dimensions"')
    return '';
  }
  if (!ipuz['puzzle']) {
    console.log('ipuz: missing "puzzle"')
    return '';
  }
  let w = ipuz['dimensions']['width']
  if (!w) {
    console.log('ipuz: missing "width"')
    return '';
  }
  let h = ipuz['dimensions']['height']
  if (!h) {
    console.log('ipuz: missing "height"')
    return '';
  }
  const id = ipuz['uniqueid'] || '';

  let exolve = `
    exolve-begin
      exolve-width: ${w}
      exolve-height: ${h}`
  if (id) {
    exolve += `
      exolve-id: ${id}`
  }
  if (!fname) {
    fname = 'unknown'
  }
  exolve += `
    exolve-maker:
      Converted by exolve-from-ipuz.js from ${fname}`
  if (ipuz['title']) {
    exolve += `
      exolve-title: ${ipuz['title']}`
  }
  if (ipuz['author']) {
    exolve += `
      exolve-setter: ${ipuz['author']}`
  }
  if (ipuz['copyright']) {
    exolve += `
      exolve-copyright: ${ipuz['copyright']}`
  }
  if (ipuz['intro']) {
    exolve += `
      exolve-preamble:
        ${ipuz['intro']}`
  }
  if (ipuz['explanation'] || ipuz['notes']) {
    let text = ipuz['explanation'] || ''
    if (ipuz['notes'] && text) {
      text += '<br>\n'
    }
    text += ipuz['notes'] || ''
    exolve += `
      exolve-explanations:
        ${text}`
  }
  exolve += `
      exolve-grid:`
  const block = ipuz['block'] || '#'
  const empty = ipuz['empty'] || '0'
  if (ipuz['puzzle'].length != h) {
    console.log('ipuz: mismatched height')
    return '';
  }
  let grid = new Array(h)
  for (let i = 0; i < h; i++) {
    grid[i] = new Array(w)
    for (let j = 0; j < w; j++) {
      grid[i][j] = {isLight: true, currLetter: '0', solution: '?'}
    }
  }
  for (let i = 0; i < h; i++) {
    let ipuzRow = ipuz['puzzle'][i]
    if (ipuzRow.length != w) {
      console.log('ipuz: mismatched width')
      return '';
    }
    for (let j = 0; j < w; j++) {
      let gridCell = grid[i][j]
      let ipuzCell = ipuzRow[j]
      if (typeof ipuzCell !== 'object' || !ipuzCell) {
        ipuzCell = {cell: ipuzCell}
      }
      if (!ipuzCell.cell && (ipuzCell.style || ipuzCell.value)) {
        ipuzCell.cell = empty
      }
      if (ipuzCell.cell === null || ipuzCell.cell == block) {
        gridCell.isLight = false
      } else if (ipuzCell.cell == empty) {
        // Nothing to do.
      } else {
        // TODO: make use of this when needed
        gridCell.startsClueLabel = ipuzCell.cell
      }
      gridCell.hasCircle =
        (ipuzCell.style && ipuzCell.style.shapebg &&
         ipuzCell.style.shapebg == 'circle')
      if (ipuzCell.style && ipuzCell.style.barred) {
        let bars = ipuzCell.style.barred
        for (let x = 0; x < bars.length; x++) {
          let c = bars.charAt(x)
          if (c == 'T') {
            if (i > 0) grid[i-1][j].hasBarUnder = true
          } else if (c == 'R') {
            gridCell.hasBarAfter = true
          } else if (c == 'B') {
            gridCell.hasBarUnder = true
          } else if (c == 'L') {
            if (j > 0) grid[i][j-1].hasBarAfter = true
          }
        }
      }
    }
  }
  let ipuzSol = ipuz['solution']
  if (ipuzSol) {
    if (ipuzSol.length != h) {
      console.log('ipuz: solution: mismatched height')
      return '';
    }
    for (let i = 0; i < h; i++) {
      let ipuzSolRow = ipuzSol[i]
      if (ipuzSolRow.length != w) {
        console.log('ipuz: solution: mismatched width')
        return '';
      }
      for (let j = 0; j < w; j++) {
        let gridCell = grid[i][j]
        if (!gridCell.isLight) continue
        let ipuzSolCell = ipuzSolRow[j]
        if (typeof ipuzSolCell !== 'object' || !ipuzSolCell) {
          ipuzSolCell = {value: ipuzSolCell}
        }
        if (ipuzSolCell.value !== null && ipuzSolCell.value != empty &&
            typeof ipuzSolCell.value !== 'object') {
          gridCell.solution = ipuzSolCell.value
        }
      }
    }
  }
  for (let i = 0; i < h; i++) {
    let gridRow = '        '
    for (let j = 0; j < w; j++) {
      let gridCell = grid[i][j]
      if (!gridCell.isLight) {
        gridRow += '.'
        continue
      }
      gridRow += ipuzSol ? gridCell.solution : gridCell.currLetter
      if (gridCell.hasCircle) gridRow += '@'
      if (gridCell.hasBarAfter && gridCell.hasBarUnder) gridRow += '+'
      else if (gridCell.hasBarAfter) gridRow += '|'
      else if (gridCell.hasBarUnder) gridRow += '_'
    }
    exolve += '\n' + gridRow
  }

  let clues = ipuz['clues'] || {}
  for (let idir in clues) {
    let dir = 'A'
    let ldir = idir.toLowerCase()
    if (ldir == 'across') {
    } else if (ldir == 'down') {
      dir = 'D'
    } else {
      console.log('ipuz: unsupported direction: ' + idir)
      return '';
    }
    exolve += `
      exolve-${ldir}:`
    let dirClues = clues[idir]
    for (clue of dirClues) {
      let objClue = clue || {}
      if (typeof objClue !== 'object') {
        objClue = {clue: objClue}
      } else if (Array.isArray(objClue)) {
        objClue = {number: objClue[0], clue: objClue[1]}
      }
      let clueText = []
      if (objClue.number) clueText.push(objClue.number)
      else if (objClue.label) clueText.push('[' + objClue.label + ']')
      if (objClue.continued) {
        for (let child of objClue.continued) {
          let s = ''
          if (child.direction) s += child.direction.charAt(0)
          if (child.number) s += child.number
          if (s) clueText.push(',' + s)
        }
      }
      if (objClue.clue) clueText.push(objClue.clue)
      let haveEnum = false
      if (objClue.enumeration) {
        clueText.push('(' + objClue.enumeration + ')')
        haveEnum = true
      }
      if (objClue.answer) {
        if (!haveEnum) {
          clueText.push('(?)')
          haveEnum = true
        }
        clueText.push('[' + objClue.answer + ']')
      }
      if (objClue.explanation) {
        if (!haveEnum) {
          clueText.push('(?)')
          haveEnum = true
        }
        clueText.push(objClue.explanation)
      }

      exolve += `
          ${clueText.join(' ')}`
    }
  }
  exolve += '\n    exolve-end\n'
  return exolve
}
