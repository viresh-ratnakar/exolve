# Changelog

### Version: Exolve v0.62 April 5 2020

- Add an input handler for answers (otherwise we were stealing focus to the
  last answer on Safari).
- Fix cursor jumping in the scratch-pad.

### Version: Exolve v0.61 April 2 2020

- Clicking/tabbing in placeholders in clues table now keeps the focus there.
- "Clear this" now respects crossers even when the current grid light does not
  have a clue.
- Add tooltip to "Clear this" to let users know about the second click for
  needed for clearing full crossers.
- Placeholders can be forcibly cleared with a second click on 'Clear all' when
  there any orphan clues with placeholders. And for such puzzles, a tooltip
  on 'Clear all' lets the user know of this functionality.

### Version: Exolve v0.60 April 1 2020

- For orphan clue placeholders, use middle dots (···) instead of question marks
  (???) so that filled placeholders can more readily be visually distinguished
  from unfilled ones.
- Minor bugfixes for linked clue number rendering, when the linked numbers
  are non-numeric.

### Version: Exolve v0.59 April 1 2020

- Do proper styling of clue numbers for linked clues: let them spill into
  the clue column, and indent the clue column.
- Enable 'clear this' button if there is an anno (just like 'reveal this')
- In 'reveal/clear this' set/reset clue solved state and colour even for
  orphan clues.

### Version: Exolve v0.58 March 26 2020

- Go back to using old var names such as currentRow, as some customizePuzzle()
  scripts depend on them.
- Add a test (test-customize-puzzle.html) to make sure we do not change these
  names going forward.
