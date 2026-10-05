#!/bin/sh
# Print exact lines (1-based, inclusive) with line numbers so an editor can copy
# the text verbatim before an edit. Flags trailing whitespace, which silently
# breaks exact-match edits.
#
# Usage: scripts/peek.sh <file> <start> [end]
set -eu
file=$1
start=$2
end=${3:-$2}
awk -v s="$start" -v e="$end" '
  NR >= s && NR <= e {
    printf "%5d | %s%s\n", NR, $0, (($0 ~ /[ \t]$/) ? "   <TRAILING-WS>" : "")
  }
' "$file"
