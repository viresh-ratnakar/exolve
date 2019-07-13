# exolve

## An Easily Configurable Interactive Crossword Solver

exolve.html contains *all* the code you need: just make a copy and then replace
the part that contains the example grid with your own grid, starting at the
"exolve-begin" line and ending at the "exolve-end" line.

Here is a minimal example:

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
example above), or just use 0 to indicate a square that needs to be filled
(i.e., a "light," in crossword terms).

A few example puzzles are also included in this directory, each in a file with
the ".exolve" extension. These showcase some of the available features, such as
ninas, additional clues or questions, submission, barred puzzles, diagramless
puzzles, etc. To try one of these, create a copy of exolve.html and edit it as
described above, splicing in the whole .exolve file from exolve-begin to
exolve-end.

## Controls
The basic control is to click on a square and enter a letter in it. If a square
is a part of both an across clue and a down clue, then clicking on that square
while it is the current square will toggle the active direction.

The control buttons (*Clear this*, *Clear all*, *Check this*, *Check all*,
*Reveal this*, and *Reveal all*) work as suggested by their names ("this" refers
to the currently selected clue(s)). You can click on a clue to jump to its
squares. You can use the arrow keys. If the setter has not provided all
solutions, then only the "Clear this/all" control buttons are shown, the
"Check/Reveal" buttons do not get shown.

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
some clues (or by writing them in the exolve-explanations section), then these
annotations get shown when the solver clicks "Reveal all".

If the setter has provided the location of one or more ninas (through
exolve-nina sections), then an additional button control, *Show ninas*, gets
shown, for the solver to see where the ninas are. The button can be clicked
again to hide the nina locations. Ninas also get shown on clicking "Reveal all".

If the setter has asked additional questions in the puzzle (through
exolve-question sections), then input fields for these get shown too.
"Reveal/Clear all" controls buttons also include revealing/clearing
answers to these questions apart from showing/hiding annos/explanations/ninas.

If the setter has set up a submit URL (with an exolve-submit section—the URL
can be set up using a Google Form, for instance), then there is a *Submit*
buttion.

When the solver enters a letter in a square, the cursor automatically jumps to
the next square for the currently active clue (the next square can be from a
different clue, when there are clues that "cover" other clues). In a
diagramless squarel in a puzzle for which the solver has not provided all
solutions, there is no such automatic move after entereing a letter (as the
software itself has no way of knowing where the next square is).

"Clear/Check/Reveal all" buttons, the "Show ninas" button, and the "Submit"
button solicit additional confirmation from the solver.

## Format
The puzzle can contain the following "sections" between the exolve-begin line
and the exolve-end line:

* exolve-id
* exolve-title
* exolve-setter
* exolve-copyright
* exolve-prelude
* **exolve-width**
* **exolve-height**
* **exolve-grid**
* **exolve-across**
* **exolve-down**
* exolve-explanations
* exolve-nina
* exolve-question
* exolve-submit

Each section has the section name (exolve-something), followed by a colon.
Other than the exolve-prelude, exolve-grid, exolve-across, exolve-down,
and exolve-explanations sections, all other sections occupy a single line
(some can be repeated though). For such single-line sections, the "value" of
the section is the text following the colon on the same line.

The bolded sections, namely, exolve-width, exolve-height, exolve-grid,
exolve-across, and exolve-down, are required. The other sections are optional,
but exolve-id, exolve-title, exolve-setter should probably be present in most
puzzles.

## exolve-id
Provide a unique id. Use only alphanumeric characters and dashes (-). This
id is used as the key for saving/restoring state. You can create an unsolved
version of a puzzle (to run a contest, for example) and, later, a version of
the same puzzle that has the solutions, giving them both the same exolve-id.
Then, when solvers visit the version with solutions, they can see their own
entries and see which mistakes they made, if any. Example:
```
  exolve-id: tiny-42
```

