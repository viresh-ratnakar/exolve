# Changelog

### Version: Exolve v0.32 October 14 2019

- Bug fix for an edge case: if a clue contains html tags that close beyond the
  enum part (eg, "5. &lt;b>Clue (4)&lt;/b>"), then the closing tag should be
  a part of the clue text, and it should not be misconstrued as the beginning
  of an anno.

### Version: Exolve v0.31 October 13 2019

- Remove &lt;hr/> and one &lt;br/> from under grid-panel.
- Allow comments in the puzzleText area (anything starting with "# ").
- Ignore blank lines in puzzleText.
- Switch to a CHANGELOG.md file instead of adding release notes to README.md.

### Version: Exolve v0.30 October 10 2019

- Add code in createPuzzle() that calls the function customizePuzzle() if
  such a function exists. This can be used by setters to add custom
  functionality as well as custom look-and-feel (for example, insert some
  html elements). Such customization will be easier to maintain in the face
  of newer Exolve versions, as opposed to hard-coded changes to the html.

### Version: Exolve v0.29 October 8 2019

- Do not render any conrols/buttons/questions when printing: try to get
  the grid and all the clues fit on one page.
- Use the "zoom" css attribute (non-standard, but works on Chrome and
  Edge, I think), to slso try to fit on one page when printing.
- Minor fix: add spaces around the slash introduced for replacing &lt;br&gt;
  in v0.28.

### Version: Exolve v0.28 October 7 2019

- If the clue contains &lt;br&gt; tags, replace them with "/" for use in
  the "current clues" strip (which has limited available vertical space).

### Version: Exolve v0.27 October 7 2019

- Add a scratchpad, along with an option to shuffle its contents (or
  the selected text in it, if something has been selected).
- Rename the "Controls" toggle to "Tools." The scratchpad is also now
  toggled with this link.

### Version: Exolve v0.26 September 29 2019

- For long answers, use textarea instead of text.
- Change colour of prefilled entries to blue: easier to distinguish from
  black, and also consistent with the colour of hyphens and word-breaks.
- In a prefilled cell, any input now moves to the next square.

### Version: Exolve v0.25 September 28 2019

- "Check this" and "Check all" now behave (respectively) like "Reveal this"
  and "Reveal all" if no errors are found.
- Add "!" as a cell decorator, indicating that the cell should have its
  solution letter pre-filled (and not editable).

### Version: Exolve v0.24 September 26 2019

- Stop auto-jumping to the next light after finishing entry in one.
- Provide tab and shift-tab to navigate to the next/prev.
  clue in the current direction.
- Provide a Controls link to toggle list of keyboard controls.
- Hit Enter to toggle current direction.
- Reveal/Clear This now also show/hide anno for the current clue.

### Version: Exolve v0.23 September 19 2019

- Move the copyright etc. line to go under the light "saving" text
  and be left- instead of right-aligned for the following reasons:
  - It was cluttered when this was right between the grid and the control
    buttons, making accidental clicks more likely.
  - The cluttered view also looked, well, cluttered.
  - Right-aligning while not being a child of the grid made it hard
    to right-justify flush under the grid, making it look odd for
    non-15x15-sized grids in particular. Now it fits nicely, and also
    makes it more likely that people will read the "saving" text
    that is now right above it.
- Also fix buf where the initial rendering of the current clue was
  sometimes too narrow.

### Version: Exolve v0.22 September 14 2019

- Only put "Orphan" clues in what was called the "all clues bowser."
  Orphan clues are those covering diagramless cells, or whose grid
  location has not been specified.

### Version: Exolve v0.21 September 14 2019

- Add feature (exolve-colour/exolve-color) that lets you colour specific
  cells.
- Reduce bar width slightly, in barred grids.
- Bug fix in barred grids (light spans could be incorrect in certain cases).
- Bug fix when using clues-panel-lines, scrolling the clue into view used
  to scroll the current light out of view sometimes.
- In a barred grid, there is no background visible to click on. You can
  click on the grid title to unhighlight the current clue now (for
  printing, for example).

### Version: Exolve v0.20 September 2 2019

- Move clue numbers one pixel up and one pixel to the left, to clear them
  away more from entered letters.

### Version: Exolve v0.19 August 25 2019

- Ignore a trailing period after a clue number as just a punctuation mark.

### Version: Exolve v0.18 August 23 2019

- Fix bug that did not let you click on circled squares.

### Version: Exolve v0.17 August 23 2019

- Always save the state in the URL. There are some reports of cookie-based
  state getting lost, unfortunately, so relying more explicitly on URL-based
  state seems like a good thing.
- Move the copyright div outside of grid-parent, so that when it gets too
  wide it does not move the grid. Also, make the text in the copyright div
  wrap around.

### Version: Exolve v0.16 August 17 2019

- Load state from url-hash first, so that even if cookie is lost, you can
  recover state. Add explicit note about state getting saved automatically, and
  also provide a URL that includes the current state in url-hash as a fallback.
- In exolve-question, allow enums to be followed by the asterisk (like "Enter
  your name: (40)\*") to indicate the size needed for the answer box without
  actually displaying the enum.

