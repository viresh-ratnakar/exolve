# Changelog


### Minor Version: Exolve v1.57.3: May 4, 2024

- Same as 1.57.2, but for xlv-button: use css width 'inherit', to
  override weird default button styling in some blogs.

### Minor Version: Exolve v1.57.2: May 4, 2024

- Make xlv-small-button use css width 'inherit', to override
  weird default button styling in some blogs.

### Minor Version: Exolve v1.57.1: May 2, 2024

- On Firefox, innerText can create spurious newlines as `\n<br>` in
  the HTML becomes `\n\n`. This created weird looking text from
  'Email notes'. Fixed by replacing consecutinve newlines with a single
  one, in the 'Email notes' code.

### Version: Exolve v1.57: May 1, 2024

- Allow one or more hints to be added to any clue. The hints can be
  progressively revealed when a clue is the current clue above the grid,
  by clicking on a lightbulb that shows up if there are any unrevealed
  hints left.
- Clicking on the hints dismisses them.
- The styling can be customized through exolve-relabel and exolve-colour.

### Minor Version: Exolve v1.56.7: April 9, 2024

- Call getElementsByClassName() only on the current puzzle element, instead
  of calling on document, as that's buggy when multiple puzzles might be
  present (for example, in Exet when showing a preview for selecting a
  previous revision).

### Minor Version: Exolve v1.56.6: March 18, 2024

- Allow placeholder text to contain multi-character letters separated
  by spaces (for languages such as Hindi).

### Minor Version: Exolve v1.56.5: February 5, 2024

- If Shift-click is used on a grid cell, do not toggle direction. This is
  useful to come back to the grid from some other input element (such as
  Jotter or Notes).

### Minor Version: Exolve v1.56.4: January 24, 2024

- When parsing enums like "(one word)", we were allowing arbirary words
  ending in "w" inside the parens. Fix that (to some extent).

### Minor Version: Exolve v1.56.3: December 5, 2023