## exolve-title, exolve-setter
The title of the puzzle and the name/pseudonym of the crossword setter. Example:
```
  exolve-title: My Lovely Crossword
  exolve-setter: Narsi Sus
```

## exolve-copyright
If your provide this, it will be displayed with the copyright symbol, to the
bottom right of the rendered puzzle grid. Example:
```
  exolve-copyright: 2019 Viresh Ratnakar
```

## exolve-width, exolve-height
The width and height of the puzzle—i.e., how many squares across and how many
squares down is the crossword grid. Example:
```
  exolve-width: 15
  exolve-height: 15
```

## exolve-prelude
Crossword puzzles often come with a prelude that contains special instructions
and/or hints. The prelude text occupies multiple lines—starting from the
line *after* the exolve-prelude: line, and going all they way down to the line
preceding the next exolve-foo section. The prelude may include html tags. The
prelude is rendered just above the grid, in the rendered puzzle. Example:
```
  exolve-prelude:
    Words should be entered in the grid <i>after</i> deleting one letter. The
    letters thus deleted, in clue order, form the name of a famous farm
    animal.
```

## exolve-grid
The grid specification starts from the line *after* the exolve-grid and goes all
the way to the next exolve- section. There should be exactly as many lines
in this section as the height of the grid. On each line, the squares in that
row of the grid are specified.

There are two kinds of puzzles: with solutions provided and without solutions.
Here are simple examples of both:

Grid with solutions:
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

Grid without solutions:
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

Here again is the complete list of decorators:
```
| draw bar after
_ draw bar under
+ draw bar after and under
@ draw circle
* diagramless
```

## Some details about diagramless cells
Note that "diagramlessness" only hides from the solver whether a square is
a light or a blocked square—if the setter has used any bars, they do get
displayed to the solver, even in diagramless cells.

If a puzzle with diagramless squares has specified all solutions, then
check/reveal controls get displayed. For example, revealing a blocked
diagramless square will show the dark square character, ⬛, in that square. 

If the solver wants to *not* provide solutions for a puzzle that has some
diagramless squares, then the blocked square marker (".") should not be used
in the blocked squares that are also diagramless (otherwise the solver can peak
into the HTML source and see where the blocked squares are). Each diagramless
square should be specified with a "0" followed by one of the diagramless
decorators, for example, "0\*"). But then, even the exolve software has no way
of knowing which grid square any clue starts on. However, sometimes, even in a
puzzle with diagramless squares, the setter does want to provide the clue start
locations for *some* clues. Exolve provides a way to do this: the setter can
optionally include the location of the square where a clue starts for any clue,
using the chessboard notation. Details are provided in the exolve-across/down
section below.

## exolve-across, exolve-down
The exolve-across and exolve-down sections should be used to specify the across
and down clues, respectively. There should be one clue per line, and there
should not be any blank lines. The clues should start with the clue number, and
end with the enum (the enum is not strictly required). Example:
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
the hyphen gets displayed in the grid, to help solvers.

If a clue "covers" other "children clues," this can be indicated by appending
a comma-separated list of children clue numbers to the parent clue number.
Example:
```
  exolve-across:
    1, 5, 2D In spite of adverse circumstances (7, 3, 4)
    5 See 1 Across
    ...
  exolve-down:
    2 See 1 Across
```
As shown in the above example, if a child clue (2D in the example) has a
different direction from the parent, the direction can be specified with a
one-letter suffix ("A" or "D").

As mentioned in the previous section, in a grid that has diagramless squares
and that does not provide solutions, if the setter wants to display some clue
numbers in squares, they can do so by prepending the clue (in the exolve-across
or exolve-down section) with "#XN", there X is the column ("a" being the first
column, "b" being the second column, etc.) and N is the row number (1 being the
bottom row, 2 being the row above the bottom row, etc.). This is essentially
an extension of the chessboard notation. I considered using programming
notation, but went with this for hopefully wider understanding. This notation
is also used for specifying ninas. Example:
```
  exolve-across:
    #a9 15 Imprison and tie perhaps
```
In this example, the clue number (15) will get displayed in the square that is
in the first column and the 9th row from the bottom.

