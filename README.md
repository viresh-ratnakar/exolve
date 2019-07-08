# exolve
Online crossword solver

exolve.html contains *all* the code you need: just make a copy and then replace
the part that contains the example grid with your own grid, strting at the
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
* **exolve-width**
* **exolve-height**
* **exolve-grid**
* **exolve-across**
* **exolve-down**
* exolve-nina
* exolve-question
* exolve-submit

Each section has the section title, followed by a colon. Other than the
exolve-prelude, exolve-grid, exolve-across, and exolve-down sections, all other
sections occupy a single line (some can be repeated though). For such
single-line sections, the "value" of the section is the text following the colon
on the same line.

The bolded sections, namely exolve-width, exolve-height, exolve-grid,
exolve-across, and exolve-down, are required. The other sections are optional,
but exolve-id, exolve-title, exolve-setter should probably be present in most
puzzles.

# exolve-id
Provide a unique id. Use only alphanumeric characters and dashes (-). This
id is used as the key for saving/restoring state. You can create an unsolved
version of a puzzle (to run a contest, for example) and, later, a version of
the same puzzle that has the solutions, giving them both the same exolve-id.
Then, when solvers visit the version with solutions, they can see their own
entries and see which mistakes they made, if any. Example:
```
  exolve-id: tiny-42
```

# exolve-title, exolve-setter
The title of the puzzle and the name/pseudonym of the crossword setter. Example:
```
  exolve-title: My Lovely Crossword
  exolve-setter: Narsi Sus
```

# exolve-copyright
If your provide this, it will be displayed with the copyright symbol, to the
bottom right of the rendered puzzle grid. Example:
```
  exolve-copyright: 2019 Viresh Ratnakar
```

# exolve-width, exolve-height
The width and height of the puzzle--i.e., how many squares across and how many
squares down is the crossword grid. Example:
```
  exolve-width: 15
  exolve-height: 15
```

# exolve-prelude
Crossword puzzles often come with a prelude that contains special instructions
and/or hints. The prelude section occupies multiple lines--starting from the
line *after* the exolve-prelude: line, and going all they way down to the line
preceding the next exolve-foo section. The prelude may include html tags. The
prelude is rendered just above the grid, in the rendered puzzle. Example:
```
  exolve-prelude:
    Words should be entered in the grid <i>after</i> deleting one letter. The
    letter thus deleted, in clue order, form the name of a famous farm
    animal.
```

# exolve-grid
TODO
Special characters:
```
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
```

# exolve-across

# exolve-down

# exolve-nina

# exolve-question

# exolve-submit

# Frequently Asked Questions

**We are an established newspaper. Our readers have complained in various ways
about out online interactive crossword. Can we use your code?**

See below (same answer).

**We are a small newsletter and we occasionally feature a crossword. Our
readers have asked for an online interactive solver. Can we use your code?**

Yes. The software is free, and is released under the rather permissive MIT
License.

**Why is everything wrapped in a single exolve.html file?**

I really want to keep the released version in this state: a single,
self-contained HTML file containing all the CSS and all the Javascript it needs.
Vanilla Javascript: nothing to import, no scripts to run, absolutely zero
dependencies.

Of course, when you adopt it for your use, you might want to use all kinds of
fancy frameworks and enhancements and refactorings. But my releases will
continue to follow this simple structure.

**How should I serve the exolve.html file?**

TODO

**What is the http.sh file?**

Ignore it.

**No, really, what is the http.sh file?**

It's a silly and small bash script


TODO