- Add the notion of an `xlv-only-print` class (mirroring the existing
  `xlv-dont-print` class for any elements that make sense only in the
  printed version.

### Minor Version: Exolve v1.56.2: November 25, 2023

- Make "Your Puzzle Title" be the example title in exolve-m-simple.html

### Minor Version: Exolve v1.56.1: November 20, 2023

- Make `revealAll()` also return false if the user did not confirm.
- Like `revealAllHandler()`, create a `clearAllHander()` that calls
  `clearAll()`, allowing users to override `clearAll` inspite of the bound
  handler.

### Version: Exolve v1.56: November 19, 2023

- Add support for "rebus cells"—cells in which the solution may contain multiple
  letters with `exolve-option: rebus-cells`.
  - With this option set, pressing Shift while entering a letter lets you place
    multiple letters into a cell.
  - Double-clicking on a cell also activates multi-letter entry (useful for
    phones).
  - If a cell already has multiple letters, then entering more letters into it
    is directly possible (without having to press Shift or to double click).
- Reduce font-size automatically to fit multiple letters in rebus cells..
- For scripts with multi-char letters (such as Devanagari), enable the entry of
- Move the right-arrow triangle (and the left-arrow triangle in reversed
  lights) in the current cell to go under the letters rather than to the right,
  when rebus-cells are present. This creates more available space for letters.
  multiple characters via the same Shift/double-click mechanism as used in
  rebus cells (previously it was always activated, which meant there was never
  any auto-advancing, which was a bit annoying).
- Disallow rebus cells if the script has multi-char letters, or if the crossword
  has diagramless cells (to keep the code simpler).

- Add support for "letter maths" in the Jotter scratchpad. This is a feature
  that lets the solver test whether a bunch of fodder words can be anagrammed
  to get the solution they are thinking of, and to see what if any letters
  might be missing. If you type "Astronomer - moon starer =" into the
  scratchpad, then it will cleared away as soon as you type the equals sign.
  If you type "Asterix Obelix Dogmatix - Vitalstatistix =" then it will be
  replaced by "er Obex Dogmx - Vtst".

- When placeholder blanks are placed after a clue (indicated through one or
  more underscores just beyond the enum), make the number of blanks be the
  max of the count of underscores and the placeholder dots-pattern implied by
  the enum (e.g., "... (3,4)" implies "··· ····").
- Get rid of any extraneous width in placeholder blanks by applying a
  max-width style.
- Allow the placeholder text to be overridden. So, instead of the dots-pattern
  implied by the enum, you can have any arbitrary text. This overriding text
  should be specified in square brackets just beyond the underscore(s). E.g.:
  ```
    What the sign said (3,2) _ [Munch!?]
  ```
- Minor bug-fix: call `updateActiveCluesStatea()` in the Delete-key handler.

### Minor Version: Exolve v1.55.1: November 14, 2023

- Added support for delete key to erase contents of highlighted cell.

### Version: Exolve v1.55: November 1, 2023

- Add `exolve-option: add-extraction-slots` to add a column of
  inputs in front of the clues.
- Minor clean-ups and refactorings.

### Minor Version: Exolve v1.54.6: October 31, 2023

- Add some more error reporting to exolve-embedder.js.

### Minor Version: Exolve v1.54.5: October 3, 2023

- Parse enums like (5 6) too.
- In exolve-from-text, allow there to be a period or
  colon after the clue number.

### Minor Version: Exolve v1.54.4: October 2, 2023

- Add an Inksaver option to printing.

### Minor Version: Exolve v1.54.3: October 1, 2023

- Allow the QR code to be printed at the bottom-right of the whole
  puzzle (and make that the default option).
- Styling tweaks: don't set styles for "table", make a class called
  "xlv-clues-table" and use that.
- Change the way darl-mode-only/light-mode-only colour options are
  specified: colour-light-<name> conflicts with a few already existing
  light-<name> options. Use "colour-light.<name>" and
  "colour-dark.<name>" instead.

### Minor Version: Exolve v1.54.2: September 26, 2023

- Make exolve-from-text.js normalize a couple more common pdf-pasting flaws:
  remove end-of-line hyphens, and insert missing spaces before enums.

### Minor Version: Exolve v1.54.1: September 17, 2023

- When exolve-option: color-name:c is specified, override both light/dark
  mode colors. Override only ligh/dark mode if
  exolve-option: color-light/dark=name:c is specified.

### Version: Exolve v1.54: September 17, 2023

- Tweak dark mode code: allow exolve-options to tweak the colour choices used
  in dark mode, using options like
  `exolve-option: colour-dark-active-clue:khaki`.
- Move the code that sets the bg colour of the top clue to be the same as
  that of the puzzle parent (if sufficiently contrastive). Now this is done
  even in light mode. Add `exolve-option: no-smart-colouring` to suppress
  this.
- Do not fire a completion event when reloading from saved state.

### Version: Exolve v1.53: September 15, 2023

- Roll back the addition of explicit colours for 'active-clue-text'
  and 'currclue-text'. Too complex, better to inherit. We do deal
  better with dark-mode now, anyway.
- If the text font color is sufficiently bright (>= 200), then
  we enter dark-mode. We override a few colour choices in dark-mode.
  But we do not tinker with any colour set explicitly with an exolve-option.
- Introduce another div inside "curr-clue" called "curr-clue-inner". This
  now allows us to let the user specify a small amount of pixel clearance
  between the top of the grid and the bottom of the curr-clue.
- Allow this clearance to be specified with exolve-option `top-clue-clearance`.

### Version: Exolve v1.52: September 14, 2023

- Add more CSS overrides to fight blog-styling, this time to counter
  CSS from "ghost" hosting.
- Set enumLen in clues to be the number of cells if no enum is
  provided (eg, in American-style crosswords), unless the puzzle
  has diagramless cells.
- Add colours explicitly for currclue-text and active-clue-text
- Set curr-clue-width and control-panel-width to be the same
  to avoid some jumpy behaviour on small width displays.
- Tweaks to rendering of answers, scratchpad, links.

### Minor Version: Exolve v1.51.1: September 10, 2023

- Refactor exolve-embedder.html into exolve-embedder.js and a tiny
  HTML file.

### Version: Exolve v1.51: September 9, 2023

- Add `exolve-embedder.html`, which is a way to directly serve
  .puz and .ipuz files.
- Several new printing features and some printing tweaks:
  - Option to print a QR code.
  - Option to print the preamble below the grid.
  - Option to print the clues on a separate page.
  - Get smaller-page-widths to print correctly, at least in Chrome,
    by setting `zoom` to 70% if available printing width is less than or equal
    to 7 inches.
  - Deprecate `exolve-option: columnar-layout`: it never worked reliably,
    and getting rid of it simplified the code.

### Minor Version: Exolve v1.50.6: August 30, 2023

- Expose the scratch pad (renamed "Jotter") in the main menu.
- Remove underlines from main menu links (they show up on hovering).

### Minor Version: Exolve v1.50.5: August 7, 2023

- When there is a copyright message, include it in printing as well.

### Minor Version: Exolve v1.50.4: July 25, 2023

- Move the "Your entries are auto-saved..." message to appear in
  the Exolve sub-section, reducing clutter under the crossword.

### Minor Version: Exolve v1.50.3: July 15, 2023

- Make exolve-from-puz.js also read the "Notes" section and set it
  as exolve-preamble if it is nonempty.

### Minor Version: Exolve v1.50.2: July 7, 2023

- Make sure that .xlv-small-buton is not displayed when printing
  (by using a more specific CSS selector).

### Minor Version: Exolve v1.50.1: June 7, 2023

- Bug fix: When deleting older entries while managing local storage,
  first collect the entries to be deleted, then delete them. Otherwise
  we only delete partially, as window.localStorage is a live list.

### Version: Exolve v1.50: May 16, 2023

- Remove the Firefox-specific code that made pageinate() a no-op—it
  seems to work OK now.
- But in Firefox, use settings for the toggle "Shrink to page width"
  vs "Scale [100]" seem sticky. Add documentation that this should
  be set to "Shrink to page width."

### Version: Exolve v1.49: May 10, 2023

- When testing if the current input is a valid letter in a
  multi-char-letters script such as Devanagari, we need to check *all*
  the entered letters.
- Increase max chars per letter to 5 for Devanagari (from 4).

### Minor Version: Exolve v1.48.3: March 23, 2023

- Do not fire a completion event if there is not .frame Element
  (perhaps because it's a temp puzzle that has been deleted).

### Minor Version: Exolve v1.48.2: March 12, 2023

- If setColumnLayout() is called without the DOM rendering of the
  puzzle yet done, it gets duped when calculating the clues column
  width. Fix that by falling back to simply using the viewport
  width if this.frame's width is found to be 0.

### Minor Version: Exolve v1.48.1: March 8, 2023

- Slight tweak to the available width calculation in resizing clue
  column widths, for the case of embedded (not full-width) puzzles.

### Version: Exolve v1.48: March 7, 2023

- When already in the Notes section, return to the last cell in
  the grid if another Ctrl-/ is pressed. Restore scroll position
  when jumping back to the grid from the notes.
- Reduce clue-column widths progressively if the display is resized.
- Make the exolve-option `clues-at-right-in-two-columns be a no-op.
  We now always behave as if this were true.

### Version: Exolve v1.47.3: March 1, 2023

- Add option to skip printing the questions (in crosswords that have
  them).

### Version: Exolve v1.47.2: February 26, 2023

- Add support for `exolve-option: override-number-<name>:<value>` to
  overrride numeric properties that do not have their own dedicated
  `exolve-option` (such as `GRIDLINE`).
- Make `exolve-option` parsing be case-sensitive.

### Version: Exolve v1.47.1: February 24, 2023

- Remove the "notebook" background temporarily when copying notes
  as it looks weird when pasted into emails.

### Version: Exolve v1.47: December 19, 2022

- Allow '/' as a linked-clue-number separator.
- Make exolveFromText() work in the background using a Worker thread.
  It can take a lot of time for large grid sizes (such as 23x23). it
  now communicates its progress and results through postMessage().

### Minor Version: Exolve v1.46.5: October 25, 2022

- Bug-fix in exolve-player: A temp exolve puzzle created to figure
  out clue locations from the grid (when parsing .puz) hangs around,
  and leads to an ID conflict when the same .puz file is reloaded.
  Fixed by (a) Using a random temp ID, and (b) Calling .destroy()
  on the temp puzzle.

### Minor Version: Exolve v1.46.4: October 2, 2022

- Made the clue notes have a substantial min width, so that they can
  be clicked into.

### Minor Version: Exolve v1.46.3: September 25, 2022

- Add support for using Ctrl-\* to mark the current clue's notes with a
  \* prefix (without changing focus).

### Minor Version: Exolve v1.46.2: September 24, 2022

- Change clue-note tag from p to div to make it more compact.

### Minor Version: Exolve v1.46.1: September 24, 2022

- Set the title of the clue-notes element in JavaScript rather than through
  HTML-parsing of text that may potentially contain double quotes.

### Version: Exolve v1.46: September 23, 2022

- Bug fix: need to update the clue entry shown in the Notes panel even
  when the state goes from solved-to-solved but with a change. Now, just
  save the previous entry in the clue structure and compare the new one
  with that.
- Show the clue as a tooltip when the mouse is hovered over a clue's notes.

### Version: Exolve v1.45: September 22, 2022

- Reorganize the line of links under the crossword. It used to be:
  "Tools, Print, [Webifi], Bug, Exolve on Github". The "Tools" link
  has been renamed to "Exolve" (it is more general now). The "Bug" link
  (renamed to "Report Bug") and  the "Exolve on Github" link have been
  moved inside the panel that open up on clicking on the "Exolve" link.
- A new link called "Notes" has been added (described below).
- So the line of links now looks like: "Exolve, Print, Notes, [Webifi]"
  (shorter than before).
- Clicking on any of the three Exolve/Print/Notes links opens a panel
  underneath, *while also closing the previous panel that may have been
  open there.*
- Minor tweaks to documentation and UI labels (such as all hover-texts
  now consistently end in a period or some other punctuation mark.
- The Notes link lets you add/edit/view clue-specific as well as overall
  notes for the crossword. These notes are saved in the local
  storage along with the crossword state.
- The notes can be copied to the clipboard using the "Copy notes" button.
  Clicking on the "Email notes" button composes an email draft containing
  the notes. If the crossword includes contact email addresses (via a new
  `exolve-email` section) then the draft is addressed to those addresses.
- The notes can include a few features automatically, if desired (each one
  can be turned off with a checkbox). These are:
  - The solving order of the clues.
  - The solution entered.
  - The time at which the clue was solved.
- When solving a clue, if you type Ctrl-/ (Ctrl-Slash), then you are directly
  taken to the notes line for that particular clue, where you can edit the
  note or just read what you may have written. When no clue is selected,
  typing Ctrl-/ will take you the overall notes section.

### Version: Exolve v1.44: September 14, 2022

- If the solver changes a cell entry from a non-blank letter to a different 
  non-blank letter, then that changed letter is highlighted by showing in a
  different colour for a short while. This animation's start/end colours
  (`overwritten-start` and `overwritten-end`) and the duration
  (`highlight-overwritten-seconds`) can be configured with `exolve-option`.
- The default duration is 5 seconds. I have tried to keep the animation
  low-key.
- Setting `highlight-overwritten-seconds` to 0 will turn this off.
- This is motivated especially by competetion settings such as IXL where
  if a solver accidentally types over a cell then a visual indicator can
  save them from losing points.

### Version: Unnumbered minor tweak: September 8, 2022

- Chrome has a bug wherein after the first page load, window.print() does not
  conclude with an 'afterprint' event occasionally. So, just call
  handleAfterPrint() after calling window.print() as it can be safely called
  twice.
- Make the xlv-frame div be able to capture keyboard events with tabindex=-1
  (this makes it not a part of tab-navigation while still lets it capture
  keydown events). This is useful for catching Ctrl-B for printing, after
  clicking anywhere in the puzzle area, not necessarily within a grid cell.
- Add css rule for .xlv-frame:focus to not get drawn with a border/outline.

### Version: Exolve v1.43: September 7, 2022

- Create an Exolve.destroy() function, to be used by ExolvePlayer to
  remove window-listeners that would otherwise keep accumulating.
- Rename the Exolve constructor param "saveState" to "notTemp". When
  notTemp is false, apart from not saving state, also do not attach
  window-listeners (for resize/printing). This stops listeners from
  accumulating in Exet.
- In 3-column printing, minor tweak: minimize the sum of absolute
  diffs |diff12| + |diff23| + |diff13|.
- When printOnlyCrossword or when printAsIs is true for any exolve
  crossword on the page (matters when there are more than one), make
  handleBeforePrint() a no-op for all other crosswords on the page.
- Make print options background be transparent and color be "inherit"
  so that it looks OK in embedded settings such as blogs too.

### Version: Exolve v1.42: August 27, 2022

- Several printing fixes/improvements:
- Bug-fix: when printing just the crossword from a blog (or from widgets in
  general), the exolve stylesheet was (sometimes) not getting applied. Some
  browser bug (?) got triggered when the element containing the link tag
  for the stylsheet got moved. The code now does not move elements (only
  moves top-level text nodes), styling them to be invisible directly
  while printing.
- Add a "Print wysiwyg" button to allow printing without having Exolve
  do crossword-reformatting.
- Improve/fix printing layout: in 3-column modea, minimize the sum of
  two gaps: |col1 - col2| + |col3 - min(col1,col2)|.

### Version: Unnumbered minor tweak: July 26, 2022

- Do not display the xlv-clear-area strip when printing.

### Version: Exolve v1.41: July 18, 2022

- When treating '&' as a linked child indicator in a clue label, only do so
  if a numeric label follows.

### Version: Exolve v1.40: July 3, 2022

- Make the next/prev buttons in the top clue have vertical-align
  'text-top' rather than 'top' (the difference shows up when font
  size is increased).
- When parsing multiline exolve sections (such as exolve-preamble),
  also include any text on the section line itself.
- Lots more css tweaks, mainly to ensure blog themes do not encroach and
  override critical exolve css.

### Version: Unnumbered minor tweak

- Add buttonRow1 and buttonRow2 members to the Exolve object.

### Version: Unnumbered README tweak

- Add another customization example.

### Version: Unnumbered tweak: exolve-player fixes

- In Exolve player, if loading Webifi fails, turn it off (this happens
  on older Safari, where String.replaceAll() isn't supported, for e.g.).
- In Exolve player, delete old Webifi element.
- In Exolve, if useWebifi is false but the Webifi scripts have been loaded
  (as would happen in the ExolvePlayer context when parsing a new text file
  into a temp Exolve puzzle), do not load webifi, to avoid unnecessary
  console errors.

### Version: Unnumbered tweak: exolve-from-text fixes

- If a text line starts like a clue, but you already have a previous line
  that seems to start a clue, and the current line can conclude it, use the
  previous line, do not discard it. Eg, part of clue after newline starts
  with some number.
- Bugfix in exolve-player.html: kill ref to curr-clue-parent.

### Version: Exolve v1.39: June 20, 2022

- Allow enums like "(8, 2 words)", which do specify the entry length
  but skip providing word break positions.
- When either of "words" or "letters" is used inside an enum, allow
  it to be any subword beginning with w/l (i.e., allow wds, wrds, w,
  l, ltrs, lttrs, etc., but not wurds, latters, etc.).
- Update README.md.

### Version: Unnumbered tweak: move curr clue slightly

- Line it up with the grid perfectly if the grid is wide enough.

### Version: Exolve v1.38: June 12, 2022

- The clue shown above the grid was reposition on scroll events
  to stay visible. This implementation was quite flickery.
  Have changed it now to use CSS "position: sticky", which is
  MUCH smoother.
- The xlv-curr-clue-parent element is no longer needed as a result, and
  has been reomved (this impacts Exet too, addressed in Exet v0.71)
- We do need the clear space that xlv-curr-clue-parent used to create, so
  have replaced it with a new xlv-clear-area element.
- Slight tweak to a margin, and a few more CSS "!importants" to help
  embedding.
- Make createExolve() and the deprecated createPuzzle() return the created
  Exolve object.

### Version: Exolve v1.37: June 6, 2022

- Add exolve-options for font-family and font-size (to allow
  overriding Exolve's defaults for clues/preamble/etc., which
  are serif/16px).
- Sort the exolve-options section in README.md.
- Add "important" markers on a bunch of CSS rules to avoid
  weird spacings etc. when embedding in blogs.

### Version: Unnumbered tweak to exolve-from-text.js

- Deal with the text 'DOWN" being spliced to the preceding line.

### Version: Exolve v1.36: May 17, 2022

- For the specific error of not finding a child clue in a diagramless
  puzzles, throw a specifically formatted error that says,
  'Invalid child A17 in A15' or something like that.
- Why? We use diagramless puzzles to parse PDF text. Occasionally,
  there are puzzles where a linked child, if its number comes
  right after the parent's, is simply omitted. To recover from
  this, we catch the exception (in exolve-from-text.js) and
  parse it, and supply the missing child clue.
- console.log the stack trace when there is an exception caught.
- exolve-from-text.js:
  - Do the aforementioned missing-child tweak.
  - Don't treat the presence of 'see' by itself as a child RE!
  - Remove leading junk characters (such as bullets)
  - Insert newlines between clues that get stitched together.
  - Bugfix: expandLinkedGroups() needs to make a deep clone
    of the lights object.

### Version: Unnumbered tweak to exolve-from-text.js

- Insert newlines between clues that got spliced together, which is a common
  failure mode for pdf-to-text.

### Version: Unnumbered tweak to README

- Update Webifi section

### Version: Unnumbered tweak to exolve-player.html

- Always enable Wibifi in exolve-player

### Version: Unnumbered tweak to exolve-from-text.js

- When a linked clue's enum does not have parts, put in some
  special-case code to try the following splits: In two parts,
  6 = 3+3, 7 = 3+4 or 4+3, 8 = 3+5 or 4+4 or 5+3. In three parts,
  9 = 3+3+3. 

### Version: Unnumbered small change

- Locate the dir where exolve-m.js is loaded from and save it as
  scriptUrlBase (to be used for on-demand loading of other scripts,
  such as those needed for Webifi).

### Version: Unnumbered css tweak

- Oh, reduce that space from 6px to 4px

### Version: Unnumbered css tweak

- Add a bit more space between title and byline

### Version: Another unnumbered tweak to Exolve-player, April 29, 2022

- Minor styling changes

### Version: Another unnumbered tweak to Exolve-player, April 29, 2022

- Move the puzzle-specific divs up, above the "Links" section

### Version: Another unnumbered tweak to Exolve-player, March 30, 2022

- If a file is not successfully opened, clear the file input field
  so that it can be reopened 'onchange' after modifying w/h.

### Version: Unnumbered tweak to Exolve-player, March 30, 2022

- Add a Show/Hide current crossword button. The last crossword that
  you opened shows up again when you reload, and that can be a bit
  annoying. This lets you hide it (and show it again if needed).

### Version: Exolve v1.35: March 20, 2022

- Oh well, could not bear to see 404s and script-not-found errors in
  the debug console. OK, There are 3 ways to enable Webifi now
  (but without one of these 3, we will now *not* try to load the
  webifi scripts):
  - use the new exolve-option, "webifi"
  - include "webifi" as a URL param (this, as before, directly
    opens the webifi interface, without creating a toggle link
    in the puzzle)
  - actually include the webifi scripts in your puzzle file.

### Version: Exolve v1.34: March 20, 2022

- Add support for Webifi, an experimental feature that adds a
  command-line interface for interacting with a crossword. See details
  in [README.md](README.md#webifi).

### Version: Unnumbered tweak with a story: March 17, 2022

- Add grid connectivity check at the end in ecolve-from-text.js.
- This change really just has minor twiddles to exolve-from-text.js.
  But these changes are relics of an ambitious new feature that
  I had implemented with some nicely satifying algorithms, but one that
  is not going to be useful: inference of barred grids. It turns out
  that too many barred grids (hundreds) typically match a set of clues,
  and picking the right one visually is a hopeless task. Some details
  on the algorithms are in [this reddit
  thread](https://www.reddit.com/r/crosswords/comments/t7oy8r/comment/i128on2/?utm_source=share&utm_medium=web2x&context=3).

### Version: Exolve v1.33 March 15, 2022

- checkAll() and revealAll() were used as event handlers directly,
  which conflated their first args with the event object param. Created
  checkAllHandler() and revealAllHandler().
- checkAll() should not reveal ninas/explanations even when all the solutions
  are correct (it will continue to reveal annos).
- Exploit the "no-4x4-zeros" optimization even more to reduce complexity
  in exolve-from-text.js (there were some overlooked cases).
- This was needed as we now also try out different symmetries apart from
  the standard 180-degrees one. 90-deg/-90-deg/hor-flip/ver-flip.
- Since this can at times take some time, change the UI a bit to
  show a status message listing what grid-template/symmetry is getting
  tried out.
- Update exolve-player.html to use this new scheme.

### Version: Unnumbered tweak only to exolve-from-text, March 12, 2022

- Deal with grid inference when the grid is not derived from one
  of the 4 chequered starting points. Previously, we had hacked
  some limited leeway by clearing the chequered pattern only in a
  5x5 central area. Now, if the 4 chequered starting points do
  not yield a result, we also try the fully unchequered starting
  point.
- This last option is slower. It was *much* slower, but adding one
  trick has salvaged it to be viable: abort as soon as you find that
  setting the current cell to 0 will create the pattern:
    00
    00
- Dedupe inferred grids.
- Add several test files for grid inference.

### Version: Exolve v1.32 March 10, 2022

- Darned linked clue separators! Allow 'and' to be used as a separator.
- Instead of just 'a' or 'across', allow any prefix of 'across' as
  the non-space-preceded clue label qualifier. Similarly, for 'down',
  (also support 'dn'), 'back', 'up'. Leave 3-d as-is (ie, only exact
  2-letter codes ac/ba/aw/...
- Do clue-column indentation for linked clues properly: insert invisible
  text instead of doing complex indentation calculations.

### Version: Yet another unnumbered tweak, March 9, 2022

- Add exolve-maker from exolve-from-text.js.
- exolve-player.html: Add auto-hscroll to exolve specs block.

### Version: Another unnumbered tweak, March 5, 2022

- In the special case for parsing clue directions within linked clue
  specs (from the previous tweak), also allow & as separator.
- exolve-player: save/restore state using local storage so that the
  last opened puzzle shows up again on reloading.
- exolve-player: allow text files to be opened too.
- exolve-player: add a "Help" section.
- exolve-from-text: The 5x5-middle-area-clearing from the last tweak:
  don't do it if the width/height is too small!

### Version: Quick unnumbered tweak, March 5, 2022

- Handle some special cases in parsing clue directions within linked clue
  specs: allow a/d/across/down preceded by a space. This is to help
  exolve-from-text parse some newspaper crosswords.
- exolveFomText(): In chequerer templates, leave a middle 5x5 area
  blank to start with, to deal with the case that occasionally some
  lights are placed in rows/cols that are not aligned with the chequered
  template. Only look for such lights in the middle 5x5 (a likely area
  for such shenangans) to keep complexity in check.

### Version: Exolve v1.31 March 4, 2022

- Make exolve-id optional. We compute a hash of the unsolved grid and the
  clues to create an id now, if one is not provided. The hashing ensures
  that (for eg), with-solutions and sans-solutions versions of the same
  crossword get the same id.
- getAllCell() drops the last cell if it is the same as the first cell
  (for a linked group). This is fine if the enum for the clue does not
  count that cell twice (which is the norm for "snake" clues). But
  the enum can be and often is the length including that cell twice. Do
  not wanr about that. Do this by making the getAllCells() returned
  array have an extra boolean attribute called ".endsOnStart"
- Allow clue labels in linked groups to spell out direction names fully
  (like "4, 5Across" instead of "4, 5a").
- exolve-from-{puz,ipuz}.js: Remove the ",id" parameter for conversions—if
  no id is provided, the resulting Exolve specs won't have an exolve-id,
  which is now fine.
- exolve-from-text.js: New auxiliary code file for exolve-player. Provides
  the exolveFromText() function that figures out the whole grid from just
  the clues (as if it were a diagramless puzzle). There are some notes
  and caveats—please read the documentation in the file.
- exolve-player: Now uses exolveFromText() to convert text from an arbitrary
  crossword (eg, copied from a PDF) into an interactively playable puzzle.
- Reorganized the README file a bit.

### Version: Exolve v1.30 February 12, 2022

- Allow &amp; to be used as the separator between clue numbers in a linked
  clue. Remember the separator used, and use it when displaying too.
- Add `exolve-option: no-nina-button` that will suppress the display of
  the "Show ninas" button even if there are ninas. "Reveal all" will
  display the ninas and will also bring up the "Hide ninas" button. Hiding
  ninas will again hide the nina button when the option is true.
- Vertically top-align the next/prev button in the current clue.
- When a cell gets the same colour twice from ninas (for example, a cell
  at the intersection of two lights that are marked as ninas), create only
  one coloured overlay, so as to avoid double-colouring. Do the same for
  ninas (but not across ninas and colours).

### Version: Exolve v1.29 November 29, 2021

- Allow adding placeholder blanks next to any clue by appending one (or more)
  underscores to the clue.
- Bug-fix: if you click again on the current clue, focus should continue to
  be on the current cell if was there previously.

### Version: Exolve v1.28 November 9, 2021

- Change the default colour of the small arrow triangles in the active cell
  to white from mistyrose, making them a bit more visible.
- Make parseClueLabel() record the amount of leading whiespace, and give it
  a param to avoid skipping trailing comma/period. This is just to make it
  usable in multiple ways in Exet.
- If a clue direction is reversed (even if the parent in its linked group is
  also reversed), make its display label show the directional suffix (b/u
  in 2-D, ba, to, up in 3-D).
- Indent single-letter clue labels in the clue lists even when they have
  a directional suffix.
- Bug-fix: make clearCurr() actually clear all currently active cells in
  the corener cases of those cells belonging to multi-directional linked
  groups (including "snake"s).

### Version: Exolve v1.27 November 7, 2021

- Setting light-level ninas/colours had bugs, esp in 3-D. Re-implemented
  (now non-hacky!) how ninas/clours are stored as well.
- Always init clue object's "placeholder" and "solution"
- Do not throw fatal errors if reversals/ninas/colours are flawed.

### Version: Exolve v1.26 November 3, 2021

- Bug-fix: ninas and coloured cells were not working in 3-D crosswords.
  Fixed, along with some refactoring.
- Bug-fix: parseClueLabel() was calling "away" the reversed direction
  (now "towards") in 3-D.
- Keep the list of reversals around (transferring them to usedReversals after
  using) for Exet.

### Version: Exolve v1.25 October 28, 2021

- Kinda major changes in this release.
- 3-D crosswords are now supported!
  - See detailed documentation in [README.md](README.md#exolve-3d).
  - Use `exolve-3d` to specify the number of layers, and the displayed
    layer "parallelogram" appearance.
  - Use `exolve-3d-across`, `exolve-3d-towards`, and `exolve-3d-down` to
    specify the clues.
- You can reverse the orientation of any light now, with `exolve-reversals`.
  - Changes clue numbering.
  - We introduce suffixes "b" ("back") and "u" ("up") for reversed clues.
  - 3-D clues can be be reversed too. 3-D clues use these 2-letter suffixes:
    "ac" ("across"), "ba" ("back"), "to" ("towards"), "aw" ("away"),
    "dn" ("down"), and "up" ("up").
- Add left/up arrows in the active cell too, as cisual guides for reversed
  lights. In 3-D crosswords, for "up" use left and up arrows together, and
  for "dn" use right and down arrows together.
- The display positioning for these arrows was done with css relative
  positioning earlier, which was a mistake. Fixed now, changing to absolute.
- Lots of other refactoring for 3-D and reversals support.
- Bug-fix: use a separate css class other than `xlv-answer` for printer
  settings inputs (otherwise my 'Al Tricks' puzzle gets messed up!).
- Deal with two corner cases created by linking lights. When a light ends on
  the same cell where the next linked light starts, then that cell is now *not*
  counted twice.
- The second corner case can come from linking and reversals: if you link a
  sequence of lights (including some reversed lights) such that the last cell
  of the linked group is exactly its starting cell, then that cell is also not
  counted twice. Further, the interface lets you type letters in a loop along
  the sequence (as that seems to be the fun thing to do for this corner case).
  For backspacing (when erasing) cells in such a snake-swallowing-its-own-head
  loopy linked group, the interface stops the backspacing at the first cell.


### Version: Exolve v1.24 October 7, 2021

- Add a way to specify any particular font size to use when printing
  (apart from the canned options).
- Add a way to disable "fancy" printing (for eg, from Exet): just set
  puz.printAsIs = true in customizeExolve(puz).
- Reduce a few margins somewhat.

### Version: Exolve v1.23 October 6, 2021

- Allow printing "just the crossword" with Ctrl-b too (in addition to
  the button shown in the print panel). Useful if the print-panel is
  simply not displayed by choice. The Ctrl-b has to be entered after
  clicking on a grid cell or on a clue.
- Allow selecting text from the clues tables. Clicking on a new clue
  continues to switch focus to the first letter of that clue in the
  grid. However, now, if you click on the current clue itself in the
  clues table, focus does not go away, letting you copy its text.

### Version: Exolve v1.22 September 28 2021

- Printing tweaks and bug-fixes. Do 2-columns manually like 3-columns.
  Measure and fit more carefully. Avoid clipping at the bottom by
  inserting special, measured DIVs at the bottom of the first page,
  in each clues column.
- Add a "Print" link. Give controls for page size, margin, font size.
  Allow printing just the crossword (useful when the crossword is
  buried in some section of the whole page).
- Lots of nuances to this change, see the details in the updated
  [documentation](README.md#printing).

### Version: Exolve v1.21 September 20 2021

- Add a new, 3-column layout for printing (and creating PDFs). This is
  now the default layout when printing while there are any unfilled
  cells. This layout makes the grid larger (as it spans 2 of the 3 columns)
  and is easier to write into. This is implemented using code to figure
  out where to split the clues lists for balancing across three columns (as
  CSS does not handle this kind of columnar layout where an element spans
  multiple but not all columns).
- The 2-column layout (with the grid placed in the first column) continues
  to be the default for printing completed grids. This choice works well
  especially when there are annotations/explanations revealed, as it is
  more likely to get everything to fit within a single page.
- Add `exolve-option`s `print-incomplete-2cols` and `print-completed-3cols`
  to override the above defaults if needed.
- Unhighlight the current clue/cells before printing (and restore after
  printing).
- If there are span-specified ninas, make their colour appear in printing
  too (this was a minor bug) by adding a CSS rule for .xlv-clue to render
  the colour properly within that class when printing.

### Version: Quick unnumbered tweak

- Turn off any clues panel max-heights in effect from exolve-clue-lines when
  printing (otherwise clues might overlap in the printout/PDF).

### Version: Exolve v1.20 September 14 2021

- If a clue has multiple enum-like parts, use the *last* one.
- However, override that if there is an earlier enum-like substring
  that is immediately (or with intervening spaces) followed by "[...]"
  (which is a tell-tale start of the annotation part).
- Allow an empty "[]" to be placed to mark the end of the clue part
  for dealing with ambiguities and also for the corner case that
  the anno has to start with "[...]" without making the contents of
  the square brackets be treated like the solution. This used to
  require explicitly providing the solution (like
  "... clue (6) [WITTER] [t]WITTER") but can now also be tackled
  with "... clue (6) [] [t]WITTER". The empty "[]" is not shown in the
  clue or the anno.
- Bugfix: in the case when an anno is provided in a crossword
  without solutions, "reveal this" was clearing the cells (now doesn't).

### Version: Exolve v1.19 September 9 2021

- Bug-fix: blank lines in exolve specs mean grid height may be less than
  grid specs line span.

### Version: Exolve v1.18 September 6 2021

- Allow the cell size to be overridden via `exolve-cell-size: <w> <h>`
- Fire a custom JavaScript event of type `exolve` upon puzzle completion, with
  a `details` object that looks like this:
  - id: The puzzle id.
  - title: The puzzle title.
  - setter: The puzzle setter.
  - toFill: The number of cells to be filled.
  - filled: The number of cells filled.
  - knownCorrect: true/false.
  - knownIncorrect: true/false.


### Version: Exolve v1.17 August 21 2021

- Bugfix: when non-numeric labels are used for across/down clues, always create
  the correct clue index instead of just doing 'A'/'D' + label.

### Version: Quick unnumbered tweak

- Continued attempts to make multiline top clues evenly spaced: reduce font-size
  of xlv-small-button when in xlv-curr-clue.

### Version: Quick unnumbered tweak

- Remove bottom margin from xlv-small-button, making multiline clues (on top)
  evenly spaced.

### Version: Quick unnumbered tweak

- Gnav-light ordering for nodir clues had a small bug: it was always sorting on
  clue labels lexicographically. When cells are known, gnav-sorting should use
  cells.

### Version: Exolve v1.16 May 24 2021

- Create a separate 'colour-active-clue' (for the background colour of the
  currently active clue, in the clues list) instead of reusing 'colour-active',
  as the clue table may have a different colour scheme than the grid.

### Version: Exolve v1.15 May 20 2021

- Add exolve-option: show-cell-level-buttons that creates an extra row of
  buttons with these two buttons: "Check cell" and "Reveal cell"
- Delete obsolete exolve-widget\* code and documentation.

### Version: Quick unnumbered tweak

- Shorter warnings label

### Version: Quick unnumbered bug-fix

- checkConsistency() should be called before the customizer function. Messes
  up Exet otherwise.

### Version: Exolve v1.14 April 19 2021

- Add keyboard shortcuts Ctrl-q and Ctrl-Q for "Clear this" and "Clear all!"
- Detect and show warnings for unclued lights and enum-mismatches.
  - Add exolve-options to suppress: suppress unclued warnings if
    exolve-option "ignore-unclued" is set, and suppress enum-mismatch warnings
    if exolve-option "ignore-enum-mismatch" is set.
  - Do not generate missing clues warnings if there are nodir clues.
  - Do not generate enum-mismatch warnings if there are diagramless cells.

### Version: Exolve v1.13 April 10 2021

- Another minor update for Exet. Make NINA_COLORS a class member, and change
  the colours to be more common names.
- Minor bugfix in the recently updated redisplayQuestions().

### Version: Unnumbered minor tweak

- Use CSS for setting xlv-coloured-cell opacity. Change it to 0.25 from 0.2.
- Darken nina colors slightly to compensate.

### Version: Exolve v1.12 April 8 2021

- Implement exolve-colour the same way as exolve-nina: using a transparent
  div overlay.
- Bug-fix: for revealed ninas, it was the case that clicking a nina cell
  wasn't toggling direction. Fixed by making the grid-wrapper div have a
  higher z-index.
- Expose recolourCells(), redisplayNinas(), redisplayQuestions() as
  functions (for Exet).

### Version: Exolve v1.11 April 7 2021

- Make throwErr() show the error as an alert if the DOM element is not
  available to show it.
- Add an isColor() function. Use it for checking the validity of
  colours in exolve-nina, exolve-colour, exolve-option:colour-...
- Allow a specific colour to be optionally specified in exolve-nina.
- Allow the specified colour to appear anywhere in the list in
  exolve-colour, and also now in exolve-colour.

### Version: Unnumbered minor tweak to v1.10

- Make the def underline thicker, move it down a bit, and make it very
  slightly lighter by default than the solved/solution colour.

### Version: Exolve v1.10 March 28 2021

- Make the underline colour in a revealed definition and the solution text
  colour be the same as the "solved clue number" color, dodgerblue.
- Make these colours be configurable via colour-... exolve-options
  ('def-underline" and "solution").
- Use the solution colour in "incluefill" too (the placeholder blank
  used for orphan clues).

### Version: Exolve v1.09 March 21 2021

- Make the current-clue div above the grid have a max-height and an
  "overflow-y: auto". For outrageously long clues (or in Exet with clue + long
  anno), this avoids clipping the clue, presenting it in a scrolling box.
- Clicking on the setter/preamble too removes the highlighting of the
  current clue now (like the title does).
- Remove 'align-items:center' flex CSS setting for the top-level div. This
  has virtually no impact (as the title/setter are already centered, and
  the main grid/clues are governed by their wrapping div's flex settings)
  except that it helps some corner cases in Exet with narrow layouts.

### Version: Exolve v1.08 March 12 2021

- Add `exolve-option: allow-chars:<chars>` to allow special chars.
- Change the allow-digits option implementation to use the same mechanism
  as for allow-chars. In particular, get rid of the old use of -/~ as
  state-chars for 0/1. We not use unprintable chars as state chars for
  0/1/./?
- Use `&` as an escape char in grid specs, to allow entry of decorators and
  . and ? as entries, if added through allow-chars.
- If state is found in the URL hash, clear it from there (whether or not it
  is used) for a tidier appearance as well as to avoid generating an
  unnecessary second confirm-dialog if you then copy the URL from the browser
  and open in another window/tab.
- If an expllcit solution is provided in square brackets in the clue, turn
  off the "smart" checking that looks to see if the anno part following it
  begins with the solution (the smart code is there to avoid duplication).
- Tweak: limit the max width of the preamble (so that it doesn't protrude
  beyond the grid/clues in the common case of a wide screen and a 15x15 grid).
- Clean-up: back to max 80 columns code!

### Merge pull request #61 from eigenfoo-forks/the-the

- Fix "the the" typos.

### Version: Exolve v1.07 February 27 2021

- When scaling for available width, do not change the font size of the
  main body of text. Use the computed letterSize _only_ within the grid.
  This should make clues/preambles look better in mobile devices.

### Version: Exolve v1.06 February 26 2021

- Display the puzzle id and Exolve version after clicking the Tools link.
- Add an `exolve-maker` multiline section in which construction
  software (like Exet) can place some metadata. Such maker info, if found,
  is also displayed under the Exolve version after clicking the Tools link.
- Add exolve-maker sections when converting from ipuz/puz.
- Save the parsed enum part from each clue within the clue object (in case
  it is scrubbed with an asterisk, for Exet to grab it).
- Show the Exolve version as a tooltip when hovering on the "Exolve on GitHub"
  link.

### Version: Exolve v1.05 February 19 2021

- A couple of printing tweaks: do not print the current clue displayed
  above the grid, add a bit more margin under the preamble, and add
  a class called xlv-dont-print.
- Bug-fix: allow check/reveal to go to single-cell mode with a long
  click even when the cell is a diagramless blocked cell.

### Version: Exolve v1.04 February 11 2021

- In two-column layout, render clues panels to the right if
  `clues-panel-lines` option has been used.
- Also add an option (`clues-at-right-in-two-columns`) to force
  this behaviour.
- Add a "Layout" section in the README file.

### Version: Exolve v1.03 February 3 2021

- Reduce a bit of vertical spacing. Make some fonts (such as in the
  Tools/Report Bug/... line) smaller. The goal was to avoid the
  appearance of a vertical scrollbar for a basic 15x15 puzzle without
  a preamble, in a normal (i.e., mine!) laptop screen with width > about
  1900px and height > about 975px.
- Printing (using the browser's "Print" command or ctrl-P) now lays
  out the puzzle in a newspaper-like 2-column layout. The across clues
  panel starts out in the left panel itself, under the grid, and the two
  columns are of roughly equal height. This is done using CSS "column" layout.
- Add a new option, `columnar-layout`. When this option is specified,
  we render the puzzle in a newspaper-like columnar layout, using CSS
  "column"s (like in the printing layout described above). The number
  of columns is determined by the current width of the viewport (we
  assume that all of it is available to the crossword) and is adjusted
  if the window is resized. The number of columns can only be one of
  the following: 1 (which is the same as what we get without the
  columnar-layout option, when the available width is too small), 2, or 3.
- In the clues-panel-lines option, set style.maxHeight, not style.height.

### Version: Exolve v1.02 January 30 2021

- Make all clue list boxes (class "xlv-clues-box") have the same width
  (set to the max width among them). This looks nicer and makes sure there
  is vertical alignment when one of the clue list boxes (say Down) has
  shorter clues than the other (say Across).
- Add CSS so that we also show clues panels one under the other to the
  right of the grid if there is space (previously the clue panels would
  appear under the grid even if there was space for a single-column layout
  to the right of the grid).

### Version: Exolve v1.01 January 24 2021

- Extend the responsive rendering to smaller displays by allowing even
  smaller grid square dimensions (and with some CSS tweaks).
- Keep clues table headings in a separate div. This is especially
  useful when using the `clues-panel-lines option`, as now the heading
  will not scroll away with the clues.
- Allow "nodir" clues table as well as extra clue tables created using
  `---` to have their own headings. The heading is specified right
  after `exolve-nodir:` or `---`.
- When there is saved state in the URL as well as in the local storage,
  prompt the user to ask if they want to override the local storage state.

### Version: Exolve v1.00 January 20 2021

- Stop saving state in cookies. Stop including state in URL (but still provide
  URL for saving.sharing). Change the name of the addStateToUrl constructor
  param to the now-more-apt provideStateUrl.
- Create a saveState constructor param, defaulting to true. Can be set to
  false for creating throwaway grids such as previews.
- Provide an interface to see all the local-storage-saved states and delete
  some of them if needed. The interface also shows the amount of local
  storage used up in saved Exolve states.

### Version: Exolve v0.99 January 2 2021

- Save puzzle state in the browser's local storage (in addition to cookies).
- Make exolve-player create the puzzle id from a hash of puz/ipuz file contents
  for these formats. This + the above change means that we now save and
  recover state for these formats, when loading in exolve-player.
- Turn off URL-saving in exolve-player as it does not make sense.

### Version: Exolve v0.98 December 15 2020

- New file: exolve-from-puz.js: support for reading .puz
- New file: exolve-player.html: drag and drop any exolve/ipuz/puz file
- Put a * immediately after an enum to hide it.

### Version: Exolve v0.97 December 10 2020

- Make all lines <= 80 chars long (a step towards linting!).
- Allow exolve puzzle ids be arbitrary strings.
- Add support for reading the ipuz format.

### Version: Exolve v0.96 October 18 2020

- Minor changes: do not append a script element to the whole document for
  every Exolve puzzle. Instead append/modify to the frame element for
  that puzzle.
- Return status boolean from ClearAll() to know whether the user went ahead
  (for use in Exet).

### Version: Exolve v0.95 October 10 2020

- Skip the confirmation step if the confirmation message has been set to an
  empty string via exolve-relabel.
- Add sections exolve-force-hyphen-right`, exolve-force-hyphen-below,
  exolve-force-bar-right`, and exolve-force-bar-below. Each such section is a
  single-line section that contains a list of cells. This allows you to force
  the creation of separator hyphens/bars even if not indicated by the enums.

### Version: Exolve v0.94 October 4 2020

- Bug fix: in-clue-annos were not getting rendered properly in the current clue
  above the grid.

### Version: Exolve v0.93 October 4 2020

- A couple of quick fixes/updates:
- If there already are span tags in a clue, don't give up on in-clue-annos!
- s/darkblue/darkgreen/
- Add a do-not-erase param to checkAll()

### Version: Exolve v0.92 October 4 2020

- All "in-clue annos": "28 Replace bottles containing ~{questionable medicine}~ (7)"
  will underline "questionable medicine" as the definition when the solver
  clicks on "Reveal this/all".
- You can provide a custom class name to toggle for the in-clue anno.
- Create a javaScript API to add arbitrary text within a cell, `addCellText()`

### Version: Exolve v0.91 September 13 2020

- Very minor changes, all needed for the first release of Exet.
- Add an optional maxDim parameter to the Exolve constructor, to dictate
  displayed grid-sizing. Useful for creating smaller "preview" crosswords
  even when the available space is larger.
- Do not convert everything tyoed in the scratch pad to upper case.

### Version: Exolve v0.90 September 8 2020

- Add functionality to limit checking/revealing to just the current cell
  rather than the whole current light. This is done when there is a long
  click (500+ms) on "Check this" or "Reveal this." Caveat; this does
  not work on phones and tablets (I only tested on Android) as they deal
  with long-presses in some special way that I'll try to work with, at some
  point.
- Change the default background color of the current clue strip (shown above
  the grid) to 'white' instead of 'mistyrose' (the active clues in the clues
  lists still get the 'mistyrose'). This results in a more relaxed appearance
  (I should have realized this and made this change earlier!). Of course
  this can be customized too (`exolve-option: color-currclue:mistyrose` will
  restore the current colour scheme). When the current clue is an orphan, its
  background continues to be shown as 'linen' (which can be changed with
  `exolve-option: color-orphan:white`, for example).
- When there are multiple Exolve puzzles, use a running variable to set
  the index of a new one, rather than using the # of existing puzzles,
  as we might also need to destroy puzzles from a web page (for example,
  to show a preview).
- Allow under-construction grids to specify '?' as the letter in a cell.
  This is treated just like '0', except that a '0' signifies that the
  grid has cells where the solution has not been provided, but a '?'
  does not.
- Bug-fix: when the enum specified hyphenation in a child clue, and that
  child clue did not exist in the clues lists, we were hitting an
  uninitialized property.
- Separately track the solution to display for a clue from the anno to
  display. Wrao displayed anno in its own span. Wrap the text of the
  clue in its own span.
- Remove weird extra space between prev/next buttons in te current clue strip.
- When typing in the grid, let space-bar advance to the next cell.
- When typing in the grid, if an invalid character (such as punctuation) is
  typed, we were deleting the current entry. Don't do that (delete only
  with space or backspace or a new valid entry).

### Version: Exolve v0.89 August 31 2020

- Add "conf" parameter defaulting to true, to revealAll(), checkAll(),
  clearAll(). Useful for programmatically revealing/checking/clearing
  all cells without creating a confirmation dialog.
- Follow the order used in the puzzle specs among across/down/nodir clue lists
  for rendering them. Also use that order for choosing the direction when
  toggling.
- Allow some across/down clues to be "deleted" in the sense that they will not
  get highlighted as we go through the clues. The use-case is for omitting some
  across/down clues that are completely subsumed by some nodir clues (See
  exolve/issues/37). To mark a clue as deleted, specify it as * after its
  clue number.
- Add more indentation space for clue labels that are not
  numbers/digits/letters.
- Bug-fix: setting the "left" attr of curr-clue-parent was getting skipped
  in a corner case.

### Version: Exolve v0.88 August 19 2020

- Make *all* messages/labels/hover-texts customizable through exolve-relabel.
- Add decorator "~" that marks as cell as "skipped-number" cell. This should
  be used to not assign the normal number to a cell that starts an across or
  down clue (that number will get assigned to the next cell that starts a clue).
  Can be used to to create specialty grids with unclued lights or lights
  clued in special ways. This can also be used to create non-numerically-
  labelled lights, as an alternative to hide-inferred-clue-numbers.
- Better clue panel scrolling when clues-panel-lines is used: instead of
  scrollIntoView(), we just scroll the clues panel by the needed amount.

### Version: Exolve v0.87 August 16 2020

- Some CSS protections for styles that get inherited when embedding. In
  particular, box-sizing for the clue number column TD in clues lists
  should not have 'box-sizing: border-box' as we want to exclude the
  padding from its 2ch max-size.
- When keeping the current clue visible while scrolling, allow for
  fixed/sticky-positioned navbars at the top by adding a visTop param
  to the constructor, that clients can optionally pass as the height of
  any sticky nav bar at the top.
- Fixed bug in option clues-panel-lines.

### Version: Exolve v0.86 August 15 2020

- When going to next/prev clue from small-button clicks on the current clue
  strip, don't jump focus to a placeholder input in the clues list.
- After dialogs (etc.), set focus back to gridInput based upon whether
  gridInputWrapper.style.display is not 'none' (rather than from usingGnav: we
  could be !usingGnav but still have some active cells).
- Add a CSS style rule for setting font family and font size (same as grid
  letter) for the outermost .xlv-frame element, so that when embedding we do
  not inherit weird fonts unintentionally.

### Version: Exolve v0.85 August 12 2020

- Increase font size of clue numbers in grid cells by 1 point.
- Don't use sonme random keycode to represent "shift-tab": pass a boolean to
  indicate "shift"
- Diagramless bug fix: active clues were not getting shown even in the
  non-diagramless parts of the puzzle, even when their start cells were
  specified.
- Complain about invalid chars if found in grid spec.
- Found and fixed another couple of Diagramless corner case bugs:
  - extendsDiagramlessA/D() were incorrectly ignoring whether the previous cell
    ended in a bar.
  - Tab-navigation with non-diagramless adjoining diagramless was broken
  - Simplified diagramless gnav: it now happens in units of consecutive cells
    when possible, instead of single cells.
- Found and fixed a bug in jigsaw "reveal this" from the clues list side that
  had sneaked in probably with v0.84.
- Shorten "Diagramless" to "Dgmless"

### Version: Exolve v0.84 August 7 2020

- Major refactoring to address the following problems that were roadblocks
  in getting Exolve used within arbitrary websites without conflicting with
  the site's own JavaScript and HTML:

  - There were lots of globals in the JavaScript.
  - HTML ids and class names were not distinctive.
  - You could only have one puzzle within a single web page.

- With this release:

  - There are only the following globals created or used by the JavaScript code,
    all but one having a distinctive name unlikely to collide with anything:
    Exolve, exolvePuzzles, createExolve, customizeExolve, and createPuzzle.
    - createPuzzle() has been retained (though marked deprecated) as it is
      used by all existing old Exolve puzzle files.
  - All HTML ids and class names begin with "xlv".
  - You can have multiple puzzles within the same web page.
    - You can place a puzzle within a specific container (such as a DIV) by
      passing the container's HTML id at puzzle creation time.
    - Or you can just have create puzzles get appended to the end of the page.
    - Each puzzle on a page can use its own oprions (such as colours) and can
      have its own customization, if needed.

- Existing puzzle files should continue to work, with one exception: if you
  used customizePuzzle() in the past, and/or you added supplemental CSS rules,
  you would have to update those things.
  - Use customizeExolve(puzzle) now, instead of customizePuzzle. The puzzle
    object has all the components of the puzzle (instead of them being globals).
    Some of the names of the puzzle components have changed (mostly shortenings
    of very long names).
  - For updating CSS rules, please note that all class names and HTML ids now
    begin with xlv. Class names are simply the old names prefixed by "xlv-".
    Use class names in CSS rules instead of ids, preferably. The ids are
    puzzle-specific and use prefixes like "xlv1-", "xlv2-", etc.

- Bug-fix: for languages with multi-character compound letters (such as Hindi),
  automatically inferred clue solutions were not getting set correctly.
- Add some space between exolve-credits-generated lines via CSS.

### Version: Exolve v0.83 August 3 2020

- Refactoring, essentially no change in functionality. About 1500 fewer bytes.

### Version: Exolve v0.82 August 2 2020

- With Exolve puzzles embedded inline (not via iframes) in sites, we have
  to deal with location-hash-parts that are not Exolve state. Modified
  state parsing to now try the cookie if there is a location hash but its
  parsing fails.

### Version: Exolve v0.81 July 30 2020

- Move the current clue strip up a bit to clear the top of the grid or top
  of the active cell (depending upon whether it is in its normal position
  or scrolled position).
- Set font family for small-print (otherwise it gets inherited and looked
  bad in Blogger).
- Do not set location-hash state when used in an iframe widget.

### Version: Exolve v0.80 July 20 2020

- Supporting code and documentation for creating Exolve widgets.
- Set some cookie attributes to allow websites to use Exolve code served by a 
  different site.
- Some crossrefs in README.md.

### Version: Exolve v0.79 July 10 2020

- Changes to make puzzles more responsive on mobile devices.
  - Set the grid size and clues panel sizes depending upon the viewport size.
  - Most of the time, the user will not have to "pinch" to size, the UI
    should be correctly sized already.
- If the 'outermost-stack' div already exists (old html file, likely),
  replace it with current HTML.

### Version: Exolve v0.78 June 30 2020

- If an HTML element with the id "exolve" is present, insert the puzzle
  within it.

### Version: Exolve v0.77 June 20 2020

- In puzzles with solutions, we now automatically add to the anno (or create
  an anno consisting of) the solution to the clue, derived from the grid
  letters and the enum (for spaces, hyphens, etc.). For orphan clues,
  the solution gets placed inside the placeholder blank slot instead of
  the head of the anno.

- This would have meant that if in an older grid the solution was explicitly
  included in the anno, it would have got duplicated. So, the code does check
  to see if the solution string (punctuation/markup notwithstanding) is present
  at the head of the anno, and avoids duplicating it if so. If the solver wants
  to present the solution in some other way, they can suppress the automatic
  addition of the solution to the anno by adding
  this line to the puzzle specs:
    exolve-option: no-auto-solution-in-anno
  This option only suppresses the solution getting added to the anno appearing
  after the clue. The solution does still get added to the placeholder blank
  slot of an orphan clue, upon "Reveal this," even with this option.

- If a clue does not provide its enum (using "(?)" or "(one word)" for eg),
  the setter can still provide its correct solution in square brackets,
  at the beginning of the anno. For example,
  "[A] Lack of understanding (?) [NO CLUE]"

- For orphan clues (such as in a jigsaw puzzle), if the solver is navigating
  in the clues list having clicked there last (rather than the grid), then
  we now make "Reveal this" reveal the current clue rather than the current
  light in the grid.

- The styling of the anno is now normal monospace instead of italic. The
  solution text within the anno is bold monospace (and has the class name
  "solution" for use in css overrides if desired).

- Backspace now does not go back beyond a light boundary (except in linked
  clues).

### Version: Exolve v0.76 June 13 2020

- Allow 'exolve-preamble' as an alias for 'exolve-prelude' as "preamble" is
  more commonly used in crosswordese.
- Add 'exolve-postscript' section to add a section at the bottom of the puzzle
  panel. This can be used, for example, to add nav links.
- Add option to allow exolve-question to not convert all answer letters into
  uppercase (for long-form answers, for example). This is done by optionally
  including the phrase "[lowercase-ok]" (without the quotes) immediately after
  the enum specified in the question.
- When exolve-submit is specified, allow submitting partial solutions too,
  but with an extra warning in the confirmation dialog.

### Version: Exolve v0.75 May 28 2020

- Add support to completely customize the colour scheme of the puzzle by
  using options like "exolve-option: color-button:blue".
- Add support for specifying orphan-clue to grid-clue (and/or or grid-cells)
  mappings: eg., in a nodir clue like "[P] Some clue (4) [4d]"
- Tweak linked clue indentation a little for non-numeric labels and for Firefox.
- Bug fix: HTMLCollection is not iterable on Edge, fixed in displayNinas()

### Version: Exolve v0.74 May 26 2020

- The latest version of Chrome adds a black outline on focus to #grid-input,
  which does not look that great. Add css to counteract.

### Version: Exolve v0.73 May 25 2020

- Bug fix: "catch" needs a paramter (IE/Edge require it strictly).
- Make the grid-input text invisible, as not matter how much I tweak
  its alignment with the underlying svg text in the cell, there is
  still some doubling effect seen in some platforms. 

### Version: Exolve v0.72 May 14 2020

- No functionality change. Only some optimizations: use object references
  when possible, instead of deindexing arrays with the same indices
  repeatedly.
- Change the example crossword in exolve.html and exolve-m.html to
  something smaller and simpler.

### Version: Exolve v0.71 May 7 2020

- Bug-fix: Unicode property escapes in regexpes (added to the code in v0.70)
  do not work on some browsers such as Firefox (support is coming soon though).
  Exolve was failing on Firefox because of this, even for English. Fixed so
  that it only fails for non-English, and that too with a useful error
  message.

### Version: Exolve v0.70 May 7 2020

- Added support for non-English languages:
  - exolve-language: &lt;language-code&gt; &lt;Script:gt;
    [&lt;max-char-codes-per-letter&gt;]
  - Required significant changes (but everything should be backward-compatible)
    in how we check inputs, how we specify the grid, how we save and restore
    state.
- Non-English languages made a known issue slightly worse: the current grid
  letter was getting rendered in a slightly blurry way, because of a slight
  position mismatch between the cell-text and grid-input. Tweaked a bit to
  improve.
- Added an exolve-relabel section that can let you change the text of any
  button (and any HTML element with an id). This should be particularly useful
  for non-English crosswords.

### Version: Exolve v0.69 May 5 2020

- When a non-numerically labeled across/down clue or a nodir clue can be
  ascertained to point to an unclued light (because its start cell or all
  its cell locations have been provided), we coalesce them now.
- Documentation tweaks.
- Typing answers takes the focus away from the grid now, allowing tab
  navigation.
- We start out without usingGnav=true now.

### Version: Exolve v0.68 May 1 2020

- Bug fix: on Safari, setting selectionEnd moved focus. When setting up
  the placeholder for an orphan clue at the top, we should not set selectionEnd
  in the placeholder in the clue in the clues table.

### Version: Exolve v0.67 April 18 2020

- Bug fix: For a non-numeric clue label (say, "P") with specified grid-position,
  there were a couple of places where the code tried to deindex a non-existent
  clue index like 'AP' or 'DP'.
- Now allow "regular" clue numbers like 16a, 42a, 5d, and 17D in exolve-colour
  and exolve-nina (apart from A16 and D17 as previously allowed).

### Version: Exolve v0.66 April 16 2020

- The chessboard notation breaks down when there are more than 26 columns.
  Extend it to allow squares to also be specified using an explicit row number
  and column number, like "r12c33" or "c33r12" (both are allowed). Row numbers
  are counted starting from the bottom row at 1, going upwards. Column numbers
  are counted starting from the leftmost column at 1, going towards the right.
- In exolve-nina and exolve-colour, also allow entire lights to be specified,
  like "A12" and "D42".

### Version: Exolve v0.65 April 15 2020

- Create all the puzzle HTML in the init() function, so that the HTML file
  looks much simpler. Future HTML changes are going to be made through
  js. But keep the code backwards compatible (if the html already has an
  'outermost-stack' element, just use it).

### Version: Exolve v0.64 April 13 2020

- Allow grids without any clues at all.

### Version: Exolve v0.63 April 6 2020

- Mention that placeholders will be cleared in the second "clear all" in
  the confirmation dialog for the first click on "clear all" 
- Allow enums to also use periods.

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

