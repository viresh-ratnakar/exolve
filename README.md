# Exolve

## An Easily Configurable Interactive Crossword Solver

### Version: Exolve v0.94 October 4 2020

Exolve can help you create online interactively solvable crosswords (simple
ones with blocks and/or bars as well as those that are jumbles or are
diagramless or are 3-d, etc.) in any language.

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

Here is a minimal example of the puzzle specification:

```
exolve-begin
  exolve-id: tiny-42
  exolve-title: Tiny Demo Crossword
  exolve-setter: Exolve
  exolve-width: 5
  exolve-height: 5
  exolve-grid:
    HELLO
    O...L
    WORLD
    L...E
    STEER
  exolve-across:
    1 Greeting (5)
    3 Earth (5)
    4 Guide (5)
  exolve-down:
    1 Emits cry (5)
    2 More ancient (5)
exolve-end
```

The format is very simple and uses plain text (but the parsing code is
also simplistic and not very forgiving, so please go through the format
documentation). The setter has the option to provide solutions (as in the
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
active direction.

The control buttons (*Clear this*, *Clear all*, *Check this*, *Check all*,
*Reveal this*, and *Reveal all*) work as suggested by their names ("this" refers
to the currently selected clue(s)). You can click on a clue to jump to its
squares. If the setter has not provided all solutions, then only the
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
"Reveal all". Clue-specific annotations get revealed/hidden with
"Reveal/Clear this" buttons (unless the clue only has diagramless cells).
Additionally, "Check this" and "Check all" behave like "Reveal this" and
"Reveal all" respectively, if they find no mistakes. In a puzzle in which
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

The solver can press Tab/Shift-Tab to navigate to the next/previous clue in the
current direction. The solver can use the arrow keys to navigate to the
next/previous light cells in the direction of the arrow.

The software tries to keep the current clue visible when scrolling, as long
as the square with the cursor is visible.

"Clear/Check/Reveal all" buttons, the "Show ninas" button, and the "Submit"
button solicit additional confirmation from the solver.

You can click on the black background or on the puzzle title to unhighlight
the current clue (for printing or screenshotting, for example).

## Format
The puzzle can contain the following "sections" between the `exolve-begin` line
and the `exolve-end` line:

* **`exolve-id`**
* `exolve-title`
* `exolve-setter`
* `exolve-copyright`
* `exolve-credits`
* **`exolve-width`**
* **`exolve-height`**
* `exolve-preamble` / `exolve-prelude`
* `exolve-postscript`
* **`exolve-grid`**
* `exolve-across`
* `exolve-down`
* `exolve-nodir`
* `exolve-explanations`
* `exolve-nina`
* `exolve-colour` / `exolve-color`
* `exolve-question`
* `exolve-submit`
* `exolve-option`
* `exolve-language`
* `exolve-relabel`

Each section has the section name (`exolve-something`), followed by a colon.
Other than the `exolve-preamble`/`exolve-prelude`, `exolve-grid`,
`exolve-across`, `exolve-down`, `exolve-nodir`, `exolve-explanations`, and
`exolve-postscript` sections, all other sections occupy a single line (some can
be repeated though). For such single-line sections, the "value" of the section
is the text following the colon on the same line.

The bolded sections, namely, `exolve-id`, `exolve-width`, `exolve-height`, and
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

## `exolve-id`
Provide a unique id for this crossword puzzle. Use only alphanumeric characters
and dashes (-), and start with a letter. This id is used as the key for
saving/restoring state and also to distinguish between multiple puzzles on a
single page. You can create an unsolved version of a puzzle (to run a contest,
for example) and, later, a version of the same puzzle that has the solutions,
giving them both the same `exolve-id`. Then, when solvers visit the version
with solutions, they can see their own entries and see which mistakes they
made, if any. Example:
```
  exolve-id: tiny-42
```

## `exolve-title`, `exolve-setter`
The title of the puzzle and the name/pseudonym of the crossword setter. Example:
```
  exolve-title: My Lovely Crossword
  exolve-setter: Narsi Sus
```

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

## `exolve-width`, `exolve-height`
The width and height of the puzzle—i.e., how many squares across and how many
squares down is the crossword grid. Example:
```
  exolve-width: 15
  exolve-height: 15
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
[`exolve-language`](#exolve-language) section), then your _must_ separate grid
letters (when specifying a grid with solutions) with a space (unless they are
already separated by decorator). For example, this will *not* work:
```
  exolve-grid:
     सेहत
```
This will work:
```
  exolve-grid:
     से ह त
```

## Some details about clue numbers
Across and down clue numbers are automatically inferred from the grid, except
in two cases. The first is when there are diagramless cells and solutions
have not been provided. The second is in jigsaw-style puzzles, where the setter
opts to deliberately not provide associations between grid squares and clues,
by using non-numeric clue labels without providing their grid locations. When
the solver is entering a value in a light for which the clue association is not
known, the highlighted "current clue" browsable interface runs through all the
clues for which all grid cells are not known.

## Extended chessboard notation
In a few cases (such as when specifying colouring or ninas or locations of
some clue numbers in diagramless puzzles), you will need to specify the location
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

## Some details about diagramless cells
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

If the enum indicates multiple words (for example, *(4,3)*), or if the enum
indicates hyphenated words (for example, *(4-2)*), then the word boundary or
the hyphen gets displayed in the grid, to help solvers. The software uses the
following criteria to decide what constitutes the enum part of a clue: a pair
of opening and closing parentheses, containing only numbers, hyphens, commas,
apostrophes, and periods, starting with a number. The software also treats a
pair of parentheses containing the text "word" or "letter" or "?" with anything
before are after it as an enum (to allow the setter to specify the enum as
"(two words)" or "(?)", for example).

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
solution text. This might have meant that if in an older grid the the solution
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
leading part as the solution, like "... (6) [WITTER] [t]WITTER ..."

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
```
    28 ~{{xlv-blue}Replace}~ bottles ~{{my-style}containing}~ ~{questionable medicine}~ (7) Hidden word: (-re)PLACE BO(-ttles).
```
Here, "xlv-blue" is a class name that Exolve has set up in its CSS (some others
are "xlv-red", "xlv-yellow-bg", and "xlv-pink-bg"). But you can use your own
class names too (such as "my-style" above) and specify their stylings with your
own custom CSS rules.

### Linked clues
If a linked clue includes other "children clues," this can be indicated by
appending a comma-separated list of children clue numbers to the parent clue
number. Example:
```
  exolve-across:
    1, 5, 2d In spite of adverse circumstances (7,3,4)
    5 See 1 Across
    ...
  exolve-down:
    2 See 1 Across
```
As shown in the above example, if a child clue (2d in the example) has a
different direction from the parent, the direction can be specified with a
one-letter suffix ("a" or "d").

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
`exolve-across`/`exolve-down`/`exolve-nodir`) that cannot be parsed as a clue
is treated as a filler line. It is simply displayed in that position in the
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
a new table of clues.

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

### Nodir clues with cells explicitly specified
In a nodir clue, you can specify not just the starting cell, but _all the cells_
using the chessboard notation. If you do that, then clicking on a cell in that
clue will highlight and allow entry in all the cells for that clue (cells in
a nodir clue can be scattered arbitrarily in the grid). Example:
```
  exolve-nodir:
    #c3 #c5 #c8 #f6 [A] One hundred years lived in prison (4)
```
Note that this technique can be used to create 3-d (or 4-d!) puzzles. Use a
nodir section for the third dimension, explicitly specifying the cells for
each clue along the third dimension.

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

The placeholder entries do NOT get cleared with 'clear this/all' (they can
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
"Reveal this" then 1a will be revealed in the grid, and A till get highlighted
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
The colour itself can be any valid
[HTML colour name](https://www.w3schools.com/colors/colors_names.asp).

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


## `exolve-option`
In this single-line, repeatable section, the setter can specify certain options.
Multiple, space-separated options may be provided on each exolve-option line.
For options that need a value (provided after a colon), there should not be
any leading space after the colon.
The list of currently supported options is as follows:
- **`hide-inferred-numbers`** If this option is specified, then the software does
  not display any clue numbers that were automatically inferred. Setters using
  non-numeric clue labels may want to specify this option.
- **`clues-panel-lines:<N>`** Limit the across/down/nodir clues boxes to
  about N lines of text, adding scrollbars if needed.
- **`offset-top:<N>`** Draw the grid with this much space above and under
  it (N pixels). Useful for drawing additional art around the grid using
  `customizeExolve()`, for example.
- **`offset-left:<N>`** Draw the grid with this much space to the left and
  to the right (N pixels). Useful for drawing additional art around the grid
  using `customizeExolve()`, for example.
- **`grid-background:<c>`** Set the colour of the black cells to &lt;c&gt;,
  which should be a valid HTML colour name/code. This option is deprecated.
  Please use color-background (see below).
- **`allow-digits`** If this option is specified, then we allow solvers to enter
  digits in cells.
- **`hide-copy-placeholder-buttons`** This is an option that is only applicable
  when there are nodir clues without cells explicitly specified. It turns off
  the display of buttons to copy placeholder texts in those cases (see the
  subsection below on "Jigsaw puzzle clues").
  **`no-auto-solution-in-anno`** In a grid with solutions, we automatically
  show the solution next to the clue, when "Reveal all" or "Reveal this" is
  used. Set this option to disable that. Useful if you want to control
  how the solution appears in the anno. Also see the note on "anno" in the
  section on clues.
- **`colour-<name>:<c>` or `color-<name>:<c>`** Set the
  colour of the element named &lt;name&gt; to &lt;c&gt;, which should be a
  valid HTML colour name/code (do not include spaces within it though). See the
  "Colour schemes" subsection below for details.

### Colour schemes
Using a bunch of `exolve-option: colour-<name>:<c>` (or, of course,
`exolve-option: color-<name>:<c>`) options, the colour scheme of
a puzzle can be altered comprehensively. The following table lists all possible
supported values for `colour-<name>`, their default values (that you would
be overriding), and descriptions.

| Option                     | Default value | What gets coloured                |
|----------------------------|---------------|-----------------------------------|
| `colour-background`        | black         | The background: blocked squares and bars.|
| `colour-cell`              | white         | Light squares.                    |
| `colour-active`            | mistyrose     | Squares for the light(s) currently active. The current clue(s) in the clues list also get(s) this as background colour.|
| `colour-currclue`          | white         | Background for the current clue above the grid.|
| `colour-orphan`            | linen         | The background colour of the current clue(s) without known location(s) in the grid.|
| `colour-input`             | #ffb6b4       | The light square where the solver is typing.|
| `colour-light-label`       | black         | The number (or nun-numeric label) of a clue, in its first square. |
| `colour-light-label-input` | black         | Same as above, in the square where the solver is typing.|
| `colour-light-text`        | black         | The typed solution letters in lights.|
| `colour-light-text-input`  | black         | Same as above, in the square where the solver is typing.|
| `colour-circle`            | gray          | Any circles drawn with the @ decorator.|
| `colour-circle-input`      | gray          | Same as above, in the square where the solver is typing.|
| `colour-caret`             | gray          | The flashing cursor in the square where the solver is typing.|
| `colour-arrow`             | mistyrose     | The right- or down-arrow in the square where the solver is typing.|
| `colour-prefill`           | blue          | Any letters pre-filled with the ! decorator.|
| `colour-anno`              | darkgreen     | The text of the annotation.       |
| `colour-solved`            | dodgerblue    | The clue number in the list of clues, once the clue has been solved.|
| `colour-separator`         | blue          | The hyphens and dashes in multi-word lights. |
| `colour-imp-text`          | darkgreen     | "Important" text: setter's name, answer entries, placeholder entries, grid-filling status.|
| `colour-button`            | #4caf50       | Buttons (Check/Reveal etc).       |
| `colour-button-hover`      | darkgreen     | Buttons with mouseover.           |
| `colour-button-text`       | white         | The text in buttons.              |
| `colour-small-button`      | inherit       | Small buttons in the current clue(s).|
| `colour-small-button-hover`| lightpink     | Small buttons with mouseover.     |
| `colour-small-button-text` | darkgreen     | The text in small buttons.        |

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
already sets this to 4 (but you can override that if you specify a value
here). When &lt;max-char-codes-per-letter&gt; is greater than 1, auto-advance is
disabled, as the software cannot know when a letter being entered in a cell
is finished—solvers need to use the arrow key or need to click on the next
cell when they finish typing a letter.

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
| `clear.hover`    | Clear highlighted clues and squares. Clear crossers from full clues with a second click|
| `clear-all`      | Clear all!                           |
| `clear-all.hover` | Clear everything! A second click clears all placeholder entries in clues without known squares|
| `check`          | Check this                           |
| `checkcell`      | Check cell                           |
| `check.hover`    | Erase mistakes in highlighted squares. Long-click to check the just current cell|
| `check-all`      | Check all!                           |
| `check-all.hover` | Erase all mistakes. Reveal any available annos if no mistakes|
| `reveal`         | Reveal this                          |
| `revealcell`     | Reveal cell                           |
| `reveal.hover`   | Reveal highlighted clue/squares. Long-click to reveal the just current cell|
| `show-ninas`     | Show ninas                           |
| `show-ninas.hover` | Show ninas hidden in the grid/clues |
| `hide-ninas`     | Hide ninas                           |
| `hide-ninas.hover` | Hide ninas shown in the grid/clues |
| `reveal-all`     | Reveal all!                          |
| `reveal-all.hover` | Reveal all solutions, available annos, answers, notes! |
| `submit`         | Submit                               |
| `submit.hover`   | Submit the solution!                 |
| `setter-by`      | By                                   |
| `curr-clue-prev` | &lsaquo;                             |
| `curr-clue-prev.hover` | Previous clue       |
| `curr-clue-next` | &rsaquo;                             |
| `curr-clue-next.hover` | Next clue           |
| `squares-filled` | Squares filled                       |
| `across-label`   | Across                               |
| `down-label`     | Down                                 |
| `tools-link`     | Tools                                |
| `tools-link.hover` | Show/hide tools: list of control keys and scratch pad|
| `tools-msg`      | &lt;ul&gt; &lt;li&gt; &lt;b&gt;Tab/Shift-Tab: [longish list of all control keys]...  &lt;/ul&gt;|                    |
| `exolve-link`    | Exolve on GitHub                     |
| `report-bug`     | Report bug                           |
| `saving-msg`     | Your entries are auto-saved in cookies, for puzzles accessed over HTTPS and not from local files.|
| `saving-bookmark`| You can bookmark/save this link as additional back-up:|
| `saving-url`     | URL                                  |
| `shuffle`        | Scratch pad: (click here to shuffle) |
| `shuffle.hover`  | Shuffle selected text (or all text, if none selected)|
| `across-letter`  | a                                    |
| `down-letter`    | d                                    |
| `mark-clue.hover` | Click to forcibly mark/unmark as solved <sub>(Only used for clue labels on clues that do not have all their cell-associations known)</sub>|
| `placeholder.hover` | You can record your solution here before copying to squares |
| `placeholder-copy` | &#8690; |
| `placeholder-copy.hover`| Copy into currently highlighted squares |
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

The `.hover`-suffixed names are for tooltips. These relabelings for these
should not include HTML markup.

## Saving state

The software automatically saves state. It does so in the URL (after the #)
and also in a cookie, using the id specified in the [`exolve-id`](#exolve-id)
section as the key. The cookie is retained for 90 days after the last change.

Because of limits on cookie size and number of cookies, the state for some
grid that was saved in a cookie may disappear if the solver opens lots of
other grids from the same site, Such sites should encourage solvers to save
or bookmark the URL (which also has the state) and/or implement server-side
state saving.

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

Finally, if you just use a blogging platform (such as Blogger), or if you just
want to add crossword puzzles to web pages (that may have other content and may
be using other scripts/CSS), you also have the "widget" option, detailed in the
next subsection.

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
welcome!). Prior to v0.84, you could not have more than one Exolve puzzle
within a single web page (now you can!) and I had created some code to
get around that by embedding Exolve puzzles in iframes. This code still exists
(see the files [exolve-widget-creator.js](exolve-widget-creator.js) and
[exolve-widget.html](exolve-widget.html)), but there really is no reason to bury
puzzles in iframes now (which has its drawbacks such as adding extra scroll
bars).

## Customizations
Beyond changing colours and button texts (which can be done through
exolve-option and exolve-relabel), setters can customize their grids to add
special effects, etc. by directly making changes to the Exolve code. However,
this may get hard to maintain over time, as Exolve goes through new versions.

The recommended way to customize is to load separate, additional JavaScript
and/or CSS files. Exolve provides a JavaScript hook to do any custom
initialization and/or to modify the HTML using JavaScript. If the setter has
defined a function called `customizeExolve(p)`, then it gets called after
Exolve has finished with its own set-up, with the puzzle object passed as p.
For example, the following code, if added within the &lt;script&gt; tag or
loaded from a script file, will customize the HTML by inserting the italicized
red text *Whew!* after the puzzle.
```
  function customizeExolve(p) {
    p.frame.insertAdjacentHTML(
        'beforeend', '<span style="color:red;font-style:italic">Whew!</span>')
  }
```

It will be easier to keep your files synced up to the latest Exolve version
by using `customizeExolve()` for customizations, instead of editing the
HTML or JavaScript directly. You can examine the JavaScript/CSS code to see all
the members of the Exolve object (passed as the parameter p above) and all the
HTML class names and IDs.

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
puzzle content will then be added inside this element.

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
 * puzzleText contains the puzzle specs.
 * containerId is the optional HTML id of the container element in which you
 *     want to create this puzzle. If empty, the puzzle is created inside
 *     the element with id "exolve" if it exists (and its id is changed to
 *     exolve<N> in that case, where <N> is the index of this puzzle among
 *     all the pages on the page). If containerId is empty and there is no
 *     element with id "exolve", the the puzzle is created at the end of the
 *     web page.
 * customized is an optional function that will get called after the puzzle
 *     is set up. The Exolve object will be passed to the function.
 * addStateToUrl should be set to false only if you do *not* want to save
 *     the puzzle state in the URL (the puzzle state is also saved in a
 *     cookie, but that does not work for local files). Unless you are
 *     embedding the puzzle in an iframe for some reason, set this to true.
 * visTop should be set to the height of any sticky/fixed position elements
 *     at the top of the page (normally just 0).
 * maxDim If non-zero, use this as the suggested max size of the container
 *    in px.
 */
function Exolve(puzzleText,
                containerId="",
                customizer=null,
                addStateToUrl=true,
                visTop=0,
                maxDim=0) {...}

/**
 * createExolve(puzzleText) is just a convenient wrapper that looks for
 *     the customizeExolve() function.
 * See documentation of parameters above the Exolve constructor definition.
 */
function createExolve(puzzleText, containerId="",
                      addStateToUrl=true, visTop=0, maxDim=0) {
  const customizer = (typeof customizeExolve === 'function') ?
      customizeExolve : null;
  let p = new Exolve(puzzleText, containerId, customizer,
                     addStateToUrl, visTop, maxDim);
}

/*
 * The global variable "puzzleText" should have been set to the puzzle specs.
 * inIframe can be set to true if the puzzle is embedded in an iframe, which
 *     will then set addStateToUrl to false.
 * @deprecated use createExolve().
 */
function createPuzzle(inIframe=false) {
  createExolve(puzzleText, "", !inIframe);
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

