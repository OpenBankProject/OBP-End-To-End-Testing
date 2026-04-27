#!/usr/bin/env bash
set -e

# Runs tests that require POWERFUL_USER_1_USERNAME / POWERFUL_USER_1_PASSWORD
# (a user with entitlements to create banks and grant entitlements to others).

# Start Mailpit if not already running (needed by create-bank-new-user-flow)
if docker ps --format '{{.Names}}' | grep -q '^mailpit$'; then
  echo "Mailpit is already running"
else
  echo "Starting Mailpit..."
  docker rm -f mailpit 2>/dev/null || true
  docker run -d --name mailpit -p 1025:1025 -p 8025:8025 \
    -e MP_SMTP_AUTH_ACCEPT_ANY=1 -e MP_SMTP_AUTH_ALLOW_INSECURE=1 \
    axllent/mailpit

  echo -n "Waiting for Mailpit API"
  for i in $(seq 1 30); do
    if curl -s http://localhost:8025/api/v1/messages >/dev/null 2>&1; then
      echo " ready"
      break
    fi
    echo -n "."
    sleep 1
  done
fi

# Default slowMo so headed actions are visible; override with PW_SLOW_MO=NN ./run-powerful-user-1-tests.sh
export PW_SLOW_MO="${PW_SLOW_MO:-500}"

echo "Running tests that require POWERFUL_USER_1 credentials (create-bank + entitlement-granting)..."
npx playwright test \
  tests/create-bank/ \
  tests/entitlement-granting/ \
  --headed \
  "$@"
