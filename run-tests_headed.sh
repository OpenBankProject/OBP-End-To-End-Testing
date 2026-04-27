#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default slowMo so actions are visible; override with PW_SLOW_MO=NN ./run-tests_headed.sh
export PW_SLOW_MO="${PW_SLOW_MO:-500}"

exec "$SCRIPT_DIR/run-tests.sh" --headed "$@"