## exolve-explanations
In a grid that includes solutions, the setter may provide additional notes,
explanations, commentary, etc. (or even annotations, if they haven't given them
with the clues), in an exolve-explanations section. Just like the
exolve-prelude section, this section also has multiple lines, and these lines
can include html tags. The contents get revealed when the solver clicks on
"Reveal all".
```
  exolve-explanations:
    This puzzle's hidden message was driven by occasional hiccups in
    some <i>noted</i> interactive solvers.
```

## exolve-nina
If a setter has included ninas in the grid, and if they are putting up a version
that has solutions included, they can also specify where the ninas are, and in
that case, a "Show ninas" control button will get displayed. Each nina should
use its own "exolve-nina:" line, and the ninas will get displayed in different
colours upon clicking "Show ninas" (as well as "Reveal all").

The squares involved in a nina are specified in the same chessboard notation
described above. Example:
```
  exolve-nina: j5 j7 j9 j11 j13
  exolve-nina: a7 b7 c7 d7 e7
```
This example is from a puzzle with two ninas. The first one is in the 10th
column ("j"), and the second one is in the seventh row from the bottom.

## exolve-question
Often, the setter might have hidden additional information for the solver to
discover (such as ninas), or may simply want to survey solvers about something
(such as their favourite clues). The exolve-question section can be used to
do this. Example:
```
  exolve-question: What is the nina that begins with S?
  exolve-question: What is the nina that requests people to find a famous TV series? (3, 4) GET LOST
  exolve-question: Your name
```
In this example, there are three questions. An answer has also been provided for
the second question. The part following the last closing parenthesis (")") (if
there is one) is treated as the answer. The answer is not shown in the displayed
question. When the solver clicks "Reveal all", answers to all questions for
which answers have been provided do get revealed.

If the setter has created an exolve-submit section (see below), then answers to
each exolve-question are also sent to the submit URL (see below for details).

## exolve-submit
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
exolve-question sections. So, for this example, if the answers entered for the
exolve-questions are ANSWER1, ANSWER2, respectively, then the full URL for
submission will be:
```
  https://something&k=ACER.REAR&k1=ANSWER1&k2=ANSWER2
``` 

The submission is made using HTTP GET.

One easy way to set up submissions is to create a Google Form with one Google
Form question for the solution letters, and one Google Form question for each
exolve-question (using "Short answer" as the question type in each case). Then
the "Get prefilled link" option can be used to get a URL with all the needed
keys.

## Saving state
The software automatically saves state. It does so in a cookie, using the id
specified in the exolve-id section as the key.

If an html file containing an exolve puzzle has been direcly loaded into
Chrome from the local computer (i.e., using a file://... URL), then Chrome
does not save cookies. Exolve also saves state in the URL itself, by appending
the state after a "#". Exolve only does this if the URL is not an http://..
URL.

## Frequently Asked Questions

**We are an established newspaper. Our readers have complained in various ways
about our online interactive crossword. Can we use your code?**

See below (same answer).

**We are a small newsletter and we occasionally feature a crossword. Our
readers have asked for an online interactive solver. Can we use your code?**

Yes. The software is free, and is released under the rather permissive MIT
License.

**Why is everything wrapped in a single exolve.html file?**

I really want to keep the released version in this state: a single,
self-contained HTML file containing all the CSS and all the Javascript it needs.
Vanilla Javascript, nothing to import, no scripts to run, absolutely zero
dependencies.

Of course, when you adopt it for your use, you might want to use all kinds of
fancy frameworks and enhancements and refactorings. But my releases will
continue to follow this simple structure.

**What is the http.sh file?**

Ignore it.

**No, really, what is the http.sh file?**

It's a simple and small bash script for splicing a \*.exolve file in the right
place into exolve.html and serving it with HTTP. It's based on
https://github.com/benrady/shinatra.




