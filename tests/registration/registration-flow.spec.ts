import { test, expect } from '../../src/fixtures/test-fixtures.js';

function generateUniqueUser() {
  const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
  return {
    firstName: 'Test',
    lastName: 'User',
    email: `testuser_${suffix}@example.com`,
    username: `testuser_${suffix}`,
    password: 'Test@12345!secure',
  };
}

test.describe('Registration and Login Flow', () => {
  test('should register, validate email via Mailpit, and log in', async ({
    registerPage,
    emailValidationPage,
    portalLoginPage,
    oidcLoginPage,
    mailpit,
    page,
  }) => {
    const user = generateUniqueUser();

    await test.step('Clear Mailpit inbox', async () => {
      await mailpit.deleteAllMessages();
    });

    await test.step('Register a new user on OBP Portal', async () => {
      await registerPage.goto();
      await registerPage.fillRegistrationForm(user);
      await registerPage.acceptLegalDocuments();
      await registerPage.submit();
      await registerPage.verifySuccess();
    });

    await test.step('Retrieve validation email from Mailpit and validate', async () => {
      const message = await mailpit.waitForMessage(`to:${user.email}`);
      const token = mailpit.extractValidationToken(message.HTML || message.Text);
      await emailValidationPage.validateToken(token);
      await emailValidationPage.verifySuccess();
    });

    await test.step('Log in on OBP Portal with validated credentials', async () => {
      await emailValidationPage.goToLogin();
      // Portal auto-redirects to OBP-OIDC login page (single provider)
      await oidcLoginPage.waitForLoginPage();
      await oidcLoginPage.login(user.username, user.password);
    });
  });

  test('should register a new user on Portal and log in (skip validation)', async ({
    registerPage,
    portalLoginPage,
    oidcLoginPage,
    page,
  }) => {
    const user = generateUniqueUser();

    await test.step('Register a new user on OBP Portal', async () => {
      await registerPage.goto();
      await registerPage.fillRegistrationForm(user);
      await registerPage.acceptLegalDocuments();
      await registerPage.submit();
      await registerPage.verifySuccess();
    });

    await test.step('Log in on OBP Portal with new credentials', async () => {
      await portalLoginPage.goto();
      // Portal auto-redirects to OBP-OIDC login page (single provider)
      await oidcLoginPage.waitForLoginPage();
      await oidcLoginPage.login(user.username, user.password);
    });
  });

  test('should fail to log in with wrong password', async ({
    registerPage,
    portalLoginPage,
    oidcLoginPage,
  }) => {
    const user = generateUniqueUser();

    await test.step('Register a new user on OBP Portal', async () => {
      await registerPage.goto();
      await registerPage.fillRegistrationForm(user);
      await registerPage.acceptLegalDocuments();
      await registerPage.submit();
      await registerPage.verifySuccess();
    });

    await test.step('Attempt login with wrong password', async () => {
      await portalLoginPage.goto();
      await oidcLoginPage.waitForLoginPage();
      await oidcLoginPage.login(user.username, 'WrongPassword!999');

      const hasError = await oidcLoginPage.hasError();
      expect(hasError).toBe(true);
    });
  });
});
