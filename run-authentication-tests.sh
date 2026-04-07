#!/usr/bin/env bash
set -e

# Start Mailpit if not already running
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

echo "Running authentication tests (registration + password reset via OBP-OIDC)..."
npx playwright test tests/registration-obp-oidc/ tests/password-reset-obp-oidc/ "$@"
