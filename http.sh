#!/usr/bin/env bash
# Usage http [.exolve file]

port="80"

output=""
while read -r line; do
  if [ "$line" = "exolve-begin" ] && [ $# -gt 0 ]
  then
    while [ "$line" != "exolve-end" ]
    do
      read -r line;
    done
    echo "Using puzzle $1"
    line=`cat $1`
  fi
  line=`echo "$line" | sed 's/\\\/\\\\\\\\/g'`
  output="$output$line\n"
done < exolve.html

echo $output > /tmp/foo

RESPONSE="HTTP/1.1 200 OK\r\nConnection: keep-alive\r\n\r\n${output}\r\n"
while { echo -en "$RESPONSE"; } | nc -l 80; do
  echo "================================================"
done
