# Exolve

## An Easily Configurable Interactive Crossword Solver

### Version: Exolve v1.57 May 1, 2024

Exolve can help you create online interactively solvable crosswords (simple
ones with blocks and/or bars as well as those that are jumbles or are
diagramless or are 3-D, etc.) in any language.

The file [exolve.html](exolve.html) contains *all* the code you need: just
make a copy and then replace the part that contains the example grid with your
own puzzle specification, starting at the `exolve-begin` line and ending at the
`exolve-end` line.

The files [exolve-m.html](exolve-m.html), [exolve-m.css](exolve-m.css),
[exolve-m.js](exolve-m.js) have the same  content as
[exolve.html](exolve.html), except that it is split into separate parts: HTML
(including the puzzle specification), CSS, and JavaScript. This allows the
JavaScript and CSS to be reused across multiple puzzles.

Another simple option is to just use the
[exolve-m-simple.html](exolve-m-simple.html) file: this is essentially a copy
of [exolve-m.html](exolve-m.html), but it does not require you to host the
[exolve-m.css](exolve-m.css) and [exolve-m.js](exolve-m.js) files, as it
links to their latest copies on a website that I maintain, hosted on GitHub.

Yet another option is to embed the Exolve puzzle within arbitrary web pages
(like blog posts) in a "widget". See the details in the
[Exolve widget](#exolve-widget) section.

The [Exolve Player](https://exolve.app) web app can be used to play crossword
files in several formats (including .puz and even just the clues copied from
a PDF in many cases). An easy-to-remember URL for this web app is
[exolve.app](https://exolve.app).

You can also use the file [exolve-embedder.html](exolve-embedder.html) to
serve .puz and .ipuz files using Exolve. See the details in the
[Exolve Embedder](#exolve-embedder) section.

Here is an example of the puzzle specification:

```
exolve-begin
  exolve-width: 5
  exolve-height: 5
  exolve-grid:
    HELLO
    O.A.L
    WORLD
    L.G.E
    STEER
  exolve-across:
    1 Greeting (5)
    4 Earth (5)
    5 Guide (5)
  exolve-down:
    1 Emits cry (5)
    2 Big (5)
    3 More ancient (5)
exolve-end
```

The format is very simple and uses plain text (but the parsing code is
also occasionally simplistic and not very forgiving, so please go through the
format documentation). The setter has the option to provide solutions (as in the
example above), or to just use 0 to indicate a square that needs to be filled
(i.e., is a part of a "light," in crossword terms).

A few example puzzles are also included in this directory, each in a file with
the ".exolve" extension. These showcase some of the available features, such as
ninas, additional clues or questions, submission, barred puzzles, diagramless
puzzles, etc. To try one of these, create a copy of [exolve.html](exolve.html)
and edit it as described above, splicing in the whole .exolve file from
`exolve-begin` to `exolve-end`. A whole suite of test-\*.html files is also
available in this directory. I use them to test new releases, but you can use
them to see examples of usage of most Exolve features.

## Controls
The basic control is to click on a square and enter a letter in it. If a square
is a part of both an across clue and a down clue, then clicking on that square
while it is the current square (or pressing the Enter key) will toggle the
active direction (unless the shift key is also pressed with a click, in which
case no directon-toggling will happen, which is useful when navigating back
to the grid from some other input element).

The control buttons (*Clear this*, *Clear all!*, *Check this*, *Check all!*,
*Reveal this*, and *Reveal all!*) work as suggested by their names ("this"
refers to the currently selected light(s)). You can click on a clue to jump to
its squares. If the setter has not provided all solutions, then only the
"Clear this/all" control buttons are shown, the "Check/Reveal" buttons do not
get shown.

The "Clear this" button at first only clears letters that do not cross other
fully filled lights, if there are any. If there are none (i.e., if all remaining
letters in the current light also cross other fully filled lights), only then
will these remaining letters get cleared.

A long click on either of "Check this" or "Reveal this" will toggle the text
"this" to "cell," and the checking/revealing will then only happen on the
current cell (as opposed to the whole light), for that particular activation
of the button. Caveat: this does not seem to work on phones and tablets (only
tested on Android devices though).

Setters can use [`exolve-option`](#exolve-option) `show-cell-level-buttons`
to additionally show an extra row of buttons containing these two cell-level
buttons: "Check cell" and "Reveal cell."

Exolve supports diagramless puzzles, where the blocked squares are not
identified and the solver has to figure out their locations. In fact, exolve
supports *partially* diagramless puzzless, where only some squares or some
partial areas of the grid do not show where the blocked squares are. While
solving such a puzzle, the solver can press the space bar in a diagramless
square to posit that it is a blocked square (the dark square character, ⬛,
will get placed in that square. It can be deleted just like any other regular
entry). Further, when a user enters or clears a blocked square in a diagramless
cell, the appropriate action will also be taken in the square that is the
symmetric counterpart of the current square.

If the setter has provided annotations by appending annotations at the end of
some clues, then these annotations get shown when the solver clicks
"Reveal all!". Clue-specific annotations get revealed/hidden with
"Reveal/Clear this" buttons (unless the clue only has diagramless cells).
Additionally, "Check this" and "Check all!" behave like "Reveal this" and
"Reveal all!" respectively, if they find no mistakes. In a puzzle in which
solutions are not provided, the "Reveal this" button will still get shown if
there are any clues for which annotations are present (these annotations may be
full solutions or just hints, possibly).

If the setter has provided the location of one or more ninas (through
[`exolve-nina`](#exolve-nina) sections), then an additional button control,
*Show ninas*, gets shown, for the solver to see where the ninas are. The button
can be clicked again to hide the nina locations. Ninas also get shown on
clicking "Reveal all".

If the setter has asked additional questions in the puzzle (through
[`exolve-question`](#exolve-question) sections), then input fields for these get
shown too. "Reveal/Clear all" controls buttons also include revealing/clearing
answers to these questions apart from showing/hiding annos/explanations/ninas.

If the setter has set up a submit URL (with an [`exolve-submit`](#exolve-submit)
section—the URL can be set up using a Google Form, for instance), then there is
a *Submit* buttion.

When the solver enters a letter in a square, the cursor automatically jumps to
the next square for the currently active clue (the next square can be from a
different clue, when there are linked clues that "cover" multiple clues).

If the solver changes a cell entry from a non-blank letter to a different
non-blank letter, then that changed letter is highlighted by showing in a
different colour for a short while. This animation's
[start/end colours (`overwritten-start` and `overwritten-end`)](#colour-schemes)
and the [duration (`highlight-overwritten-seconds`)](#exolve-option) can be
configured.

If the solver hits the delete key, it will erase the contents of the current
square without advancing.

The solver can press Tab/Shift-Tab to navigate to the next/previous clue. The
solver can use the arrow keys to navigate to the next/previous light cells in
the direction of the arrow.

The software tries to keep the current clue visible when scrolling, as long
as the square with the cursor is visible.

"Clear/Check/Reveal all" buttons, the "Show ninas" button, and the "Submit"
button solicit additional confirmation from the solver.

Clicking on a clue in the clues table makes that clue active. If that clue
was not the previously active clue, then the keyboard focus goes to the
first letter of that clue, in the grid. If the clue was already active,
then the focus stays with the clue, letting you select and copy parts of
the clue/anno if needed.

You can click on the black background or on the puzzle title, setter, or
preamble (if present) to unhighlight the current clue (for printing or
screenshotting, for example).

## Extended chessboard notation
In a few cases (such as when specifying colouring or ninas or locations of
some clue numbers in diagramless puzzles), you might need to specify the location
of a square in the grid. You can do that in one of the following ways:
```
a3 (column "a": the 1st column from the left, and row 3 from the bottom)
f11 (column "f": the 6th column from the left, and row 11 from the bottom)
```
The letters (a-z) must be in lower case and must precede the row number, with
no intervening space.

This chessboard notation is insufficient if your grid has more than 26 columns.
You can directly specify the row and the column too, like this:
```
c1r3 (the 1st column from the left, and row 3 from the bottom)
r11c6 (the 6th column from the left, and row 11 from the bottom)
```

## Exolve format overview
The puzzle can contain the following "sections" between the `exolve-begin` line
and the `exolve-end` line:

* **`exolve-width`**
* **`exolve-height`**
* **`exolve-grid`**
* `exolve-title`
* `exolve-setter`
* `exolve-email`
* `exolve-id`
* `exolve-copyright`
* `exolve-credits`
* `exolve-preamble` / `exolve-prelude`
* `exolve-across`
* `exolve-down`
* `exolve-nodir`
* `exolve-reversals`
* `exolve-3d`
* `exolve-3d-across`
* `exolve-3d-away`
* `exolve-3d-down`
* `exolve-explanations`
* `exolve-nina`
* `exolve-colour` / `exolve-color`
* `exolve-question`
* `exolve-submit`
* `exolve-option`
* `exolve-language`
* `exolve-relabel`
* `exolve-maker`
* `exolve-force-hyphen-right`
* `exolve-force-hyphen-below`
* `exolve-force-bar-right`
* `exolve-force-bar-below`
* `exolve-cell-size`
* `exolve-postscript`

Each section has the section name (`exolve-something`), followed by a colon.
Other than the `exolve-preamble`/`exolve-prelude`, `exolve-grid`,
`exolve-across`, `exolve-down`, `exolve-nodir`, `exolve-explanations`, and
`exolve-postscript` sections, all other sections occupy a single line (some can
be repeated though). For such single-line sections, the "value" of the section
is the text following the colon on the same line.

The bolded sections, namely, `exolve-width`, `exolve-height`, and
`exolve-grid` are required. The other sections are optional, but
`exolve-across`, `exolve-down`, `exolve-title`, `exolve-setter` should probably
be present in most puzzles.

Any line (or trailing part of a line) that begins with a "# " is treated
as a comment and is ignored. A "#" with an end-of-line after it is also treated
as a comment. Note that a "#" with a non-space character after it is NOT treated
as a somment (this is so because we may have HTML colour names such as #FF00FF
in `exolve-colour` sections, and we may have clues in which their grid-location
is indicated in the #xN
notation—[see this section](#extended-chessboard-notation)). I did not use
"//" as the comment marker as it is used in URLs.

Any text appearing before `exolve-begin` or after `exolve-end` is ingored.

## `exolve-width`, `exolve-height`
The width and height of the puzzle—i.e., how many squares across and how many
squares down is the crossword grid. Example:
```
  exolve-width: 15
  exolve-height: 15
```

## `exolve-grid`
The grid specification starts from the line *after* the `exolve-grid` line and
goes all the way to the next `exolve-something` section. There should be exactly
as many lines in this section as the height of the grid. On each line, the
squares in that row of the grid are specified.

There are two kinds of puzzles: with solutions provided and without solutions
provided. Here are simple examples of both:

Grid with solutions provided:
```
  exolve-grid:
    ACE
    R.R
    EAR
```
This is a 3x3 grid with one blocked square in the center ("." is used to
indicate blocked squares). In this grid, 1 Across = ACE, 1 Down = ARE,
3 Down = ERR, and 3 Across = EAR. When solution letters are included like this,
the control buttons for checking/revealing answers get shown. 

In a grid with solutions provided, setters may use the letter '?' as a
placeholder in any light square for which they have not yet decided what
letter to place.

Grid without solutions provided:
```
  exolve-grid:
    000
    0.0
    000
```
This is also a 3x3 grid, but no solutions have been provided (every light is
shown using the letter "0"). In such a grid, the control buttons for checking/
revealing answers do not get shown.

It is also possible to specify barred grids, instead of blocked ones. In fact,
it is possible to specify a a grid that uses both bars and blocks. Bars (and
some other special treatments) are specified using letters that follow the main
grid square specifier, which we'll refer to as *decorators*. A bar to the right
of a square is specified using the decorator |. A bar under a square is
specified using the decorator \_. A square that has both a bar after and a bar
under can use "|\_" or the shortcut for that, "+". Arbitrary many spaces are
allowed between grid square specifications, and spaces can (*should!*) be used
to line up the squares in the presence of decorators. Here is an example 3x3
grid that uses both bars and blocked squares:
```
  exolve-grid:
    A M|B
    X . E
    E|A T
```

The decorator "@" can also be used to inscribe circles inside some squares, and
the decorator "\*" can be used to indicate that a square is to be diagramless.
Here's the last example again, this time with circles around some cells, and
some cells being diagramless:
```
  exolve-grid:
    A  M|@B
    X* .  E*
    E| A  T
```

The decorator "!" can be used to mark a cell as pre-filled (its solution letter
must be provided). The solution letter will be pre-filled and will not be
editable. If all entries in a light are prefilled, and an anno is provided
for that clue, the anno will be shown automatically at start-up. Even if no anno
is given for a fully prefilled clue, the solution will be displayed at the
end of the clue (unless the no-auto-solution-in-anno option is set).

The decorator "\~" can be used to mark a cell that starts an across/down clue
as one in which normal clue numbering should be skipped. Such a cell gets
no clue number. The clue number that it *would* have got will instead be
used for the next cell that starts a clue. The light(s) that start at such
"skipped number" cells would have to be clued in some other way (for example,
with a clue that is specified or revealed separately). One way the clue can
be provided is with a [nodir clue or a non-numerically labelled
clue](#exolve-across-exolve-down-exolve-nodir), as described later.

As a convenient reference, here again is the complete list of decorators:
| Decorator | Meaning                            |
|-----------|------------------------------------|
| `\|`      | Has a bar after it, to the right.  |
| `_`       | Has a bar under it. at the bottom. |
| `+`       | Has bars both after and under.     |
| `@`       | Has an inscribed circle.           |
| `*`       | Is diagramless.                    |
| `!`       | Is prefilled.                      |
| `~`       | Skips normal numbering             |

If you use a language/Script that uses compound letters made up of multiple
Unicode characters (for example, Devanagari—see the
[`exolve-language`](#exolve-language) section), or if you have
[rebus cells](#rebus-cells), then your _must_ separate grid
letters (when specifying a grid with solutions) with a space (unless they are
already separated by a decorator). For example, this will *not* work:
```
  exolve-grid:
     सेहत
```
This will work:
```
  exolve-grid:
     से ह त
```

### Digits and special characters

Normally, only the letters of the alphabet (A-Z, or script-specific) can be
used in solution letters. However using [`exolve-option`](#exolve-option)
`allow-digits` or `allow-chars:<chars>`, you may allow some non-alphabetic
characters. If any of these characters is also a decorator or has a special
meaning in grid specifications (i.e., is one of `|_+@!~*.?`), then it should
be prefixed with `&` in the grid specifications. If `&` itself needs to be used
in the grid, then it too should be prefixed with an `&`. For example:
```
  exolve-option: allow-chars:@.&
  exolve-grid:
    A &@ B &. C O M
    && . . .  . . .
```    

Even though `0` has a special meaning in grid specifications, you do not
have to escape `0` using an `&` prefix if `0` has been allowed in the grid via
`allow-digits` or `allow-chars`. A technical caveat (for the sake of
completeness) is that you cannot create a degenerate grid that has all entries
made up entirely of `0s`.

### Rebus cells

If you want the crossword solution to include some cells that have multiple
letters (aka "rebus cells"), then you have to use `exolve-option: rebus-cells`
(and you *have* to separate grid solution entries with spaces as mentioned
earlier).

For example:
```
  exolve-width: 3
  exolve-height: 3
  exolve-option: rebus-cells
  exolve-grid:
    RAN G E
     DO . A
      M E T
```

If there are rebus cells, then you can enter multiple letters into any
cell after double-clicking on it, or by pressing down the Shift key while
entering a letter. If a cell already has previously entered multiple letters,
then when you come to it again (by clicking on it or auto-advancing from
an adjacent cell), you will be able to enter multiple letters into it (without
having to use the Shift key or double-click).

When multiple letters are entered into a cell, the font size of cell text is
adjusted to try to fit all the letters. If you have some long rebus entries
that do not fit the default cell size then you should use bigger cells, using
[`exolve-cell-size`](#exolve-cell-size).

If there are rebus cells, then the across-direction indicator arrow in the
current cell is placed below the text intsead of to the right of it, to leave
more space for the text.

You cannot have rebus cells in crosswords that use languages with
max-char-codes greater than one and in crosswords with diagramless cells (this
allows us to keep the code simpler).

### Some details about diagramless cells
Note that "diagramlessness" only hides from the solver whether a square is
in a light or is a blocked square—if the setter has used any bars, they do get
displayed to the solver, even in diagramless cells.

If a puzzle with diagramless squares has specified all solutions, then
check/reveal controls get displayed. For example, revealing a blocked
diagramless square will show the dark square character, ⬛, in that square. 

If the setter wants to *not* provide solutions for a puzzle that has some
diagramless squares, then the blocked square marker (".") should not be used
in the blocked squares that are also diagramless (otherwise the solver can peak
into the HTML source and see where the blocked squares are). Each diagramless
square in such a puzzle should be specified with a "0" followed by the
diagramless decorator, i.e., as "0\*". But then, even the Exolve software has no
way of knowing which grid square any clue starts on. However, sometimes, even
in a puzzle with diagramless squares, the setter may want to provide the clue
start locations for *some* clues. Exolve provides a way to do this: the setter
can optionally include the location of the square where a clue starts for any
clue, using the extended chessboard notation. Details are provided in the next
section.

## `exolve-title`, `exolve-setter`
The title of the puzzle and the name/pseudonym of the crossword setter. Example:
```
  exolve-title: My Lovely Crossword
  exolve-setter: Narsi Sus
```

## `exolve-email`
Optional email address (or comma-separated addresses) where solvers can contact
the crossword creator(s). From the "Notes" panel, you can send your notes to
this email address.

## `exolve-id`
Optionally provide a unique id for this crossword puzzle. This id is used as
the key for saving/restoring state and also to distinguish between multiple
puzzles on a single page. You can create an unsolved version of a puzzle (to
run a contest, for example) and, later, a version of the same puzzle that has
the solutions, giving them both the same `exolve-id`. Then, when solvers visit
the version with solutions, they can see their own entries and see which
mistakes they made, if any. Example:
```
  exolve-id: tiny-42
```

If you do not provide an id, the software will create one from a signature of
the grid and the clues. This will ensure that if you load the same crossword
without making any changes to the clues or the grid, then you will recover
the state, even without an explicit id.

## `exolve-copyright`
If your provide this, it will be displayed with the copyright symbol, under
the rendered puzzle grid. Example:
```
  exolve-copyright: 2019 Viresh Ratnakar
```

## `exolve-credits`
If your provide this, it will be displayed under the copyright. You can provide
multiple instance of this.
Example:
```
  exolve-credits: Test solver: Zaphod Beeblebrox
  exolve-credits: Custom code: H. A. C. Ker
```

## `exolve-preamble`, `exolve-prelude`
Crossword puzzles often come with a preamble that contains special instructions
and/or hints. The preamble text occupies multiple lines—starting from the
line *after* the `exolve-preamble` (or `exolve-prelude`) line, and going all the
way down to the line preceding the next `exolve-something` section. The preamble
may include HTML tags. The preamble is rendered just above the grid, in the
rendered puzzle. Example:
```
  exolve-preamble:
    Words should be entered in the grid <i>after</i> deleting one letter. The
    letters thus deleted, in clue order, form the name of a famous farm
    animal.
```

## `exolve-across`, `exolve-down`, `exolve-nodir`
The `exolve-across` and `exolve-down` sections should be used to specify the
across and down clues, respectively (`exolve-nodir` is for the special/rare case
of clues that do not have a specified direction; we will describe it at the end
of this section). There should be one clue per line, and there should not be any
blank lines. The clues should start with the clue number, and end with the
enum (the enum is not strictly required). Example:
```
  exolve-across:
    1 Untouchable service (3)
    3 Listener (3)
  exolve-down:
    1 Happen to be (3)
    2 Make a mistake (3)
```

If the enum indicates multiple words (for example, *(4,3)* or *(6 7)*), or if
the enum indicates hyphenated words (for example, *(4-2)*), then the word
boundary or the hyphen gets displayed in the grid, to help solvers. The
software uses the following criteria to decide what constitutes the enum part
of a clue: a pair of opening and closing parentheses, containing only numbers,
hyphens, commas, apostrophes, spaces, and periods, starting with a number. The
software also treats a pair of parentheses containing the text "words" or
"letters" (or any subword beginning with "w" or "l", such as "wrds" or "l" or
"ltrs") or containing "?" with anything before it, as an enum (to allow the
setter to specify the enum as "(two words)" or "(?)" or "(7, 2w)", for example).
Within these special cases, in the corner cases of "(7, 2words)" and
"(6 letters)", the parsing interprets 7 and 6 respectively to be the length of
the entry, and will check it against the length of the light as with a normal
enum.

In the rare case that there are multiple candidate enum parts in a clue, the
last one is used. However, this can be overridden by explicitly using "[]"
to mark the end of the clue (see [`Annotations`](#annotations) below).

In a 3-D crossword, instead of `exolve-across` and `exolve-down` you should use
`exolve-3d-across` and `exolve-3d-away` sections, respectively, with an
`exolve-3d-down` section providing the clues for the vertical lights through
the layers. You can find the details in the [`exolve-3d`](#exolve-3d) section.

### Suppressing enums or separators

If the enum is immediately followed by a `*`, then it is not displayed to the
user. Examples:
```
  1 Satellite (4)* MOON
  2 Star (?)*
```

There might be puzzles where, even though the enum indicates multiple or
hyphenated words, you do _not_ want a word-separator bar or a hyphen to be
drawn in the grid. An example would be a grid where the special instructions
ask for a letter to be removed before entering a solution into the grid. You
can achieve this effect using the following bit of trickery:
```
  1 Clue with enum that implies hyphens and dashes, but they are suppressed
    using trickery (<span>3,2-2,5-3</span>) (15)* Anno here...
```
Note that the enum numbers are wrapped in a &lt;span&gt; tag, which tricks
Exolve into not parsing them. The length of the entry is specified after that,
using the enum spec (15)\* that does not get displayed (but serves as a way
to let Exolve know that what follows is the anno).

### Missing clues and mismatched enums

If there is a missing clue, or if the provided enum for a clue does not
match the number of cells in the clue as per the grid (including any linked
children clues), then a warning message gets shown. If the anomaly is
deliberate rather than an oversight, the warning generation can be suppressed
using `exolve-option: ignore-unclued` and/or
`exolve-option: ignore-enum-mismatch`. Checking for missing clues is not
done if there are any nodir clues, and checking for mismatched enums is
not done if there are any diagramless cells.

### Hints

You can include hints in clues (in some clues or in all clues). This is done
by providing a sequence of lines immediately under the clue, each one carrying
the prefix, `Hint:` (case-insensitive). Each hint can include HTML formatting.
Example:
```
  exolve-across:
  1 Some clue without a hint (9)
  5 A clue with two hints (5)
    Hint: The <i>first</i> hint!
    Hint: The second hint is noticeably longer.
  6 A clue with one snarky hint (6)
    Hint: Try using your brain for a change?
```

Note that these hints are completely independent of the post-reveal annotation
desribed below (if present). When hints are available for the current clue, and
not all hints have yet been shown, a lightbulb icon is shown at the end of the
clue (above the grid only, not in the clues table). Clicking on this icon will
reveal the next hint. Clicking on any hint will hide all the hints once again.

Exolve does not save state about how many hints were shown for various clues, so
if you reload the puzzle then all hints restart in the not-shown state.

### Annotations
In a grid with solutions provided, the setter may include annotations for
explaining how a clue works or for providing hints. Any text located after the
enum in a clue is treated as annotation. The annotation is displayed when the
solver clicks on the "Reveal all" button or on the "Reveal this" button when
that clue is the current clue. Example:
```
  exolve-across:
    28 Replace bottles containing questionable medicine (7) Def: questionable medicine. Hidden word: (-re)PLACE BO(-ttles).
```

If a clue does not provide its anno, the software still creates a minimal anno
consisting of just the solution text (that it infers from the grid and the
enum). Even if the anno is provided, the software prefixes it with the inferred
solution text. This might have meant that if in an older grid the solution
was explicitly included in the anno, it would have got duplicated. So, the code
does check to see if the solution string (punctuation/markup notwithstanding)
is present at the head of the anno, and avoids duplicating it if so. If the
setter wants to present the solution in some other way, they can suppress the
automatic addition of the solution to the anno by adding this line to the puzzle
specs:
```
    exolve-option: no-auto-solution-in-anno
```
This option only suprresses the solution getting added to the anno appearing
after the clue. The solution does still get added to the [placeholder blank
slot of an orphan clue](#jigsaw-puzzle-clues), upon "Reveal this," even with
this option.

If the leading part of the anno needs to be something in square brackets, such
as "... (6) [t]WITTER ...," then setters should include the solution before
that (even if it can be inferred from the grid), to avoid misinterpreting the
leading part as the solution, like "... (6) [WITTER] [t]WITTER ..." Or, they
can use an empty pair of square brackets to mark the end of the clue, like
"... (6) [] [t]WITTER ..." The special "[]" clue-end marker string is also
useful if there is any ambiguity about where the clue ends (perhaps because of
multiple enum-like substrings) that cannot be resolved by providing the
solution in square brackets.

Here are some more complex examples of enum/annotation parsing.
```
  1 This (13) clue ends (word) here! (4)
  2 This (13) clue also ends (1 word) here! (4) Some annotation follows.
  3 This (13) clue also ends (2 letters) here! (8) [SOLUTION] Some annotation follows.
  4 This (13) clue also ends (words) here! (8) [] [t]WITTER The anno has (3) enum-like parts.
  5 This is an enum-less and anno-less clue that ends here!
  6 This is also an enum-less and anno-less clue that also ends here! (?)*
  7 This is also an enum-less but with-anno clue that also ends here! (?)* [] [t]WITTER Here is the anno.
  8 This clue, even though its anno contains an enum-like substring, ends here! (4) The (word) and (4 letters) enum-like parts here are not numeric.
  9 This clue (13) does not end now (4) as [square brackets do not follow immediately]; it ends here! (4)
```

#### In-clue annotations
You can also decorate sub-phrases in the clue with underlines, different styles,
colours, backgrounds, etc., by enclosing specific substrings with the special
markers, `~{` and `}~`, like this:
```
    28 Replace bottles containing ~{questionable medicine}~ (7) Hidden word: (-re)PLACE BO(-ttles).
```
The default styling for such "in-clue annotations" is to underline the
text with a "darkgreen" underline. This styling will get revealed when the
solver clicks on "Reveal this" or "Reveal all" (and will get cleared with
"Clear this/all").

You can apply different in-clue annotation styles (instead of underlining),
by providing an HTML element class name, like this:
<!-- {% raw %} -->
```
    28 ~{{xlv-blue}Replace}~ bottles ~{{my-style}containing}~ ~{questionable medicine}~ (7) Hidden word: (-re)PLACE BO(-ttles).
```
<!-- {% endraw %} -->
Here, "xlv-blue" is a class name that Exolve has set up in its CSS (some others
are "xlv-red", "xlv-yellow-bg", and "xlv-pink-bg"). But you can use your own
class names too (such as "my-style" above) and specify their stylings with your
own custom CSS rules.

### Linked lights and clues
If a linked clue includes other "children clues," this can be indicated by
appending a comma-separated (or &amp;-separated) list of children clue numbers
to the parent clue number. Example:
```
  exolve-across:
    1, 5, 2d In spite of adverse circumstances (7,3,4)
    5 See 1 Across
    ...
  exolve-down:
    2 See 1 Across
    3 & 7 See neck (4,3)
    7 See 3 Down
```
As shown in the above examples, if a child clue (2d in the first example) has a
different direction from the parent, the direction can be specified with a
one-letter suffix ("a" or "d" or "b" or "u"), or, in 3-D crosswords, with
a two-letter suffix ("ac" or "aw" or "dn" or "ba" or "to" or "up").

Linking lights can create two corner cases that are noteworthy. (1) When a
light ends on the same cell where the next linked light starts, then that
cell is *not* counted twice. So, in a 3x3 grid with 3-letter lights 1a and 2d
linked, where 2d starts on the same cell as where 1a ends (cell r3c3), the total
length of the linked lights would be 5 not 6. (2) If you link a sequence of
lights (including some reversed lights) such that the last cell of the linked
group is exactly its starting cell, then that cell is also not counted twice.
Further, the interface lets you type letters in a loop along the sequence (as
that seems to be the fun thing to do for this corner case). For backspacing
(when erasing) cells in such a snake-swallowing-its-own-head loopy linked
group, the interface stops the backspacing at the first cell.

### Filled clues
While solving, when a light is fully filled in, its clue number changes
colour (to a light shade of blue, making the unsolved clue numbers stand out).
There are some minor exceptions when this does not happen (diagramless cells
or other reasons that don't let us determine when a clue's light is fully
filled). For such clues, the solver can click on the clue number to set (or
unset) its "has-been-solved" state manually.

As mentioned in the previous section, in a grid that has diagramless squares
and that does not provide solutions, if the setter wants to display some clue
numbers in squares, they can do so by prepending the clue (in the
`exolve-across` or exolve-down section) with "#&lt;L&gt;", where &lt;L&gt; is
the location of the square in the
[extended chessboard notation](#extended-chessboard-notation).
Examples:
```
  exolve-across:
    #a9 15 Imprison and tie perhaps
    #c17r42 31 Greeting
```
Here, the clue number 15 will get displayed in the square that is in the first
column and the 9th row from the bottom, and 31 will get displayed in the 17th
column and 31st row.

### Filler lines between clues
Any line in a clues section (i.e., in
`exolve-across`/`exolve-down`/`exolve-nodir`) that cannot be parsed as a clue or
hint is treated as a filler line. It is simply displayed in that position in the
list of clues. It is an error to place a filler line after the last clue in a
clues section. Filler lines can be used to demarcate sections within clues, if
needed. Example:
```
  exolve-across:
    1 Communication device (5)
    7 Greeting (5)
    <i>The following entries all begin with B.</i>
    9 Unreachable sound in 1 (4,4)
    15 Zaphod (10)
```

### Splitting long clue lists
Any line in a clues section that starts with --- initiates the rendering of
a new table of clues. If any text follows --- then it gets shown as the
heading of the new table.

### Order of rendered clue lists
The order in which the exolve-across, exolve-down, and exolve-nodir sections
appear in the puzzle specs is the order in which they will be displayed.
Additionally, direction-toggling will also follow the same sequence. Thus,
if you list nodir clues before across and down clues, and the solver clicks
on a cell that does not have a light in the currently active direction (say
Across), but does have both a nodir light and an across light going through
it, the nodir light will become active (as nodir clues are listed before across
clues in the specs).

### Non-numeric clue labels
If you want to use non-numeric clue labels (such as A, B, C, etc.), you can
do that by enclosing the non-numeric clue label in square brackets, like this:
Example:
```
  exolve-across:
    2 Imprison and tie perhaps (6)
    [F] Enjoyable (3)
    5 Hitchhiker's accessory (5)
    #a12 [G], 4, [H] Fitting reply (3,3,3)
    ...
```
For non-numeric clue labels, the software does not know which cell the clue
begins in, unless it is specified explicitly by the setter using a "#xN"
prefix as described above and shown in the fourth clue example above.

### Trailing period in clue labels
A trailing period after a clue number or label is considered to be just a
punctuation mark and is ignored. The first five periods in the following
example get ignored. If you have consecutive periods, they do not get ignored
(as you're presumably using an ellipsis).
```
    2. Clue (4)
    3.Ignorance is _____ (5)
    4 . Time for every one to end, finally (6)
    [Q.]. Hop... (4)
    [R] ... aboard! (6)
```

### Some details about clue numbers
Across and down clue numbers within the grid are automatically inferred from
the grid, except in two cases. The first is when there are diagramless cells
and solutions have not been provided. The second is in jigsaw-style puzzles,
where the setter opts to deliberately not provide associations between grid
squares and clues, by using non-numeric clue labels without providing their
grid locations. When the solver is entering a value in a light for which the
clue association is not known, the highlighted "current clue" browsable
interface runs through all the clues for which all grid cells are not known.

Clue numbering can be affected by the following additional factors covered in
other sections:
- The "skip numbering" decorator ('~') covered above in the
  [`exolve-grid`](#exolve-grid) section.
- [`exolve-reversals`](#exolve-reversals)
- [`exolve-3d`](#exolve-3d)

### Clues without a specified direction
If you want to create a section of clues without a specified across/down
direction, you can use an `exolve-nodir` section, which has the same structure
as `exolve-across` and `exolve-down`, but the direction of each clue in this
section is considered unspecified. Setters would probably want to use this
section with non-numeric clue labels. Example:
```
  exolve-nodir:
    [P] Direct (5)
    [Q] Server spilling one's drink (5)
    ...
```
The clue label in [] can be numeric too, (like [42]), and the starting cell can
also be specified using a "#&lt;L&gt;" prefix (with &lt;L&gt; being a cell
location in the [extended chessboard notation](#extended-chessboard-notation))
as described above.

If the setter is using  nun-numeric clue labels or clues without a specified
direction, then they should probably also use the option "hide-inferred-numbers"
in an [`exolve-option`](#exolve-option) section. Alternatively, they can use
the "\~" decorator in the grid to skip numbering the cells using normal
numbering.

You can provide a heading for nodir section by placing it after
`exolve-nodir:`, like this:
```
  exolve-nodir: Alphabetic clues
    [P] Direct (5)
    [Q] Server spilling one's drink (5)
    ...
```

### Nodir clues with cells explicitly specified
In a nodir clue, you can specify not just the starting cell, but _all the cells_
using the chessboard notation. If you do that, then clicking on a cell in that
clue will highlight and allow entry in all the cells for that clue (cells in
a nodir clue can be scattered arbitrarily in the grid). Example:
```
  exolve-nodir:
    #c3 #c5 #c8 #f6 [A] One hundred years lived in prison (4)
```
Note that this technique can be used to create multidimensional (like 4-D!)
puzzles: use a nodir section for specifiying lights along all the extra
dimensions, explicitly specifying their cells. For 3-D crosswords, Exolve
provides better and more complete support, including a nice 3-D appearance
(see the [`exolve-3d`](#exolve-3d) section).

### Skipped-number cells and clues with cells specified
If an across/down clue's start cell has the decorator "\~", its normal numbering
gets skipped. If there is another clue that is either an across/down clue
with a non-numeric label and with its start cell specified, or is a nodir
clue with all its cells specified, and all the cells of the two clues are the
same, then the clues get merged. The label specified for the second clue
gets shown in the skipped-number cell. For example:
```
  exolve-grid:
    0~0 0
    0 . 0
    0~0 0
  exolve-across:
    #a1 [B] Bottom row (3)
  exolve-down:
    1 Third column (3)
  exolve-nodir:
    #a3 #b3 #c3 [Q] Top row [3]
``` 
Here, the top-left and bottom-left cells are skipped-number cells. The [B]
across clue gets merged with the bottom row light, and the [Q] nodir clue
gets merged with the top row light. The light in the first column is unclued.

### Jigsaw puzzle clues
If there is any nodir clue without cells explicitly specified, or an
across/down clue with a non-numeric label whose start/cells are not specified,
then the clue is shown with a text entry area next to it. Solvers can record
their solutions here, until they figure out where in the grid those letters
should be entered. Solvers can transfer recorded letters from these placeholder
areas by simply clicking the "copy-placeholder" button (that looks like [⇲])
next to the placeholder area, whenever they have some squares highlighted for
entry in the grid.

You can force a placeholder blank to appear after any clue (not just "orphan"
ones that qualify using the criteria listed above). See the next sub-section.

The placeholder entries do NOT get cleared with 'Clear this/all' (they can
simply by erased directly by clicking on them and deleting though). For clearing
all placeholder entries forcibly, click on the 'Clear all' button when there are
no entries in the grid (eg, by clicking on it a _second_ time). This option is
only there in puzzles that have such placeholder entries, and in such puzzles, a
tooltip is shown over the 'Clear all' button to let the user know.

The same placeholder text and the copy-placeholder button ([⇲]) are also shown
in the highlighted scrollable 'orphan' clues widget, whenever the currently
highlighed squares do not have a known clue association.

The copy-placeholder button feature does not get activated if there are any
diagramless cells (as only one diagramless cell is active at a time generally).

The copy-placeholder buttons can be disabled (i.e., not shown at all) by
specifying `exolve-option: hide-copy-placeholder-buttons`. This is useful if
you find the buttons distracting in appearance, or if copying from the
placeholder is not very useful for some other reason (for eg., lights are split
into parts).

Within such clues, in grids with solutions provided, it is possible to indicate
which cells in the grid belong to the clue, for use in "Reveal this" and "Check
this." This is done by listing in square brackets a space-separated sequence of
clue indices and/or cell locations. Clue indices can be like 12a or 12A or 13d
or 13D (must include direction, just like the way these are specified in
`exolve-nina` and `exolve-colour`). If any clue indices are used in the
specified sequence, then those clues themselves must have some of their cell
locations known. This listing should be present right after the enum part, if at
all.  Examples:
```
  exolve-nodir:
    [A] Some clue (5) [1a]
    [B] One hundred years lived in prison (4) [2d]
    [C] Some other clue ... (?) [3d 4a c4 c5 r5c3] [SOLUTION HERE] Anno...
```
In the last clue above, there is no enum provided. Even though the software
knows all the cells of this clue, it does not know if there are multiple
words or hyphens. The solution in such cases can be provided in square brackets
at the beginning of the anno.

The inferred or provided solution for an orphan clue gets revealed in its
placeholder blank upon "Reveal this" and "Reveal all."

Individually listed cells, if highlighted just by themselves (which would be
the case if they are diagramless) do not let solvers reveal/check the whole
orphan clue: a single cell may be a part of multiple clues.

There are some subtle implications of providing revelations for orphan clues
in this manner. In the above example, say a light in the grid (such as 1a) that
belongs to some orphan clue (A in this case) is highlighted by clicking on one
of its cells. The current clue shown in the clues list will be last orphan clue
that the solver looked at, say B (different from A). If the solver clicks
"Reveal this" then 1a will be revealed in the grid, and A will get highlighted
in the clues list.

If, after clicking on 1a in the grid, say the solver clicks on clue C in the
clues list and then clicks "Reveal this." We infer the solver's intent from
their last click. In this case, C in the clues list will get revealed, and
the highlighting in the grid will change from 1a to whatever is the correct
light for C.

Another subtle point is that in a puzzle with diagramless cells, it's possible
for a clue to have specified some of its cells (the first few), but not all.
Its cells can be revealed by naming itself, and listing the additional cells.
For example:
```
    15 Imprison and tie perhaps (one word) [15a e9 f9] DETAIN.
```

Note also that "Reveal all" does not reveal orphan-clue-to-grid-light
associations. But, even after "Reveal all," solvers may go through orphan
clues, clicking "Reveal this" for each.

### Adding "extraction slots" before clues

A common ruse in cryptics is to make each clue somehow yield an extra letter 
and to make a meta out of those letters. Exolve allows you to add a column
of "extraction slots" before each clue. Solvers can record letters/numbers
in these slots (and these are saved in the state too). You can do this
by specifying `exolve-option: add-extraction-slots`. By default, if you
specify this option, then a *one*-letter slot is added. But you can specify
the number of letters in the slot with an optional parameter (e.g.,
`exolve-option: add-extraction-slots:3`). 

### Forcing the display of "placeholder blanks"

Placeholder blanks normally get displayed only in front of "orphan" clues whose
light locations are not provided to the solver. However, you can force a
placeholder blank next to any clue by following it with one or more underscores.
If you're providing annotations, place the undescrores before the annotations.

This can be useful to solvers when, for example, the puzzle instructions call
for some modification (such as letter omissions) to solutions before they can
be entered into the grid.

Examples:
```
  exolve-across:
    5 This clue will get placeholder blanks (4) _
    6 Here we're specifying that there should be 7 blanks, regardless of enum (4) _______
    7 The underscores can have intervening spaces and can be followed by annos (8) _ _ _ Some anno.
```

If you place just one underscore, then the actual displayed size of the blank
will be determined using the enum. If you place more than one underscore, then
the displayed size of the blank will equal the number of underscores that you
have provided. You can have spaces between these underscores just to help you
count them more easily.

The placeholder blank, when empty, will show (as the light gray "placeholder"
text that indicates a hint for what the solver needs to enter) the text pattern
implied by the enum, such as "??? ??-??" for (3, 3-3). You can override this
placeholder text by specifying what should get displayed within square brackets,
right after the last underscore. For example:
```
  exolve-down:
    3 This will have 8 placeholder blanks showing "??? ??" instead of
      "????" (4) _ _ _ _ _ _ _ _ [??? ??] Some anno.
    3 For this piece of cake, we customize the placeholder text shown
      in the placeholder blank to be "EAT ME" instead of "??? ??" (3,2) _[EAT ME]
```

The length of a placeholder blank (the number of letters that it can hold) will
be the maximum of the number of underscores and the length of the gray placeholder
text (from the enum or from the overridden text).

Just like the placeholder blanks that appear in orphan clues, these forced
placeholder blanks will also be accompanied by "copy-placeholder buttons"
(that looks like [⇲]), unless disabled by specifying
`exolve-option: hide-copy-placeholder-buttons`.

### Some clue numbering nuances
If you have a non-numeric clue label (say, P) for an across (down) clue, and
you have provided the location of its first cell, _and_ that location is
actually an across (down) light for which a clue has _not_ been provided, then
the software assumes that you wish to use the provided label, P, as the label
for that across (down) light.

You can use this feature to create a grid that has all non-numeric labels.
Example:
```
  exolve-grid:
    000
    0.0
    000
  exolve-across:
    #a3 [A] Ace (3)
    #a1 [C] Den (3)
  exolve-down:
    #a3 [A] And (3)
    #c3 [B] Ein (3)
```
Similarly, if you have a non-numeric clue label (say Q) for a nodir clue, and
you have provided the locations of _all_ its cells (that is, you have provided
the locations of at least two cells), _and_ these locations belong to an unclued
light in the grid, then the software makes the label of that light be Q.

### Deleted clues
Sometimes, when using nodir clues, you might subsume some across/down clues
entirely within some nodir clues. In such cases, you might want to not specify
any clue for the across/down subsumed clue, and you would not even want the
across/down clue to get highlighted when navigating the grid/clues. You can
mark an across/down clue "deleted" by simply setting it to \*. For example:
```
  exolve-grid:
    TUB
    A.O
    CKY
  exolve-across:
    1 tub (3)
    3 *
  exolve-down:
    1 *
    2 boy (3)
  exolve-nodir:
    #a3 #a2 #a1 #b1 #c1 [1] tacky (5)
  
```

## `exolve-reversals`
The grid implies a sequence of cells for each light (top-to-left for across
clues and top-to-bottom for down clues). You can reverse this orientation for
selected lights by specifying their starting and ending cells on one (or more)
`exolve-reversals` lines. For example:
```
  exolve-reversals: a5-a10 r10c2-r4c2
```
In this example, the across light running in the bottom row from columns
5 to 10 will get reversed, as will the down light running in the second
column from row 10 down to row 4.

Note that the starting and ending cells should be listed (separated by a
hyphen) *in their original, unreversed order.* The reversal modifies
clue/light-numbering, as the number is assigned at the new starting cell
(after reversal).

When you reverse an across clue, its distinctive letter suffix becomes "b"
(for "back") instead of "a". So you can refer to "12b" when linking clues,
when specifying lights with coloured cells, etc. Similarly, the letter
suffix for a reversed down clue becomes "u" instead of "d".

Reversals can also be done for the vertical clues in 3-D crosswords
(see below). They should not be done for general nodir clues where you've
specified the cells (as you can easily just specify the cells in the desired
order).

## `exolve-3d`
A special and popular case of n-dimensional crosswords is "3-D" crosswords, and
Exolve offers direct support to create such puzzles, rendering them in a nice
stack of layers of 2-D grids.

You can specify that a crossword is a 3-D crossword by using the `exolve-3d`
section. The number of "layers" in the 3-D scheme is specified as a parameter,
like `exolve-3d: 3`. This number must be an integer that is bigger than 1 and
must be a divisor of the height of the grid. Additionally, you can control the
appearance of the 3-D grid (which looks like stacked parallelograms, one for
each layer) with two optional parameters that follow the number of layers:
angle (in degrees, default is 55) and each cell parallelogram's height-to-width
ratio (default is 0.75). So, the `exolve-3d` line looks like:
`exolve-3d: <num-layers> [<angle-degrees> [<height-to-width-ratio>]]`.
The following line would make the parallelograms look much more "spaced out":
```
  exolve-3d: 5 45 1.4
```
And this one uses less space vertically, rendering very "squished"
parallelograms:
```
  exolve-3d: 5 35 0.6
```

The grid in a 3-D crossword should be provided layer-by-layer (starting at the
top layer). Note that the height of the grid divided by the number of layers is
the depth of each layer.

The clues in a 3-D crossword should be provided using `exolve-3d-across`,
`exolve-3d-away`, and `exolve-3d-down` clues sections (the `exolve-across`
and `exolve-down` sections should not be used).

For example:
```
  exolve-width: 3
  exolve-height: 9
  exolve-3d: 3
  exolve-grid:
    0 0 0
    0 . 0
    0 0 0

    0 . 0
    . . .
    0 . 0

    0 0 0
    0 . 0
    0 0 0
  exolve-3d-across:
    1 Across clue for a7-c7 (3)
    3 Across clue for a9-c9 (3)
    5 Across clue for a1-c1 (3)
    7 Across clue for a3-c3 (3)
  exolve-3d-away:
    1 Away clue for a7-a9 (3)
    2 Away clue for c7-c9 (3)
    5 Away clue for a1-a3 (3)
    6 Away clue for c1-c3 (3)
  exolve-3d-down: 
    1 Down clue for a7,a4,a1 (3)
    2 Down clue for c7,c4,c1 (3)
    3 Down clue for a9,a6,a3 (3)
    4 Down clue for c9,c6,c3 (3)

```

When you need to specify a clue number + direction in a 3-D crossword (for
example, for linking clues, or for specifying ninas, etc.), you should use the
following 2-letter suffixes: "ac"/"aw"/"dn". You can reverse the orientation of
selected lights in a 3-D crossword, including the lights running vertically
down through the layers. Note that the "normal" (unreversed) orientations are
across, away, and down. For reversed lights, you should use the suffixes "ba"
(for "back"), "to" (for "towards"), and "dn" (for "down").  These suffixes only
work in 3-D crosswords.

A few more notes on 3-D crosswords:

- Clue numbering goes top layer to bottom layer, and within each layer it starts
  at the nearest row and goes back, and within each row, it goes left to right.
- You can use bars to additionally break across/back/away/towards lights (but
  not down/up lights).
- As you can probably tell, "away" and "towards" lights are internally
  implemented as what would have been "down" lights in a 2-D crossword. You
  cannot use the normal 2-D directional suffixes ("a", "b", "d", u") in 3-D
  crosswords, to avoid confusion.
- The specified angle should be in the range [20, 90], and the specified ratio
  must be in the range [0.4, 1.6].
- You cannot have diagramless cells in a 3-D crossword (for now!).
- Internally, Exolve separates the layers using horizontal bars.
- If you specify `exolve-cell-size` then the specified width/height become the
  width/height of the cell's parallelogram, ignoring any height-to-width ratio
  specified on the `exolve-3d` line.
- Hyphens and word-end separators are not displayed in 3-D down/up lights.

## `exolve-explanations`
In a grid that includes solutions, the setter may provide additional notes,
explanations, commentary, etc., in an `exolve-explanations` section. Just like
the [`exolve-preamble`](#exolve-preamble-exolve-prelude) section, this section
also has multiple lines, and these lines can include HTML tags. The contents get
revealed when the solver clicks on "Reveal all".
```
  exolve-explanations:
    This puzzle's hidden message was driven by occasional hiccups in
    some <i>noted</i> interactive solvers.
```

## `exolve-nina`
If a setter has included ninas in the grid, and if they are putting up a version
that has solutions included, they can also specify where the ninas are, and in
that case, a "Show ninas" control button will get displayed. Each nina should
use its own `exolve-nina` line, and the ninas will get displayed in different
colours upon clicking "Show ninas" (as well as "Reveal all").

The squares involved in a nina are specified in the
[extended chessboard notation](#extended-chessboard-notation)
described above. It can also use clue indices like A12 and D33 (with uppercase
A or D preceding the clue number) or like 12a, 12A, 33d, or 33D. Example:
```
  exolve-nina: j5 j7 j9 c10r11 j13
  exolve-nina: a7 b7 c7 d7 e7 A12 16d
```
This example is from a puzzle with two ninas. The first one is in the 10th
column ("j"), and the second one is in the seventh row from the bottom as well
as all the cells in the A12 and D16 clues.

You can optionally pick the colour that the nina cells will have when revealed,
by including it in the list (anywhere). You can use a valid
[HTML colour name](https://www.w3schools.com/colors/colors_names.asp) or code
(but without spaces). Example:
```
  exolve-nina: dodgerblue j5 j7 j9 c10r11 j13
  exolve-nina: a7 b7 c7 d7 e7 A12 16d #ff00a1
```
Note that the colour that you specify will get shown transparently overlaid over
the normal cell colour (white, unless changed with `exolve-option:colour-cell`)
as well as over the active cell colour.

You can also have ninas that involve arbitrary letters/words from within the
text of the clues or the prelude. This involves a little bit of HTML.
Just enclose the text that you want to highlight as a nina in a "span" tag,
giving it a unique class name, and specify that class name in the `exolve-nina`
(the name should not be a letter followed by a number, so that it is not
confused with the extended chessboard notation or clue indices). For example:
```
  exolve-nina: acrostic-1
  exolve-across
    1 <span class="acrostic-1">W</span>herefore? (3)
    2 <span class="acrostic-1">O</span>pen borders working (2)
    2 <span class="acrostic-1">W</span>indow (8)
```
Span-class-specified and square-location-specified ninas can be intermixed too,
such as:
```
  exolve-nina: a4 c4 clue-nina
```

## `exolve-colour`, `exolve-color`
Specific cells in the grid may be coloured using this feature. The squares
involved are again specified in the
[extended chessboard notation](#extended-chessboard-notation)
or with clue
indices like A12 and D32 (with uppercase A or D preceding the clue number) or
like 12a, 12A, 33d, or 33D.
```
  exolve-colour: palegreen j5 j7 c10r9 c10r11 j13 A12 16D
```
The colour is specified anywhere in the space-separated list and
can be any valid
[HTML colour name](https://www.w3schools.com/colors/colors_names.asp) or code
(but without spaces).

Note that the colour that you specify will get shown transparently overlaid over
the normal cell colour (white, unless changed with `exolve-option:colour-cell`)
as well as over the active cell colour.

## `exolve-question`
Often, the setter might have hidden additional information for the solver to
discover (such as ninas), or may simply want to survey solvers about something
(such as their favourite clues). The `exolve-question` section can be used to
do this. Example:
```
  exolve-question: What is the nina that begins with S?
  exolve-question: What is the nina that requests people to find a famous TV series? (3,4) GET LOST
  exolve-question: Your name (30)*
```
In this example, there are three questions. An answer has also been provided for
the second question. The part following the enum ("(3,4)"), if there is an
enum, is treated as the answer (see the
[`exolve-across`/`exolve-down`](#exolve-across-exolve-down-exolve-nodir) section
for details on enums). The answer is not shown in the displayed question. When
the solver clicks "Reveal all", answers to all questions for which answers have
been provided do get revealed.

Questions that specify an enum get displayed with placeholder question-marks
formatted according to the enum: ??? for (3), ??? ?? for (3,2), and ??-??? for
(2,3), when no entry has been made in the answer slot.

If an enum in an `exolve-question` is immediately followed by an asterisk (like
"(30)\*" above—note that there is no space before the asterisk), then the enum
is not displayed to the solver; it is only used to determine the size of the
answer box to show. The placeholder questionmarks are also not shown.

Answers are automatically converted to uppercase. But lowercase answers can
be permitted by adding "[lowercase-ok]" immediately after the enum. For
example:
```
  exolve-question: That quirky poet? (1,1,8) [lowercase-ok] e e cummings
  exolve-question: A long comment from you, please (300)* [lowercase-ok]
```

If the setter has created an `exolve-submit` section, then answers to each
`exolve-question` are also sent to the submit URL (see below for details).

## `exolve-submit`
Setters/publishers can use the exolve-submit section to receive submissions
from solvers. The format is easily seen from this example:
```
  exolve-submit: https://something k k1 k2
```
The first parameter is the URL. The second parameter k is the key for the
letters entered in the grid. The letters are all strung together, row by row.
Dots for blocked squares are also included. In a diagramless square, if the
solver has proposed placing a block, then it is represented by "1" in the
solution string. Consider this grid-fill:
```
  ACE
  R.R
  EAR
```
When submitting, the solution letters will be sent as the string "ACER.REAR" for
this example.

Subsqeuent parameters (k1, k2) are the keys for any questions posed using
`exolve-question` sections. So, for this example, if the answers entered for the
`exolve-questions` are ANSWER1, ANSWER2, respectively, then the full URL for
submission will be:
```
  https://something&k=ACER.REAR&k1=ANSWER1&k2=ANSWER2
``` 

The submission is made using HTTP GET.

One easy way to set up submissions is to create a Google Form with one Google
Form question for the solution letters, and one Google Form question for each
`exolve-question` (using "Long answer" or "Short answer" as the question type
in each case). Then, click on the "Get prefilled link" menu option. Fill some
dummy text in each of the form fields shown, and then click on "Get Link." This
will copy a URL like this:
```
https://docs.google.com/forms/d/e/1FAIpQLSeezqRzI7N77Huk8_TYwAB40wp2E6HgQaOsNPMc1KgJp-7O8Q/viewform?usp=pp_url&entry.411104056=sol&entry.464339112=col&entry.861079418=lif&entry.1052922113=nam
```
Delete all the `=<value>` parts from this, and replace the `&` separators with
spaces, to get something like this:
```
  exolve-submit: https://docs.google.com/forms/d/e/1FAIpQLSeezqRzI7N77Huk8_TYwAB40wp2E6HgQaOsNPMc1KgJp-7O8Q/viewform?usp=pp_url entry.411104056 entry.464339112 entry.861079418 entry.1052922113
```
When solvers submit, links of this sort will take them to a Google Forms page
where they have to click again on a "Submit" button. Instead, you can
modify the URL to make a direct submission link, like this:
```
  exolve-submit: https://docs.google.com/forms/d/e/1FAIpQLSeezqRzI7N77Huk8_TYwAB40wp2E6HgQaOsNPMc1KgJp-7O8Q/formResponse?submit=SUBMIT entry.411104056 entry.464339112 entry.861079418 entry.1052922113
```

### Automatically scoring submitted solutions in Google Forms

- Link the form to a spreadsheet (there is an option under "Responses").

- Open the spreadsheet and click on `Extensions > Apps Script`.

- Delete all the skeletal, pre-populated `function myFunction() ..` code lines
  and replace them with the following lines of code:

```
  function SCORE(solution) {
    const expected = 'REPLACE..ME';
    var matched = 0;
    for (var i = 0; i < expected.length; i++) {
      if (i >= solution.length) {
        break;
      }
      if (expected.charAt(i) == solution.charAt(i) &&
          expected.charAt(i) != '.') {
        matched++;
      }
    }
    return matched;
  }
```

- Change the `REPLACE..ME` text to be the solution string for the crossword. You
  can submit an all-correct entry to see what this should be (essentially, all
  the letters strung together, row-by-row, with a "." for every black cell. So,
  for a 15x15 grid, there should be 225 letters + periods in this string.

- Save the project and deploy it, giving it a name. [See these instructions if you
  run into any
  problems](https://developers.google.com/apps-script/guides/sheets/functions).

- Now, add a column to the spreadsheet beyond the last column. Give it the heading
  "Score". Use the formula `=SCORE(B2)` in the second row, and then extend the
  formula to all the rows. This column will now show the number of correct letters
  for each submission.

## `exolve-option`
In this single-line, repeatable section, the setter can specify certain options.
Multiple, space-separated options may be provided on each exolve-option line.
For options that need a value (provided after a colon), there should not be
any leading space after the colon. Option names and values are case-sensitive.
The list of currently supported options is as follows:

- **`add-extraction-slots[:<chars>]`** Use this to add "extraction slots"
  prior to each clue, where solvers can record something (such as a letter
  somehow extracted from each clue). The number of slots can be specified with
  the optional `<chars>` parameter (default is 1). The recorded entries are
  saved in the state.
- **`allow-chars:<chars>`** If this option is specified, then we allow solvers
  to enter any of the characters (which would typically be special characters
  or digits)  listed in `<chars>`. For example, `allow-chars:#!7` will allow the
  characters `#`, `!`, and `7` to be used in the grid and will allow users to
  type them. If any of these special characters is also a decorator or is a
  character with a special meaning in grid specifications (i.e., one of
  `|_+@!~*.?`), then to specify it in the grid, you have to prefix it with `&`.
- **`allow-digits`** If this option is specified, then we allow solvers to enter
  digits in cells.
- **`clues-at-right-in-two-columns`** Deprecated option that has no effect now
  as we always try to place he clues to the right if there is space.
- **`clues-panel-lines:<N>`** Limit the across/down/nodir clues boxes to
  a maximum of about N lines of text, adding scrollbars if needed.
- **`colour-<name>:<c>` or `color-<name>:<c>`** Set the
  colour of the element named &lt;name&gt; to &lt;c&gt;, which should be a
  valid HTML colour name/code (do not include spaces within it though). See the
  "Colour schemes" subsection below for details.
- **`columnar-layout`** Deprecated. This option was used to create a
  newspaper-like layout, but it never worked reliably across platforms.
  You still get nice, "flowing" layouts when printing.
- **`font-family:<ff>`** Set the font-family CSS value (for clues, preamble,
  etc.). You can set this to **inherit** to override Exolve's default of
  **serif**.
- **`font-size:<fs>`** Set the font-size CSS value (for clues, preamble,
  etc.). Exolve's default is **16px**.
- **`grid-background:<c>`** 
  This option is deprecated and ignored now. Please use color-background
  (see above).
- **`hide-copy-placeholder-buttons`** This is an option that is only applicable
  when there are nodir clues without cells explicitly specified. It turns off
  the display of buttons to copy placeholder texts in those cases (see the
  subsection below on "Jigsaw puzzle clues").
- **`hide-inferred-numbers`** If this option is specified, then the software
  does not display any clue numbers that were automatically inferred. Setters
  using non-numeric clue labels may want to specify this option.
- **`highlight-overwritten-seconds:<s>`** Set the time for which overwritten
  cell entries (i.e., values changed from non-blank to a different non-blank
  letter) are highlighted. The parameter `<s>` should be a number >= 0 (seconds).
  If 0, this highlighting behaviour is turned off. The default is 5 seconds.
- **`ignore-enum-mismatch`** If this option is specified, then any generated
  warnings about enum-mismatches are suppressed.
- **`ignore-unclued`** If this option is specified, then any generated warnings
  about missing clues are suppressed.
  **`no-auto-solution-in-anno`** In a grid with solutions, we automatically
  show the solution next to the clue, when "Reveal all!" or "Reveal this" is
  used. Set this option to disable that. Useful if you want to control
  how the solution appears in the anno. Also see the note on "anno" in the
  section on clues.
- **`no-nina-button`** In a grid with ninas, a nina-toggling button gets
  shown normally. You can suppress the creation of this button by using this
  option. If you do have ninas and you've used this option, once "Reveal all"
  is used, the button does get shown (in case the user wants to hide the ninas,
  say for printing). If at that point, the user does "Hide ninas" or
  "Clear all", then the nina button is hidden again.
- **`no-smart-coloring`** or **`no-smart-colouring`** If this option is
  specified, then we do not try ["smart colouring"](#smart-colouring).
- **`offset-left:<N>`** Draw the grid with this much space to the left and
  to the right (N pixels). Useful for drawing additional art around the grid
  using `customizeExolve()`, for example.
- **`offset-top:<N>`** Draw the grid with this much space above and under
  it (N pixels). Useful for drawing additional art around the grid using
  `customizeExolve()`, for example.
- **`override-number-<name>:<N>`** An advanced override function that will
  set the property named `<name>` in the puzzle to the numeric value `<N>`.
  This can be used to override properties for which there is no explicit
  dedicated option, such as `GRIDLINE`.
- **`rebus-cells`** Allow multiple letters to be entered in cells. See
  [`Rebus cells`](#rebus-cells) for details.
- **`print-completed-3cols` and `print-incomplete-2cols`** These option
  override the default layout choices used for printing puzzles (and creating
  PDFs). By default, a completed puzzle is printed in 2 columns
  (`print-completed-3cols` makes that 3 columns) while an incomplete puzzle is
  printed in 3 columns (`print-incomplete-2cols` makes that 2 columns). See
  [`Printing`](#printing) for more details.
- **`show-cell-level-buttons`** If this option is specified, then "Check cell"
  and "Reveal cell" buttons are also shown, in an extra row of buttons, for
  crosswords with solutions provided.
- **`top-clue-clearance:<N>`** Add N pixels space between the top of the grid
  and the bottom of the clue shown on top. Defaults to 0. You can set this
  to something like `20`, but note that if the clue text is very long then
  this setting will get overridden.
- **`webifi`** Provide a "Webifi" link under the crossword. See the
  [Webifi section](#webifi) for details.

### Colour schemes
Using a bunch of `exolve-option: colour-<name>:<c>` (or, of course,
`exolve-option: color-<name>:<c>`) options, the colour scheme of
a puzzle can be altered comprehensively. The following table lists all possible
supported values for `colour-<name>`, their default values (that you would
be overriding), and descriptions.

| Option                     | Default value | What gets coloured                |
|----------------------------|---------------|-----------------------------------|
| `colour-active`            | mistyrose     | Squares for the light(s) currently active.|
| `colour-active-clue`       | mistyrose     | The current clue(s) in the clues list get(s) this as background colour.|
| `colour-anno`              | darkgreen     | The text of the annotations.       |
| `colour-arrow`             | mistyrose     | The right- or down-arrow (or left-, or up-arrow in crosswords with reversals) in the square where the solver is typing.|
| `colour-background`        | black         | The background: blocked squares and bars.|
| `colour-button`            | #4caf50       | Buttons (Check/Reveal etc).       |
| `colour-button-hover`      | darkgreen     | Buttons with mouseover.           |
| `colour-button-text`       | white         | The text in buttons.              |
| `colour-caret`             | gray          | The flashing cursor in the square where the solver is typing.|
| `colour-cell`              | white         | Light squares.                    |
| `colour-circle`            | gray          | Any circles drawn with the @ decorator.|
| `colour-circle-input`      | gray          | Same as above, in the square where the solver is typing.|
| `colour-currclue`          | white         | Background for the current clue above the grid.|
| `colour-def-underline`     | #3eb0ff       | The underline in a revealed definition within a clue.|
| `colour-hint`              | dodgerblue    | The text of the hints.       |
| `colour-hint-bulb`         | dodgerblue    | The text of the hint icon (only relevant if you override the default icon, which is a lightbulb, with text). |
| `colour-imp-text`          | darkgreen     | "Important" text: setter's name, answer entries, grid-filling status.|
| `colour-input`             | #ffb6b4       | The light square where the solver is typing.|
| `colour-light-label`       | black         | The number (or nun-numeric label) of a clue, in its first square. |
| `colour-light-label-input` | black         | Same as above, in the square where the solver is typing.|
| `colour-light-text`        | black         | The typed solution letters in lights.|
| `colour-light-text-input`  | black         | Same as above, in the square where the solver is typing.|
| `colour-orphan`            | linen         | The background colour of the current clue(s) without known location(s) in the grid.|
| `colour-overwritten-end`   | #bb00bb       | The end-colour of the animation to highlight overwritten cells.|
| `colour-overwritten-start` | #ff00ff       | The start-colour of the animation to highlight overwritten cells.|
| `colour-prefill`           | blue          | Any letters pre-filled with the ! decorator.|
| `colour-separator`         | blue          | The hyphens and dashes in multi-word lights. |
| `colour-small-button`      | inherit       | Small buttons in the current clue(s).|
| `colour-small-button-hover`| lightpink     | Small buttons with mouseover.     |
| `colour-small-button-text` | darkgreen     | The text in small buttons.        |
| `colour-solution`          | dodgerblue    | The solution part of the anno, as well as entries in placeholder blanks.|
| `colour-solved`            | dodgerblue    | The clue number in the list of clues, once the clue has been solved.|

When you set any of the above options, that modification applies to
both the "light mode" and the "dark mode" (see next section). If you want
to only modify a color in light mode or in dark mode, then use
`exolve-option: colour-light.<name><c>` or
`exolve-option: colour-dark.<name><c>`.

Setting `colour-arrow` and `colour-caret` to the same colour as `colour-input`
will make them invisible (if so desired).

For example, the following options will make the rendering look quite
similar to the Guardian's colour scheme (as of May 2020).
```
  exolve-option: colour-active:lightyellow
  exolve-option: colour-input:#bb3b80 color-arrow:lightyellow
  exolve-option: colour-light-label-input:white
  exolve-option: colour-light-text-input:white
  exolve-option: colour-button:#bb3b80 color-button-hover:purple
```

### Dark and light modes

If we detect that the crossword is getting rendered in dark mode, then we make
a few tweaks to the colours. The detection is based upon whether the average
value of RGB for the font colour (on the root Exolve DIV element) is >= 155.

The tweaks made are to the following colours:

- Colour `currclue` is set to black (but see "Smart colouring" below).
- Colour `active-clue` is set to #663366.
- Colour `orphan` is set to #663300.
- Colour `anno` is set to lightgreen.
- Colour `imp-text` is set to lightgreen.
- Colour `small-button-text` is set to lightgreen.
- Colour `small-button-hover` is set to #330066.

As mentioned in the previous section, when you override a colour with
`exolve-option: colour-<name>:<c>`, it gets overridden for both light mode
and dark mode. If you only want to specify an overriding colour for light
mode (or dark mode) then use
`exolve-option: colour-light.<name><c>` (or
`exolve-option: colour-dark.<name><c>`).

Note that dark mode detection and handling is done when the crossword is
first rendered. If the user changes the browser theme's dark mode settings,
then the page would need to be reloaded for the crossword rendering to be
updated.

### Smart colouring

Smart colouring is on by default. Currently, it just affects the colour of
the background of the top clue, possibly overriding whatever was set in
`colour-currclue` (the light/dark mode defaults for which are white/black
respectively).

We try to set the background colour of the top clue to be the same colour
as the parent element of the root Exolve DIV element, if there is sufficient
contrast between that colour and the font colour. Here's the heuristic
algorithm used for doing this:
```
  bg = Colour of the background of parent of root element. This is
       found by going up to higher level parents if the current
       level's background is transparent. If the result is transparent,
       then we set bg to white.
  bgBrightness = Average of RGB values in bg.
  fgBrightness = Average of RGB values in font colour.

  if ((fgBrightness < 155 && bgBrightness >= 200) ||
      (fgBrightness >= 155 && bgBrightness < 75)) {
    this.colorScheme['currclue'] = bg;
  }
```

Note that if you're using images to create backgrounds, then this heuristic
may not work, so, in that case, you should use
`exolve-option: no-smart-colouring`.

## `exolve-language`

You can create crosswords in pretty much any language apart from English,
using Exolve. You need to specify a line that looks like:
```
  exolve-language: <lang> <Script> [<max-char-codes-per-letter>]
```
Here, &lt;lang&gt; is a
[language code](https://www.w3schools.com/tags/ref_language_codes.asp)
such as "ru" or "hi" and &lt;Script&gt; is the name of the
[Script](https://tc39.es/ecma262/#table-unicode-script-values)
to use for that language, such as "Devanagari" or "Cyrillic".
Examples:
```
  exolve-language: hi Devanagari
```
```
  exolve-language: ru Cyrillic
```

On an exolve-language line, you can optionally specify a third parameter,
`<max-char-codes-per-letter>`. In some languages such as those using the
Devanagari script, multiple unicode characters are combined together to
form a single compound letter (for example, स्सा in Devanagari is made up 
of four characters). In these situations, you can specify
&lt;max-char-codes-per-letter&gt; as the limit on how many characters you want
to allow to go into a composite letter, at most. For Devanagari, the software
already sets this to 5 (but you can override that if you specify a value
here). When &lt;max-char-codes-per-letter&gt; is greater than 1, you can append
to existing characters within a cell by pressing the Shift key, or by
double-clicking in the cell. If a cell already has a multi-char letter in
it, then you can append more characters to it (or delete existing them)
when you come to it by clicking on it or via auto-advancing from an
adjacent cell (i.e., the Shift key or double-click are not needed in that
case).

You may also want to provide
[placeholder blanks](#forcing-the-display-of-placeholder-blanks)
for languages such as Hindi that have compound letters. Exolve recognizes
multi-character letters separated by spaces within placeholders. So,
if you have a 3-letter clue, and the placeholder text contains
"उ स्ता द"
then copying this into a 3-letter entry will place 
"उ" in the first cell,
"स्ता" in the second cell, and
"द" in the third cell.

When you use a language other than English, you may also want to change the
text displayed in various buttons etc. to that language. You can do that
using an `exolve-relabel` section (see below). Further, you may want to let
solvers know that they have to use a suitable input mechanism for the
Script you have specified (Google Input Tools works well on Chrome).

## `exolve-relabel`

You can change the text (and hover-text) of any button or label or any message
in the Exolve interface. This is particularly useful if you want to set a
crossword in a language other than English. Every piece of text has a name,
and you can change it using this syntax within an `exolve-relabel` section:
```
    <name>: <new label>
```
The section can contain multiple relabeling lines. Example:
```
  exolve-relabel:
    clear: <b>Erase</b> this entry
    clear.hover: Careful!
    across-label: <i>Swimming Across!</i>
    down-label: <i>Sinking Down (नीचे)!</i>
    submit.hover: Think twice before submitting
```
Here are all the names of pieces of text that you can relabel:
| Name             | Default text                         |
|------------------|--------------------------------------|
| `clear`          | Clear this                           |
| `clear.hover`    | Clear highlighted clues and squares. Clear crossers from full clues with a second click. Shortcut: Ctrl-q.|
| `clear-all`      | Clear all!                           |
| `clear-all.hover` | Clear everything! A second click clears all placeholder entries in clues without known squares. Shortcut: Ctrl-Q.|
| `check`          | Check this                           |
| `checkcell`      | Check cell                           |
| `check.hover`    | Erase mistakes in highlighted squares. Long-click to check the just current cell.|
| `checkcell.hover`| Erase the current cell if it's incorrect. |
| `check-all`      | Check all!                           |
| `check-all.hover`| Erase all mistakes. Reveal any available annos if no mistakes.|
| `copy-notes`     | Copy notes|
| `copy-notes.hover`| Copy these notes to the clipboard, including any formatting.|
| `email-notes`    | Email notes|
| `email-notes.hover`| Compose an email containing these notes as plain text. You can edit the draft before sending.|
| `email-notes-recipients.hover`|Draft recipient(s): |
| `reveal`         | Reveal this                          |
| `revealcell`     | Reveal cell                          |
| `reveal.hover`   | Reveal highlighted clue/squares. Long-click to reveal the just current cell.|
| `revealcell.hover`| Reveal the solution letter in the current cell. |
| `show-ninas`     | Show ninas                           |
| `show-ninas.hover` | Show ninas hidden in the grid/clues.|
| `hide-ninas`     | Hide ninas                           |
| `hide-ninas.hover` | Hide ninas shown in the grid/clues. |
| `reveal-all`     | Reveal all!                          |
| `reveal-all.hover` | Reveal all solutions, available annos, answers, notes! |
| `hint-bulb.hover`| Click to see a hint. |
| `hint.hover`| Click to hide hints. |
| `hint`           | Hint |
| `hint-bulb`      | &#128161; |
| `submit`         | Submit                               |
| `submit.hover`   | Submit the solution!                 |
| `setter-by`      | By                                   |
| `curr-clue-prev` | &lsaquo;                             |
| `curr-clue-prev.hover` | Previous clue.       |
| `curr-clue-next` | &rsaquo;                             |
| `curr-clue-next.hover` | Next clue.           |
| `squares-filled` | Squares filled                       |
| `across-label`   | Across                               |
| `down-label`     | Down                                 |
| `3d-ac-label`     | Across & Back                        |
| `3d-aw-label`     | Away & Towards                       |
| `3d-dn-label`     | Down & Up                           |
| `nodir-label`    | Other                                |
| `tools-link`     | Exolve                                |
| `tools-link.hover` | Crossword software: [VERSION]: Show/hide panel with info/help and links to report a bug, manage storage, etc.|
| `tools-msg`      | [Longish list of all control keys, and more...]|
| `crossword-id`   | Crossword ID                         |
| `notes`          | Notes                                |
| `notes.hover`    | Show/hide notes panel.               |
| `notes-help`     | Ctrl-/ takes you to the current clue's notes (or overall notes) and back (if already there). Ctrl-\* adds a * prefix to the current clue's notes. Hovering over a clue's notes shows the clue as a tooltip.|
| `jotter`         | Jotter                                |
| `jotter.hover`   | Show/hide a jotting pad that also lets you try out anagrams and subtractions.|
| `jotter-text.hover`|You can shuffle letters by clicking above. If you enter something like "Alphabet - betas  =" then it will be replaced by "lpha - s" (subtraction of common letters). |
| `maker-info`     | Exolve-maker info                    |
| `manage-storage` | Manage local storage                 |
| `manage-storage.hover` | View puzzle Ids for which state has been saved. Delete old saved states to free up local storage space if needed.|
| `manage-storage-close` | Close (manage storage)         |
| `manage-storage-close.hover` | Close the local storage management panel.|
| `exolve-link`    | Exolve on GitHub                     |
| `exolve-link.hover`| Visit the Exolve open-source repository on GitHub, with a detailed user guide.|
| `report-bug`     | Report Bug                                  |
| `webifi`         | Webifi                               |
| `webifi.hover`   | Show/hide "Webifi", the interactive-fictionesque text/audio interface.|
| `saving-msg`     | Your entries are auto-saved in the browser's local storage.|
| `saving-bookmark`| You can share the state using this link:|
| `saving-url`     | URL                                  |
| `shuffle`        | Jotting pad: (click here to shuffle) |
| `shuffle.hover`  | Shuffle selected text (or all text, if none selected).|
| `across-letter`  | a                                    |
| `down-letter`    | d                                    |
| `back-letter`    | b                                    |
| `up-letter`      | u                                    |
| `3d-ac`          | ac                                   |
| `3d-ba`          | ba                                   |
| `3d-aw`          | aw                                   |
| `3d-to`          | to                                   |
| `3d-dn`          | dn                                   |
| `3d-up`          | up                                   |
| `mark-clue.hover` | Click to forcibly mark/unmark as solved. <sub>(Only used for clue labels on clues that do not have all their cell-associations known)</sub>|
| `placeholder.hover` | You can record your solution here before copying to squares. |
| `placeholder-copy` | &#8690; |
| `placeholder-copy.hover`| Copy into currently highlighted squares. |
| `confirm-clear-all` | Are you sure you want to clear every entry!? |
| `confirm-clear-all-orphans1` | Are you sure you want to clear every entry!?  (The placeholder entries will not be cleared. To clear the placeholders, click on clear-all again after clearing the grid.) |
| `confirm-clear-all-orphans2` | Are you sure you want to clear every entry including all the placeholder entries!? |
| `confirm-clear-all` | Are you sure you want to clear every entry!? |
| `confirm-clear-all-orphans1` | Are you sure you want to clear every entry!?  (The placeholder entries will not be cleared. To clear the placeholders, click on clear-all again after clearing the grid.) |
| `confirm-clear-all-orphans2` | Are you sure you want to clear every entry including all the placeholder entries!? |
| `confirm-check-all` | Are you sure you want to clear mistakes everywhere!? |
| `confirm-mismatched-copy` | Are you sure you want to do this mismatched copy (#letters-from : #squares-to)? |
| `confirm-show-ninas` | Are you sure you want to reveal the nina(s)!? |
| `confirm-reveal-all` | Are you sure you want to reveal the whole solution!? |
| `confirm-submit` | Are you sure you are ready to submit!? |
| `confirm-incomplete-submit` | Are you sure you want to submit an INCOMPLETE solution!? |
| `confirm-delete-id` | Delete puzzle state for puzzle id |
| `confirm-delete-older` | Delete all puzzle states saved before |
| `confirm-state-override` | Do you want to override the state saved in this device with the state found in the URL?|
| `warnings-label` | Please fix or use "ignore-unclued" / "ignore-enum-mismatch" [options](https://github.com/viresh-ratnakar/exolve/blob/master/README.md#exolve-option):|
| `warnings.hover` | Issues detected: click &times; to dismiss.    |
| `print` | Print                                                  |
| `print.hover` | Show/hide panel for printing or creating PDFs.   |
| `print-heading` | Print or create a PDF:                         |
| `print-size` | Page size:                                        |
| `print-margin` | Margin (inches):                                |
| `print-font` | Font size:                                        |
| `print-font-normal` | Normal                                     |
| `print-font-large` | Large                                       |
| `print-font-xlarge` | Extra Large                                |
| `print-font-small` | Small                                       |
| `print-font-other` | Other                                       |
| `print-crossword` | Print crossword                              |
| `print-crossword.hover` | Print just this crossword, hiding any content outside it (Ctrl-B). |
| `print-page` | Print page                                        |
| `print-page.hover` | Print the whole page (Ctrl-p or Cmd-P).     |
| `print-page-wysiwyg` | Print wysiwyg                             |
| `print-page-wysiwyg.hover` | Print the whole page without reformatting the crossword.|
| `print-questions`| Include questions                             |
| `print-clues-page`| Page break before clues                      |
| `print-preamble-below`| Preamble below grid                      |
| `print-inksaver`| Inksaver                                       |
| `print-qrcode`| Include QR code                                  |
| `print-qrcode-details`| The QR code (rendered to the right) will be printed to the |
| `print-qrcode-in-preamble`| right of the preamble |
| `print-qrcode-in-botright`| bottom-right of the puzzle |
| `print-qrcode-cta-label`| Call to action                         |
| `print-qrcode-cta`| Solve online                                 |
| `print-qrcode-size`| QR code size:                               |
| `show-notes-seq`| Show clue-solving sequence: |
| `show-notes-entries`| Show entered solutions: |
| `show-notes-times`| Show clue-solving times:  |

The `.hover`-suffixed names are for tooltips. The relabelings for these should
not include any HTML markup.

The `confirm-` prefixed messages are all for dialogs seeking confirmation. They
all have one special feature: if you set them to be emoty strings, then the
confirmation step is skipped and the action is directly taken. For example:
```
  exolve-relabel:
    confirm-check-all:
```
The above will skip the confirmation step when the solver clicks on "Check all!"

## `exolve-maker`

In this multiline section, you can include arbitrary metadata about the
puzzle's construction. The Exet crossword construction web app uses this section
to record some info such as its version and the lexicon it used. The metadata
can be seen after clicking the Exolve button.

## `exolve-force-hyphen-right`, `exolve-force-hyphen-below`, `exolve-force-bar-right`, `exolve-force-bar-below`

Each of these sections is a single-line section that contains a list of cells.
This allows you to force the creation of separator hyphens/bars even if not
indicated by the enums. This might be useful in diagramless puzzles (Exolve
does not try to infer hyphen/bar locations from clues in diagramless puzzles),
or if, for example, you do not want to give away the full enum for some clues,
but just want to provide some/all of the separators. Example:
```
  exolve-force-hyphen-right: a5 c4
  exolve-force-bar-below: a5 c4 d8
```

Note that if you want to do the opposite of this—that is, if you want to
suppress hyphens/bars implied by an enum, then use the trick [described
earlier](#suppressing-enums-or-separators).

## `exolve-cell-size`

Normally, crosswords are displayed using square cells with width and height
equal to 31 pixels. For some large grids and/or small displays, the software
may use a smaller cell size.

You can override the cell size and set it to any width and height (that is, you
can create rectangular cells that are not squares too) using
`exolve-cell-size`. For example:
```
  exolve-cell-size: 31 43
```
The first parameter is the cell width and the second parameter is the cell
height. Both values must be at least 10.

## `exolve-postscript`
If this section is provided, it gets rendered under the whole puzzle. Like
`exolve-preamble`, this is also a multiline section and can include arbitrary
HTML. Example:
```
  exolve-postscript:
    <ul>
     <li><a href="puzzle-41.html">Previous puzzle</a></li>
     <li><a href="index.html">Home</a></li>
     <li><a href="puzzle-43.html">Next puzzle</a></li>
   </ul>
```

## Notes

From the "Notes" menu under the crossword, solvers can jot down clue-specific
notes and overall notes for the crossword. These notes are saved in the local
storage along with the crossword state.

The notes can be copied to the clipboard using the "Copy notes" button. This
copying retains any special formatting (such as bold/italics) that the solver
may have applied to parts of the notes.

Clicking on the "Email notes" button composes an email draft containing the
notes. If the crossword includes contact email addresses (via the
`exolve-email` section) then the draft is addressed to those addresses. The
email is in plain text and does not retain any HTML formatting (because
JavaScript does not permit this, for security reasons). While this
may be good enough for most needs, you can always use the copy-to-clipboard
feature to paste formatted notes into an email.

The notes can include a few features automatically, if desired (each one
can be turned off with a checkbox). These are:

- The solving order of the clues. This may be useful info for setters to
  learn. I also find "how many did I solve in the first pass?" to be a pretty
  good metric of how difficult a crossword is, and that can be inferred from
  the solving order. This is ON by default.
- The solution entered. This is ON by default.
- The time at which the clue was solved. This is OFF by default.

When solving a clue, if you type Ctrl-/ (Ctrl-Slash), then you are directly
taken to the notes line for that particular clue, where you can edit the
note or just read what you may have written. When in the notes already, Ctrl-/
will take you back to your last location in the grid (if any). When no clue is
selected, typing Ctrl-/ will take you the overall notes section.

Similarly, when solving a clue, if you type Ctrl-\* (Ctrl-asterisk) then
a \* is added to the front of the clue's notes to mark it as a favourite.
The focus stays on the crossword and does not jump to the notes (unlike
Ctrl-/).

Hovering the mouse on a clue's notes shows the clue as a tooltip.

At this time, I have chosen to keep all the notes confined to the Notes
section that appears under the crossword. I think surfacing these notes
in the clue tables and/or in the top clue may make the interface too
cluttered, but I am open to ideas.

## Jotter

Under the crossword, you can see a link to toggle a "Jotter" into view,
which is a scratch-pad in which you can jot down solution ideas or memos
to yourself. You can also try out anagrams of the text in the Jotter, by
clicking on the label that invites you to "click here to shuffle". If you
have highlighted some text within the jotter, then only that selected
part will get shuffled.

The Jotter also let you test anagram candidates by providing a simple
mechanism to "subtract" a phrase from another phrase. This feature is
activated when you enter something like this into the scratch-pad:
```
Astronomers - moon starers =
```
After subtracting the letters in `moon starers` from `Astronomers`
(case-insensitively, and taking occurrence counts into account),
nothing is left, and the scratch-pad will get cleared.

If the anagram is not perfect, then the left-over letter sequence
will be shown in the scratch-pad. For example,
```
starting - strength =
```
will get replaced by
```
ai - eh
```

## Completion event

The software fires a custom JavaScript event (with type `exolve`) under the
following conditions:
- The state changes from "not fully filled" to "fully filled" OR
- The state continues to be "fully filled" but the crossword contains
  solutions and the status of "Are all entries correct?" changes (from
  true to false or vice versa).

The `detail` object in the custom event has the following fields set:
```
  id: The puzzle id.
  title: The puzzle title.
  setter: The puzzle setter.
  toFill: The number of cells to be filled.
  filled: The number of cells filled.
  knownCorrect: true/false.
  knownIncorrect: true/false.
```
The `knownCorrect` and `knownIncorrect` fields are both always `false` if
the puzzle does not contain solutions.

The event is fired on the outermost div of the puzzle (that has class
`xlv-frame`) and it bubbles up.

You can see [`test-completion-notice.html`](test-completion-notice.html) for an
example of how to use this event.

## Saving state

The software automatically saves state. It does so in the browser's local
storage. Users can also copy and share a URL that saves the state after the #
(if requested through provideStateUrl=true in the constructor). The state uses
the puzzle id specified in the [`exolve-id`](#exolve-id) section (or the id
automatically created, if that section is not there) as the key.

Please note that a variety of factors control access to and size limits of
local storage. Especially when embedding Exolve puzzles in cross-site iframes,
state saving may not work.

Older versions of Exolve used to save state in a cookie. When loading a puzzle,
the state is restored in the following preferential order, if possible:
(1) from local storage, (2) from cookie, (3) from URL. If there is state in the
URL as well as in the local storage, then the user is prompted to ask whether
they want to override the local storage set with the state in the URL.

Clicking on the "Exolve" menu under the crossword grid makes a "Manage local
storage" button visible. If you have saved a *lot* of puzzle states, then
it's possible that you may fill up the local storage in the browser (you'll get
a warning thereafter when state-saving fails for the first time after opening a
puzzle). You can then choose to free up local storage by deleting the states of
old puzzles, after clicking on this button.

## Serving and sharing

I want to maintain a released version in the simple state of a single,
self-contained HTML file containing all the CSS and all the JavaScript it needs.
Vanilla JavaScript, nothing to import, no scripts to run, absolutely zero
dependencies. This is the [exolve.html](exolve.html) file.

If you have just one or two puzzles that you want to render, and/or you do not
have much experience with HTML, then just make a copy of
[exolve.html](exolve.html) (renaming it to whatever you want) and modify it
between the `exolve-begin` and `exolve-end` lines. You can serve the resulting
file from your website (no other files are needed as dependencies). You can
also share the file as an email attachment. Recipients would need to download
the file and open it in their browser. This file would continue to work even
when the solver is offline.

If you are serving multiple puzzles from your website, it may be better to
use [exolve-m.css](exolve-m.css) and [exolve-m.js](exolve-m.js), and create one
copy of [exolve-m.html](exolve-m.html) for each puzzle (renaming it suitably
and then editing it between the exolve-begin and exolve-end lines). This avoids
duplication, and also allows you to update [exolve-m.css](exolve-m.css) and
[exolve-m.js](exolve-m.js) to the latest Exolve version regularly, without
having to edit all the .html puzzle files.

A variant of the above approach is to just use
[exolve-m-simple.html](exolve-m-simple.html) instead of
[exolve-m.html](exolve-m.html). In this case, you do not have to host
[exolve-m.js](exolve-m.js) and [exolve-m.css](exolve-m.css) at all, as they are
pulled in from a GitHub-hosted website that I maintain.

If you just use a blogging platform (such as Blogger), or if you just
want to add crossword puzzles to web pages (that may have other content and may
be using other scripts/CSS), you also have the "widget" option, detailed in the
next subsection.

If you have your crossword available as a .puz or .ipuz file, you can convert
it to the Exolve format using [`exolve-player.html`](#exolve-player.html). Or, you
can serve it using [`Exolve Embedder`](#exolve-embedder). Or, you

### Exolve widget

The simplest serving option might be to embed an "Exolve widget" in your
blog or website. You can use the following HTML snippet anywhere within the
HTML of your website/blog-post (replace the puzzle specs between exolve-begin
and exolve-end with your own puzzle).

```
  <link rel="stylesheet" type="text/css" href="https://viresh-ratnakar.github.io/exolve-m.css"/>
  <script src="https://viresh-ratnakar.github.io/exolve-m.js"></script>

  <div id="exolve"></div>
  <script>
    createExolve(`
    ======REPLACE WITH YOUR PUZZLE BELOW======

    exolve-begin
      exolve-id: some-unique-id-for-this-puzzle
      exolve-title: Quick 3x3 (replace with puzzle title)
      exolve-setter: Gussalufz (replace with setter's pseudonym)
      exolve-copyright: 2020 Copyright Holder(s) (delete or replace)
      exolve-width: 3
      exolve-height: 3
      exolve-grid:
        000
        0.0
        000
      exolve-across:
        1 Running with placement, essentially, for single (3)
        3 Oddly fluent and entertaining (3)
      exolve-down:
        1 Retreating thief forgot to hide bananas (3)
        2 One suffering for a long time (3)
    exolve-end

    ======REPLACE WITH YOUR PUZZLE ABOVE======
    `);
  </script>
```

If you are embedding more than one puzzle widget in a page, you do not have to
duplicate the first two lines (that just load the CSS and JavaScript). Please
note that some blogging platforms (such as WordPress) do not let you use
JavaScript in their basic, free plans. Exolve widgets like the above work fine
in Blogger though.

The widget options should work across devices and browsers (bug reports are
welcome!).

### Note for WordPress and some other blogs
AFAIK, the free version of WordPress does not let you use JavaScript. If you are
using the paid version, embedding should work. The current clue shown above the
crossword is a "sticky" HTML element: it will remain visible as you scroll,
until you have scrolled past the crossword grid (this is useful on small
devices). However, on WordPress, the stickiness does not work, but can be restored
with this little change:
```
  <link rel="stylesheet" type="text/css" href="https://viresh-ratnakar.github.io/exolve-m.css"/>
  <script src="https://viresh-ratnakar.github.io/exolve-m.js"></script>

  <div id="exolve"></div>
  <script>
    crossword = createExolve(`
    ======REPLACE WITH YOUR PUZZLE BELOW======

    exolve-begin
      ...
    exolve-end

    ======REPLACE WITH YOUR PUZZLE ABOVE======
    `);

    /**
     * Make the top-clue stickiness work by killing any "overflow" that is not
     * visible among ancestor elements.
     */
    let parent = crossword.frame.parentElement;
    while (parent) {
      const hasOverflow = getComputedStyle(parent).overflow;
      if (hasOverflow !== 'visible') {
        parent.style.overflow = 'visible';
      }
      parent = parent.parentElement;
    }
  </script>
```
For the curious: the "position: sticky" CSS style does not work if any ancestor
element has "overflow: X" set with X being something other than "visible". For
some reason, WordPress blog entries are wrapped in an element with
"overflow: hidden".

### Exolve Embedder
The file [`exolve-embedder.html`](exolve-embedder.html) can be used to directly
serve .puz and .ipuz files.

Let's say you have file named my-puzzle.puz that you are serving from the same
directory as this exolve-embedder.html file. Then, this is the URL for the
interactive crossword:

```
  exolve-embedder.html?crossword=my-puzzle.puz
```

You can wrap this inside an iframe tag, to embed a crossword in any web page:

```
  <iframe height="780px" width="100%" allowfullscreen="true"
      style="border:none; width: 100% !important; position: static;display: block !important; margin: 0 !important;"
      src="exolve-embedder.html?crossword=my-puzzle.puz">
  </iframe>
```

Any other URL parameters get appended to the Exolve specs. "key=value" becomes the line:

```
  exolve-key: value
```  

For example, you can override the color used in the buttons, as well as the
font used in the clues, like this:

```
   exolve-embedder.html?crossword=my-puzzle.puz&option=color-button:blue font-family:monospace
```

Every URL parameter value is first decoded (using `decodeURIComponent()`), including
the value of the `crossword` parameter.

## Customizations
Beyond changing colours and button texts (which can be done through
exolve-option and exolve-relabel), setters can customize their grids to add
special effects, etc. by directly making changes to the Exolve code. However,
this may get hard to maintain over time, as Exolve goes through new versions.

The recommended way to customize is to load separate, additional JavaScript
and/or CSS files. Exolve provides a JavaScript hook to do any custom
initialization and/or to modify the HTML using JavaScript. If the setter has
defined a function called `customizeExolve(p)`, then it gets called by
`createExolve(...)` after Exolve has finished with its own set-up, with the puzzle
object passed as p. For example, the following code, if added within the
&lt;script&gt; tag or loaded from a script file, will customize the HTML by
inserting the italicized red text *Whew!* after the puzzle (that is created
by calling `createExolve(...)`.
```
  function customizeExolve(p) {
    p.frame.insertAdjacentHTML(
        'beforeend', '<span style="color:red;font-style:italic">Whew!</span>')
  }
```

Here is an example of customizing by adding a function that is called when
any letter is entered into the grid. Here, we call `checkCurr()` from this
function if the current entry is full, never letting the solver enter a full
incorrect entry,
```
  function customizeExolve(puz) {
    puz.afterInput = function(evt) {
      let allEntered = (this.activeCells.length > 0);
      for (let cell of this.activeCells) {
        const row = cell[0];
        const col = cell[1];
        const letter = this.grid[row][col].currLetter;
        if (letter < 'A' || letter > 'Z') {
          allEntered = false;
          break;
        }
      }
      if (allEntered) {
        this.checkCurr();
      }
    }
    puz.gridInput.addEventListener('input', puz.afterInput.bind(puz));
  }
```

It will be easier to keep your files synced up to the latest Exolve version
by using `customizeExolve()` for customizations, instead of editing the
HTML or JavaScript directly. You can examine the JavaScript/CSS code to see all
the members of the Exolve object (passed as the parameter p above) and all the
HTML class names and IDs.

The `Exolve()` constructor can also be used to pass a custom customization
function as a parameter (named `customizer`).

I try to make sure that all Exolve JavaScript/CSS changes are backwards
compatible (so, for example, I do not change element IDs in the HTML) so that
any customizations you do will continue to work. With v0.84, there *were*
backwards-incompatible changes made, for good reasons. With v0.84, the number
of JavaScript globals was reduced to just a handful of distinctive ones, and
all HTML IDs and class names were made distinctive by having them use the
"xlv" prefix. I'm hopeful that these v0.84 changes will go a long way towards
making future backwards-incompatible changes unnecessary.

### Customized additional text within cells
Exolve provides you with a JavaScript API that you can call from
`customizeExolve()` that lets you add arbitrary text within any cell. The
function to call is:
```
addCellText(row, col, text, h=16, w=10, atTop=true, toRight=false);
```
This will add `text` (which should be just raw text, not HTML) with font size
`h px` in a box of size `w px` by `h px` in one of the corners of the cell at
`row`, `col` (which should be a light cell or a diagramless cell). It will also
return an SVG 'text' element that you can style further if needed.
Examples:
```
function customizeExolve(p) {
  p.addCellText(0, 1, '@', 12, 10, true, false)
  let c = p.addCellText(0, 3, '①', 16, 14, true, true)
  c.style.stroke = 'blue'
  c = p.addCellText(1, 0, '*', 18, 10, false, true)
  c = p.addCellText(1, 2, '%', 12, 8, false, false)
}
````

## Placing the puzzle in a specific HTML element

By default, the puzzle content gets created as a new last element in the HTML
Dom. But you can direct it to be placed at different spot by creating an empty
element (typically a DIV) with id="exolve" anywhere in the HTML file. The
puzzle content will then be added inside this element. If you want to place
the puzzle inside a specific element with a different HTML id, you can pass the
id as an argument when creating the puzzle, as in
`createExolve(specs, 'my-elt-id')`. Note that it's possible to have multiple
puzzles on the same web page, created and place in HTML elements with different
ids.

## Reading other formats

### ipuz
You can load the additional script file, `exolve-from-ipuz.js` and call
`exolveFromIpuz(ipuz)` on an object in the
[ipuz format](http://www.ipuz.org/crossword). See the example in
`test-ipuz-solved.html` for an example.

### .puz
You can load the additional script file, `exolve-from-puz.js` and call
`exolveFromPuz(puz)` on the contents of a .puz file (which are in the
[puz format](https://code.google.com/archive/p/puz/wikis/FileFormat.wiki)).

### Plain text of just the clues
You can load the additional script file, `exolve-from-text.js` and call
`exolveFromText(w, h, text)` where `text` has all the clues separated by
line-breaks, with 'Across' and 'Down' as headings for the two clues sections.
This will figure out the matching `w`x`h` blocked grid using cues from clue
numbers and enums. The grid can be easily and uniquely figured out in most
cases (you might have done this when solving a diagramless puzzle) with a few
caveats listed below. Occasionally, multiple grids will match the pattern
implied by the clues, and all are returned for the calling application
to pass on to the user to disambiguate. The prime use-case is that of PDFs (see
the next subsection).

Each clue can be split over multiple lines, but if one of those lines
leads with a number then the parsing code will get confused. Best to pre-process
to have one clue per line.

The plain text can optionally include a title, a byline, a copyright line, and
a preamble, before the 'Across' line that marks the beginning of the clues. The
parsing code for these sections is *very* naive and may make mistakes.

This functionality is only supported for standard, blocked, UK-style crossword
grids. Here are the constraints under which this works:
- The grid is symmetric
- Every 4x4 area has at least one black cell.
- No light is shorter than 3 letters.
- Enums are provided for all clues. The only exception is child clues
  in linked groups.
- For a linked group of clues, the component lights split the linked
  entry at exactly word-breaks or hyphens. Moreover (to keep the
  algorithm complexity in check), only one extra word-break/hyphen in the
  entry is supported (compared to the number of linked clues).
- There aren't very long strips of consecutive blackened squares.


### .pdf
While it is tempting to add support for reading crosswords out of PDFs, it is
very hard to do so without adding package dependencies. For your own use,
you can do it by using external packages for PDFs. However, with the
`exolveFromText()` function, you can simply use the text from a PDF file
(completely ignoring the grid image in the PDF) and create an
interactively playable Exolve crossword. You can grab the text using
select-and-copy in a PDF viewer, or you can use a commandline tool such as
`pdftotext`.

### exolve-player.html
This is a generic web app for loading any crossword file (Exolve/ipuz/puz)
to allow interactive solving. In case of Exolve, of course, if you have
an HTML file already, you do not really need to use `exolve-player.html`.
But, for ipuz/puz/pdf files, this might be a convenient player to use. Once I
find a good OCR solution, I'll also try to enable opening pictures of
crosswords.

For crossword puzzles in PDF files, just copy the text of the crossword
(don't worry about the grid!) and past it into the `Paste text ...` area
in the interface. The software will be able to figure out the grid automatically
in most cases (see details above in).

You can use your own copy of the player, or you can use [the one that I
have put up on my site](https://viresh-ratnakar.github.io/exolve-player.html).

## On-screen layout

This is a quick summary of layout-related notes (already covered in various
sections above). This summary only applies to on-screen layout (see below
for print layout).

The layout of the crossword depends on the available width. This
description assumes a standard 15x15 grid with Across and Down clues—the
layout may vary a bit if you have oversized grids, or more clues panels
(such as `exolve-nodir` clues).

If the width is enough for three columns, then the layout has the two clues
panels laid out horizontally to the right of the grid. If the width is wide
enough for only one column, then the layout has the clues panels laid out
vertically under the grid.

## Printing

You can print web pages containing Exolve crosswords using the browser's "Print"
command (Ctrl-P or Cmd-P) or by using the "Print" link shown under the grid
(this latter way of printing opens up a panel that provides some additional
settings: see below). The current state of the crossword gets printed. If you
want to print the blank grid after you've already filled some entries, or if
you want to print the "fully revealed" grid (if available), then you can
re-open the crossword in an incognito window, get it to the state you desire to
print, and then print.

You can create PDF files for your crosswords by "printing to file" in most
browsers.

The printed puzzle is laid out in a newspaper-like multi-column layout
(except under the "Page break" setting described later). If not all the puzzle
entries have been filled in, then the printing is done in three columns, with
the grid occupying two columns. This makes the grid a bit larger and easier
for writing into.

If all the puzzle entries have been filled in, then the printing is done in
two columns, with the grid occupying the first column (which makes it slightly
smaller than the three-column layout for incomplete puzzles). If the puzzle
provides annotations and/or explanations that get revealed, then this two-column
layout is especially useful to limit the printed size.

For most puzzles, this layout should fit within a single page, in Portrait mode,
for standard page sizes. You can reduce the font size from the settings menu if
it just goes over a single page by a few lines.

*As of September 2023, at least in Chrome, printing has become buggy when the
puzzle spills over to a second page. Please reduce font-size if that happens, to
try to fit the puzzle into a single page.*

You can override the column choices for completed (default: 2 columns) and
incomplete (default: 3 columns) puzzles using the exolve-options
`print-completed-3cols` and `print-incomplete-2cols` respectively.

Before printing, any highlighting of the currently active clue is removed,
and it is restored after printing.

If it does not make sense for some chunks of text or some HTML elements to be
printed (for example, some instructions that only make sense in interactive
mode), you can enclose them in an HTML element (such as a `DIV` or a `SPAN`)
that has the class `xlv-dont-print`. Similarly, if there some text or some
HTML element that you want to be shown *only* in the printed version, then
you can add the class `xlv-only-print` to it.

### Additional settings for printing

Clicking on the "Print" link (that's shown under the grid) toggles a panel
with the title "Settings for printing/PDFs". This lets you specify:

- Page size (such as 'Letter' or 'A4'). As of May 2022, you still need to
  pick the same page size in the printer's settings that open up when you
  print, if you use a paper size that's not the current choice in the printer's
  settings.
- Page margin in inches. Caveat: very large margins may lead to some parts
  getting clipped.
- Font size (Normal, Large, Extra Large, Small, or specify an arbitrary font
  size). Please note that the specific font size picked, such as "18px" may
  not be the actual printed size exactly (because of scaling). However, in
  general, you can increase/decrease the font size setting and the printed
  size will increase/decrease accordingly.
- Print questions. When the crossword includes questions, a checkbox is shown
  to let you decide whether to include them in the printing (the option is
  ignored when printing in wysiwig mode).
- Page break before clues. If you select this option, then the grid gets
  printed on the first page (as does any preamble or revealed explanations),
  while the clues get printed on a separate page.
- Preamble below grid. Set this option to print the preamble below the grid
  rather than above it.
- Inksaver. Set this option to print using a chequered pattern instead of a
  complete fill as the background colour for blocks.
- Include QR code. Use this option to include a QR code. The QR code will
  use the URL of the current web page, but you can override that, and you
  can also override the call to action, which defaults to "Solve online".
  The QR code is printed to the bottom-right of the puzzle or the right of
  the preamble. When printing the QR code in the preamble, it's usually
  better to print the preamble below the grid.


Additionally, from this panel, you have three buttons for printing:

- You can click on a button labelled "Print crossword". This will print *only*
  the crossword. This is useful if the crossword is embedded with some
  background or other content around it. You can also print just the crossword
  using the shortcut Ctrl-b after clicking on any light cell in the crossword
  grid.
- You can click on a button labelled "Print page". This will print the whole
  page, just like what you'll get from the browser's "print" function (which
  can be invoked with a Ctrl-p or Cmd-p).
- If you want to print the whole page *without reformatting the crossword*
  (if Exolve's reformatting plays havoc, overlapping with the surrounding
  content, for example), then you can click on "Print wysiwyg".

### Printing layout algorithm details

In preparation for printing, Exolve lays out the crossword part of the page
(which is usually the whole page) using a width of 992 pixels (488 + 16 in
2-columns format, and 320 + 16 + 320 + 16 + 320 in 3-column format) with 0
margin. It then balances the clues across the 3 or 2 columns, so that the
bottom edge is even.

This is followed by an attempt at pagination (only done if the top-left of the
Exolve crossword is very near the top-left of the page). The aspect ratio of
the page size specified (taking into account the margins) is used to find where
the page boundary is (in pixels). If the content already fits in one page, then
nothing further needs to be done. If the content seems to only slighlty spill
over to a second page, then a small left margin is added, sufficient to make the
aspect ratio fit. If there's a non-trivial spill onto a second page, then
Exolve inserts empty helper divs (with heights set as needed) to try to ensure
that no clue is cut midway at the bottom of the first page *and* that the the
remaining clues line up at the top on the second page. The hope is that browser
will simply scale the content correctly and will arrive at the same page
boundary.

If printing only the crossword, all other page content is temporarily moved
inside a DIV that is not displayed, whereas the top frame DIV of the Exolve
crossword is moved to the beginning of `document.body`.

After printing, Exolve reverts the page rendering to its original state.

### Browser-specific printing peculiarities

Brwosers have their own printing layout algorithms that sometimes do not behave
as expected by Exolve's printing layout algorithm. Here are some known issues as
of September, 2023.

- Printing settings in Firefox seem especially complex. If the printed area
  overflows with Firefox, try toggling to set the Firefox print setting
  "Fit to page width" instead of "Scale [100]."

## Webifi

Webifi is an "interactive-fictionesque" interface to crosswords. It adds a
chat interface through which you can explore and solve the crossword using simple
text commands (and get some solving assistance too!).

Webifi can be used as an entertaining addition to the standard graphical
interface. Webifi supports audio output too. Using audio output and voice
input, Webifi can be used to solve a crossword even when you have limited
access to the device screen (such as while you are out on a walk or a run).
I hope to develop Webifi into something that can also enable sight-challenged
people to enjoy solving crosswords. The state of voice-input in a web app
is quite flawed and quirky, unfortunately, as of May 2022. One hopes that
it will only get better, enabling an excellent crossword-solving experience
through Webifi.

A Webifi link is placed under the crossword under these two scenarios:
- The webifi script files are included through script tags in the crossword
  file.
- `exolve-option: webifi` is used.
Webifi is also enabled and directly started if `webifi` is passed as a URL
parameter. Note that in the `exolve-option: webifi` case and in the URL
parameter case, it is not necessary to add script tags to load the webifi
scripts, as they will automatically loaded if not already present.

If you are using my serving copy of Exolve (i.e.,
[`viresh-ratnakar.github.io/exolve-m.js`](https://viresh-ratnakar.github.io/exolve-m.js)),
then all the script files etc. needed for Webifi will automatically be found
as needed.

You can find out how to serve your own copies of Webifi scripts, as well as
other Webifi details in the [Webifi user
guide](https://github.com/viresh-ratnakar/webifi/blob/master/README.md).

I have enabled Webifi for almost all of my own crosswords at
[gussalufz.com](https://viresh-ratnakar.github.io). In addition, any
crossword that you open with [`exolve-player`](https://viresh-ratnakar.github.io/exolve-player.html)
will have Webifi enabled (you will see a `Webifi` link under the crossword).
Please feel free to play with it and offer feedback.

## API

The Exolve code creates only the following names at global scope:

- `Exolve`
- `exolvePuzzles`
- `createExolve`
- `createPuzzle` (deprecated).

The most generic way to create a puzzle is with `new Exolve(...)`.

- The `createExolve()` function is a covenient wrapper.
- The `createExolve()` function looks for and calls the function
  `customizeExolve()` if it exists (passing it the created puzzle).
- The `createPuzzle()` function is similar to `createExolve()`, and
  is deprecated (as the name may conflict with some other code).
- All HTML ids/class names begin with `xlv`.

```
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
 * customized is an optional function that will get called after the puzzle
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
function Exolve(puzzleText,
                containerId="",
                customizer=null,
                provideStateUrl=true,
                visTop=0,
                maxDim=0,
                notTemp=true) {...}

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
 * inIframe can be set to true if the puzzle is embedded in an iframe, which
 *     will then set provideStateUrl to false.
 * @deprecated use createExolve().
 */
function createPuzzle(inIframe=false) {
  return createExolve(puzzleText, "", !inIframe);
}
```

## Frequently Asked Questions

**We are an established newspaper. Our readers have complained in various ways
about our online interactive crossword. Can we use your code?**

See below (same answer).

**We are a small newsletter and we occasionally feature a crossword. Our
readers have asked for an online interactive solver. Can we use your code?**

Yes. The software is free, and is released under the rather permissive MIT
License.

