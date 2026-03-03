# OBP End-To-End Testing

Playwright E2E tests for OBP VRP (Variable Recurring Payment) consent flows across Hola, OBP-OIDC, and OBP-Portal.

## Prerequisites

- Node.js 18+
- Running instances of: Hola, OBP-API, OBP-OIDC, OBP-Portal

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

| Variable | Default |
|---|---|
| `HOLA_BASE_URL` | `http://localhost:8087` |
| `OBP_PORTAL_BASE_URL` | `http://localhost:5174` |
| `VRP_CURRENCY` | `EUR` |
| `VRP_MAX_SINGLE_AMOUNT` | `100` |
| `VRP_MAX_MONTHLY_AMOUNT` | `1000` |
| `VRP_MAX_MONTHLY_FREQUENCY` | `10` |
| `VRP_MAX_YEARLY_AMOUNT` | `10000` |
| `VRP_MAX_YEARLY_FREQUENCY` | `100` |
| `TEST_OTP_VALUE` | `123456` |

## Running tests

```bash
# Run all tests
npx playwright test

# Run VRP consent flow tests
npx playwright test tests/vrp/

# Run headed (watch the browser)
npx playwright test tests/vrp/ --headed

# Run in debug mode (step through)
npx playwright test tests/vrp/ --debug

# View HTML report
npx playwright show-report
```

## Project structure

```
src/
  config/env.ts          - Environment variable loader
  pages/
    BasePage.ts          - Shared base page class
    hola/                - Hola app page objects
    obp-oidc/            - OBP-OIDC login page object
    portal/              - OBP-Portal page objects
  fixtures/
    test-fixtures.ts     - Custom Playwright fixtures
tests/
  vrp/
    vrp-consent-flow.spec.ts  - VRP consent creation test
```

## Test flow

1. Navigate to Hola VRP form (`/index_obp_vrp`)
2. Fill form with test data and submit
3. Authenticate on OBP-OIDC (`/obp-oidc/auth`)
4. Confirm consent on OBP-Portal (`/confirm-vrp-consent-request`)
5. Enter OTP on OBP-Portal (`/confirm-vrp-consent`)
6. Verify redirect back to Hola with `status=ACCEPTED`
