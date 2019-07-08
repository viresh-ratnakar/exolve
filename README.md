# exolve
Online crossword solver

exolve.html contains *all* the code you need: just make a copy and then replace
the part that contains the example grid with your own grid, strting at the
"exolve-begin" line and ending at the "exolve-end" line.

Here is a minimal example:

exolve-begin
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

The format is very simple and uses plain text (but the parsing code is
simplistic and not very forgiving, so please go through the format
documentation).

A few example puzzles are also included in this directory, each in a file with
the ".exolve" extension. These showcase some of the available features, such as
ninas, additional clues or questions, submission, barred puzzles, diagramless
puzzles, etc. To try one of these, create a copy of exolve.html and edit it as
described above, splicing in the whole .exolve file from exolve-begin to
exolve-end.

## Format
The puzzle can contain the following "sections" between the exolve-begin line
and the exolve-end line:

* exolve-id
* exolve-title
* exolve-setter
* exolve-copyright
* exolve-prelude
* *exolve-width*
* *exolve-height*
* *exolve-grid*
* *exolve-across*
* *exolve-down*
* exolve-nina
* exolve-question
* exolve-submit

The italicized sections, namely exolve-width, exolve-height, exolve-grid,
exolve-across, and exolve-down, are required. The other sections are optional,
but exolve-id, exolve-title, exolve-setter should probably be present in most
puzzles.

Special characters:
| draw bar after
_ draw bar under
+ draw bar after and under
@ draw circle
* diagramless
$ bar after and circle
= bar under and circle
# bar after and under and circle
! bar after and diagramless
& bar under and diagramless
% bar after and under and diagramless
~ draw circle and diagramless

