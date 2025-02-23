#!/bin/bash

awk_script='
BEGIN {
  in_grid = 0;
  in_clues = 0;
} /exolve/ {
  in_grid = 0;
  in_clues = 0;
} /exolve-grid/ {
  in_grid = 1;
  in_clues = 0;
} /exolve-across/ {
  in_grid = 0;
  in_clues = 1;
  printf "\nAcross:\n";
} /exolve-down/ {
  if (in_grid) printf "\n";
  in_grid = 0;
  in_clues = 1;
  printf "Down:\n";
} !/exolve-/ {
  if (in_grid) {
    gridline = $0;
    gsub(/ /, "", gridline);
    gsub(/\./, "=", gridline);
    printf "%s\n", gridline;
  }
  if (in_clues) {
    clue = $0;
    # Code to...
    num_matches = match(clue, /[0-9]+/);
    if (num_matches != 0) {
      num = substr(clue, RSTART, RLENGTH);
      printf "%4d. ", num;
      clue = substr(clue, RSTART + RLENGTH);
    }
    num_matches = match(clue, /) \[[A-Z]/);
    if (num_matches != 0) {
      clue = substr(clue, 1, RSTART);
    }
    gsub(/~{/, "", clue);
    gsub(/}~/, "", clue);
    gsub(/^[ ]+/, "", clue);
    gsub(/[ ]+$/, "", clue);
    printf "%s\n", clue;
  }
}'

awk "$awk_script" -



