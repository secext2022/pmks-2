#!/bin/bash

if [ $# -ne 2 ]; then
    echo "Usage: $0 input-dir output.txt"
    exit 1
fi

INPUT_DIR="$1"
OUTPUT_FILE="$2"

rm -f "$OUTPUT_FILE"

while IFS= read -r -d $'\0' file; do
    echo "> cat $file" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo >> "$OUTPUT_FILE"
done < <(find "$INPUT_DIR" -type f -print0)

echo "Done! Output written to $OUTPUT_FILE"
