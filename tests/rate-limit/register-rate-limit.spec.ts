import { test, expect } from '../../src/fixtures/test-fixtures.js';

/**
 * Probes the Portal's per-IP rate limit on POST /register by submitting
 * registrations back-to-back until the limiter responds.
 *
 * Portal default: RATE_LIMIT_REGISTER=20/15m (see OBP-Frontend
 * apps/portal/src/hooks.server.ts). Every POST counts, successful or not.
 *
 * Run WITHOUT the bypass header, otherwise the limiter is skipped:
 *   RATE_LIMIT_BYPASS_TOKEN= npx playwright test tests/rate-limit/
 */

const MAX_ATTEMPTS = Number(process.env.RATE_LIMIT_PROBE_MAX_ATTEMPTS) || 30;
const RATE_LIMIT_TEXT = 'Too many attempts from your network address';

function generateUniqueUser(i: number) {
  const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  return {
    firstName: 'Rate',
    lastName: `Limit${i}`,
    email: `ratelimit_${suffix}@example.com`,
    username: `ratelimit_${suffix}`,
    password: 'Test@12345!secure',
  };
}

test.describe('Portal /register rate limiting', () => {
  test.skip(
    !!process.env.RATE_LIMIT_BYPASS_TOKEN,
    'RATE_LIMIT_BYPASS_TOKEN is set — the Portal would skip its limiter. Run with RATE_LIMIT_BYPASS_TOKEN= (empty).',
  );

  test('registers repeatedly until the limiter responds', async ({ registerPage, page }) => {
    test.setTimeout(15 * 60_000);

    const errorBox = page.locator('[data-testid="registration-error"]');
    const started = Date.now();
    let limitedAt: number | null = null;
    let limitMessage = '';

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      const user = generateUniqueUser(i);
      const t0 = Date.now();

      await registerPage.goto();
      await registerPage.fillRegistrationForm(user);
      await registerPage.acceptLegalDocuments();
      await registerPage.submit();

      const outcome = await Promise.race([
        page.waitForURL('**/register/success*', { timeout: 15_000 }).then(() => 'success' as const),
        errorBox.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'error' as const),
      ]).catch(() => 'timeout' as const);

      const elapsed = ((Date.now() - started) / 1000).toFixed(1);
      const took = Date.now() - t0;

      if (outcome === 'error') {
        const text = (await errorBox.textContent())?.trim() ?? '';
        const isRateLimit = text.includes(RATE_LIMIT_TEXT);
        console.log(`#${String(i).padStart(2)}  t+${elapsed}s  ${took}ms  ${isRateLimit ? 'RATE LIMITED' : 'ERROR'}: ${text}`);
        if (isRateLimit) {
          limitedAt = i;
          limitMessage = text;
          break;
        }
      } else {
        console.log(`#${String(i).padStart(2)}  t+${elapsed}s  ${took}ms  ${outcome === 'success' ? 'registered' : 'TIMEOUT'}  ${user.username}`);
      }
    }

    console.log(
      limitedAt
        ? `\nRate limit kicked in on attempt #${limitedAt} (${((Date.now() - started) / 1000).toFixed(1)}s after start).\nMessage: ${limitMessage}`
        : `\nNo rate limit after ${MAX_ATTEMPTS} attempts.`,
    );

    expect(limitedAt, `expected the limiter to trigger within ${MAX_ATTEMPTS} attempts`).not.toBeNull();
  });
});
