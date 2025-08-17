#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
export PYTHONPATH="$DIR/backend:$PYTHONPATH"
"$DIR/venv/bin/python" "$DIR/backend/main.py" "$@"
