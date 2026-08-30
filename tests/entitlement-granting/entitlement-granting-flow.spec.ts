import { test, expect } from '../../src/fixtures/test-fixtures.js';
import { env } from '../../src/config/env.js';
import { OidcLoginPage } from '../../src/pages/obp-oidc/OidcLoginPage.js';
import { ApiManagerLoginPage } from '../../src/pages/api-manager/ApiManagerLoginPage.js';
import { CreateEntitlementPage } from '../../src/pages/api-manager/CreateEntitlementPage.js';
import { MetricsPage } from '../../src/pages/api-manager/MetricsPage.js';
import { ProfilePage } from '../../src/pages/api-manager/ProfilePage.js';

function generateUniqueUser() {
  const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
  return {
    firstName: 'Test',
    lastName: 'Entitlement',
    email: `testentitlement_${suffix}@example.com`,
    username: `testentitlement_${suffix}`,
    password: 'Test@12345!secure',
  };
}

test.describe('Entitlement Granting Flow', () => {
  test('Powerful User 1 grants CanReadMetrics to User B', async ({
    registerPage,
    emailValidationPage,
    mailpit,
    browser,
  }) => {
    const userB = generateUniqueUser();
    let userBId: string | null = null;

    // ── Step 1: Register User B on Portal ──────────────────────────
    await test.step('Register User B on OBP Portal and validate email', async () => {
      await mailpit.deleteAllMessages();
      await registerPage.goto();
      await registerPage.fillRegistrationForm(userB);
      await registerPage.acceptLegalDocuments();
      await registerPage.submit();
      await registerPage.verifySuccess();

      // OBP-OIDC only authenticates validated users
      const message = await mailpit.waitForMessage(`to:${userB.email}`);
      const token = mailpit.extractValidationToken(message.HTML || message.Text);
      await emailValidationPage.validateToken(token);
      await emailValidationPage.verifySuccess();
    });

    // ── Step 2: Log in as User B on API Manager → capture user_id ──
    let userBContext = await browser.newContext();
    let userBPage = await userBContext.newPage();

    await test.step('Log in as User B on API Manager and capture user_id', async () => {
      const apiManagerLogin = new ApiManagerLoginPage(userBPage);
      const oidcLogin = new OidcLoginPage(userBPage);
      const profilePage = new ProfilePage(userBPage);

      await apiManagerLogin.goto();
      await oidcLogin.waitForLoginPage();
      await oidcLogin.login(userB.username, userB.password, env.REGISTERED_USER_CREDENTIALS_PROVIDER);

      // Navigate to profile to capture user_id
      await profilePage.goto();
      await profilePage.waitForPage();
      await profilePage.waitForUsername(userB.username);
      userBId = await profilePage.getUserId();
      expect(userBId).toBeTruthy();
    });

    // ── Step 3: Verify User B currently lacks CanReadMetrics ───────
    await test.step('Verify User B cannot access metrics (missing role)', async () => {
      const metricsPage = new MetricsPage(userBPage);
      await metricsPage.goto();
      await metricsPage.waitForPage();
      const hasMissingRole = await metricsPage.hasMissingRoleWidget();
      expect(hasMissingRole).toBe(true);
    });

    // ── Step 4: Log in as Powerful User 1 in separate context ─────
    const userAContext = await browser.newContext();
    const userAPage = await userAContext.newPage();

    await test.step('Log in as Powerful User 1 on API Manager', async () => {
      const apiManagerLogin = new ApiManagerLoginPage(userAPage);
      const oidcLogin = new OidcLoginPage(userAPage);

      await apiManagerLogin.goto();
      await oidcLogin.waitForLoginPage();
      await oidcLogin.login(
        env.POWERFUL_USER_1_USERNAME,
        env.POWERFUL_USER_1_PASSWORD,
        env.POWERFUL_USER_1_CREDENTIALS_PROVIDER,
      );
    });

    // ── Step 5: User A grants CanReadMetrics to User B ─────────────
    await test.step('Navigate to create entitlement page and grant CanReadMetrics', async () => {
      const createEntitlementPage = new CreateEntitlementPage(userAPage);

      await createEntitlementPage.goto();
      await createEntitlementPage.searchAndSelectUser(userB.username);

      const isSelected = await createEntitlementPage.isUserSelected();
      expect(isSelected).toBe(true);

      await createEntitlementPage.searchAndSelectRole('CanReadMetrics');
      await createEntitlementPage.submit();
      await createEntitlementPage.verifySuccess();
    });

    // ── Step 6: User B verifies metrics page access ────────────────
    // API Manager keeps the user's entitlements as a login-time snapshot in
    // the session and only refreshes it once it is older than 4 minutes, so
    // User B logs in afresh to pick up the newly granted role.
    await userBContext.close();
    userBContext = await browser.newContext();
    userBPage = await userBContext.newPage();

    await test.step('User B logs in again to pick up the new entitlement', async () => {
      const apiManagerLogin = new ApiManagerLoginPage(userBPage);
      const oidcLogin = new OidcLoginPage(userBPage);

      await apiManagerLogin.goto();
      await oidcLogin.waitForLoginPage();
      await oidcLogin.login(userB.username, userB.password, env.REGISTERED_USER_CREDENTIALS_PROVIDER);
    });

    await test.step('Verify User B can now access metrics page', async () => {
      const metricsPage = new MetricsPage(userBPage);
      await metricsPage.goto();
      await metricsPage.waitForPage();
      await metricsPage.verifyPageLoaded();

      const hasMissingRole = await metricsPage.hasMissingRoleWidget();
      expect(hasMissingRole).toBe(false);
    });

    // ── Cleanup: close browser contexts ────────────────────────────
    await userAContext.close();
    await userBContext.close();
  });
});
