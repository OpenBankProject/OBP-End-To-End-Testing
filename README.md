# OBP End-To-End Testing

Playwright E2E tests for OBP flows across Hola, OBP-API, OBP-OIDC, OBP-Portal, and API Manager.

## Prerequisites

- Node.js 18+
- Docker (for Mailpit)
- Running instances of: Hola, OBP-API, OBP-OIDC, OBP-Portal, API Manager

## Setup

```bash
npm install
npx playwright install chromium
```

## Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Required environment variables

| Variable | Description |
|---|---|
| `OBP_LOGIN_PROVIDER` | Provider name for OBP-OIDC login (e.g. `OBP-API`) |
| `OBP_LOGIN_USERNAME` | Username for OBP-OIDC authentication |
| `OBP_LOGIN_PASSWORD` | Password for OBP-OIDC authentication |
| `VRP_FROM_BANK_ROUTING_ADDRESS` | From bank routing address for VRP form |
| `VRP_FROM_ROUTING_ADDRESS` | From account routing address |
| `VRP_TO_ROUTING_ADDRESS` | To account routing address |

### Optional environment variables (with defaults)

| Variable | Default | Description |
|---|---|---|
| `HOLA_BASE_URL` | `http://localhost:8087` | |
| `OBP_PORTAL_BASE_URL` | `http://localhost:5174` | |
| `API_MANAGER_BASE_URL` | `http://localhost:3003` | |
| `MAILPIT_API_URL` | `http://localhost:8025` | Mailpit REST API for email validation tests |
| `VRP_CURRENCY` | `EUR` | |
| `VRP_MAX_SINGLE_AMOUNT` | `100` | |
| `VRP_MAX_MONTHLY_AMOUNT` | `1000` | |
| `VRP_MAX_MONTHLY_FREQUENCY` | `10` | |
| `VRP_MAX_YEARLY_AMOUNT` | `10000` | |
| `VRP_MAX_YEARLY_FREQUENCY` | `100` | |
| `TEST_OTP_VALUE` | `123456` | |

## Mailpit (email testing)

The registration email validation test requires [Mailpit](https://github.com/axllent/mailpit), a lightweight SMTP test server. Start it with Docker:

```bash
docker run -d --name mailpit -p 1025:1025 -p 8025:8025 \
  -e MP_SMTP_AUTH_ACCEPT_ANY=1 -e MP_SMTP_AUTH_ALLOW_INSECURE=1 \
  axllent/mailpit
```

Or if you have Docker Compose v2:

```bash
docker compose up -d
```

Mailpit provides a web UI at http://localhost:8025 where you can inspect captured emails.

### OBP-API configuration for email validation tests

The following properties must be set in OBP-API's `default.props`:

```properties
authUser.skipEmailValidation=false
mail.test.mode=false
mail.smtp.host=localhost
mail.smtp.port=1025
portal_external_url=http://localhost:5174
```

When `authUser.skipEmailValidation=true` (the default), the "skip validation" and "wrong password" registration tests still work without Mailpit.

## Running tests

```bash
# Run all tests
npm test

# Run all authentication tests (registration + password reset, via OBP-OIDC)
npm run test:obp-oidc

# Run registration tests only (login via OBP-OIDC)
npm run test:registration-obp-oidc

# Run password reset tests only (login via OBP-OIDC)
npm run test:password-reset-obp-oidc

# Or use the shell script (starts Mailpit automatically)
./run-authentication-tests.sh

# Run VRP consent flow tests
npm run test:vrp

# Run headed (watch the browser)
npm run test:headed

# Run in debug mode (step through)
npm run test:debug

# View HTML report
npm run report
```

## Project structure

```
src/
  config/env.ts          - Environment variable loader
  helpers/
    MailpitClient.ts     - Mailpit REST API client for email retrieval
  pages/
    BasePage.ts          - Shared base page class
    hola/                - Hola app page objects
    obp-oidc/            - OBP-OIDC login page object
    portal/              - OBP-Portal page objects (register, login, email validation)
    api-manager/         - API Manager page objects
  fixtures/
    test-fixtures.ts     - Custom Playwright fixtures
tests/
  registration-obp-oidc/    - Registration, email validation, and login via OBP-OIDC
  password-reset-obp-oidc/  - Password reset via email, login via OBP-OIDC
  entitlement-granting/     - Super admin entitlement granting tests
  vrp/                      - VRP consent creation tests
```

## Test flows

### Registration and email validation (login via OBP-OIDC)

1. Register a new user on OBP-Portal
2. Retrieve the validation email from Mailpit
3. Extract the JWT validation token from the email
4. Navigate to the Portal validation page with the token
5. Verify validation succeeds, then log in via OBP-OIDC

### Password reset (login via OBP-OIDC)

1. Register and validate a new user (via Mailpit)
2. Navigate to `/forgot-password`, enter username and email
3. Retrieve the reset email from Mailpit
4. Extract the JWT reset token from the email link
5. Navigate to `/reset-password/[token]`, enter new password
6. Verify redirect to login, then log in with new password
7. Verify old password no longer works

### VRP consent

1. Navigate to Hola VRP form (`/index_obp_vrp`)
2. Fill form with test data and submit
3. Authenticate on OBP-OIDC (`/obp-oidc/auth`)
4. Confirm consent on OBP-Portal (`/confirm-vrp-consent-request`)
5. Enter OTP on OBP-Portal (`/confirm-vrp-consent`)
6. Verify redirect back to Hola with `status=ACCEPTED`

### Entitlement granting

1. Register User B on Portal, log in to API Manager, capture user_id
2. Verify User B lacks CanReadMetrics entitlement
3. Super admin (User A) grants CanReadMetrics to User B
4. Verify User B can now access the metrics page