- Increase max allowed grid size to 100.
- Add the following new exolve-options:
  - grid-background:[html clolor]
  - offset-left:[x]
  - offset-top:[y]
  The offset-left and offset-top options allow you to move the position of the
  grid (for example, if you want to paint additional artwork around the grid,
  using customizePuzzle().
- Add an exolve-credits section (repeatable).
- Expose numCelldFilled as a global (numCellsToFill is already there)

### Version: Exolve v0.57 March 25 2020

- Only allow manually setting/unsetting a clue's "solved" state for clues
  that do not have all cell locations known.
- When clicking on a black cell or the title (to unhighlight active cells),
  also unhighlight active clues.

### Version: Exolve v0.56 March 23 2020

- Mainly a revamp of tab navigation, to take into account various cases
  involving diagramless cells, clues without cells specified, etc.
- When on a diagramless cell or a cell without a known clue, the clues strip
  will now cycle through only "orphan clues" with the < and > buttons in it.
- Darken the current cell more than the rest of the active cells.
- Add small triangles to indicate the current direction. Unobtrusive and
  harmless (perhaps reassuring) normally, and quite useful on diagramless cells.
- Allow clicking on clue numbers in the clues lists, to manually toggle "solved"
  state (i.e., the light-blue colour). Useful for jigsaw puzzles.

### Version: Exolve v0.55 March 9 2020

- Add prev/next clue buttons in the current clue strip, helping navigation
  on mobile devices where tab/shift-tab is not doable.

### Version: Exolve v0.54 March 5 2020

- Bugfix: focus on placeholder in a clue only if it actually exists!

### Version: Exolve v0.53 March 5 2020

- Turn on orphan-clue placeholder enrtry areas even if diagramless cells are
  present--just turn off the copy-from-placeholder buttons (as only one cell
  will be active if it is diagramless).

### Version: Exolve v0.52 March 4 2020

- Bugfix: tab-navigation in the clues list also moves focus to the placeholder
  input area, if present.
- Add hide-copy-placeholder-buttons option to not show copy placeholder buttons
  if desired.

### Version: Exolve v0.51 March 3 2020

- Allow tab/shift-tab for lights even when they do not have a known clue
  associated.
- Use a shorter separator string for saving state (but support the older one
  too).
- For nodir clues without cells specified, create placeholder text-entry areas.
  Also add buttons to transfer into active cells.
- Bugfix: only if a tab/shift-tab is usable for navigation do we now prevent
  default browser behaviour.
- Bugfix: When entering answers, do not make the cursor jump to the end.

### Version: Exolve v0.50 February 24 2020

- Bug fix: revealAll() did not work properly for non-square grids.

### Version: Exolve v0.49 February 17 2020

- Handle tab and shift-tab across clue directions (including nodir).
- Allow backspacing across linked clues.

### Version: Exolve v0.48 February 14 2020

- Bugfix: Handle the case of a linked clue ending and ressuming on the same
  cell.

### Version: Exolve v0.47 February 12 2020

- Minor bugfix: activateCell() could make one unnecessary call to itself through
  toggleCurrentDirection() (making the activeCells array sometimes go bad).

### Version: Exolve v0.46 February 8 2020

- If an entry is fully prefilled, reveal its anno upon first rendering the
  puzzle.

### Version: Exolve v0.45 January 3 2020

- Bugfix: number-of-cells-filled computation had become buggy with v0.44.

### Version: Exolve v0.44 January 2 2020

- Allow crosswords with single-digit numeric entries. To do this, the
  exolve-option, "allow-digits" must be specified.
- For a crossword with solutions, it cannot be the case that all solutions
  are 0s (even if allow-digits is specified). Such a grid is correctly
  given the better interpretation: that it is a grid without solutions provided.

### Version: Exolve v0.43 December 1 2019

- Bug fix: mark linked child clues as filled by looking at their parent.

### Version: Exolve v0.42 December 1 2019

- Bug fix: when there is a linked clue but the linked child clue is not
  explicitly provided (as "13 See 10" or something like that), there was a bug
  that disallowed typing beyond the first letter of the child clue.

### Version: Exolve v0.41 November 20 2019

- Bug fixes in clearCurrent(), checkCurrent(), revealCurrent(): corner cases
  for when to show clues state as filled/not-filled.
- Bug fix to enable reveal button when there is available anno, even for an
  orphan clue.

### Version: Exolve v0.40 November 19 2019

- Bugfix: updateClueState() had a bug with orphan clues.

### Version: Exolve v0.39 November 19 2019

- When a light is filled in fully, change the colour of its clue-number. The
  colour is chosen to be a light shade of blue so that:
  - unsolved clues show with darker numbers
  - shade of blue not green as green may be construed as "correct"
    and we're not checking correctness
  - using a checkmark instead of changing the colour has tedious issues (either
    shift the clue text to make room, or worry about clipping/eclipsing).
- Minor tweak to the width of the current clue shown atop the grid,
  done to make sure that it is not too narrow in smaller puzzles.
  When too narrow, long clues for the top grid rows were obscuring
  the top rows.

### Version: Exolve v0.38 November 13 2019

- Bug fix: Don't use parses enum-len == 0 to test if we should set successors in linkd clues.
- Set wordEndAfter/Under, hyphenAfterUnder even at grid edges, if the setter has done that
- Render wordendAfter/Under bars only when there is a next light
- Render only half hyphens at grid edges

### Version: Exolve v0.37 November 10 2019

- Adding a line between clues that starts with --- starts rendering a new table of clues
- Support for 3d (and 4d!) puzzles:
  - In a nodir clue, allow all cells that comprise the clue to be specified
  - Generalize the notion of 'current direction': it can now be 'A' or 'D' or the clueIndex of a nodir clue

### Version: Exolve v0.36 October 22 2019

- Fixing a slight/silly issue from v0.34: need to set "max-width" (not "width")
  for #clues, so that we do not force that size on mobile.

### Version: Exolve v0.35 October 22 2019

- Functionality fix: Now, the "Clear this" button at first only clears letters
  that do not cross other fully filled lights, if there are any. If there are
  none (i.e., if all remaining letters in the current light also cross other
  fully filled lights), only then will these remaining letters get cleared.

### Version: Exolve v0.34 October 22 2019

- Make "Clear this" behave incrementally, clearing non-crossing squares first,
  if there are any.
- Set a css width for #clues. Only impacts the rare case (but one that I am
  running into for a grid) when there is an across section, a down section,
  *and* a no-dir section. In that case, the specified width will make the no-dir  section wrap over (otherwise the entire clues panel wraps over and goes
  under the grid).

### Version: Exolve v0.33 October 16 2019

- Retain the order of clues provided within Across/Down/Nodir sections (even
  if the order is weird: the setter probably intends it).
- Allow non-clue filler lines in Across/Down/Nodir sections (any lines that
  cannot be parsed as clues and that precede a clue). These lines are simply
  displayed—they can be used as headings of subsections within clues, or extra
  notes/instructions, for example.

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

