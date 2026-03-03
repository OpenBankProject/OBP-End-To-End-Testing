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
  test('should register a new user on Portal and log in', async ({
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
      await portalLoginPage.waitForLoginPage();
      await portalLoginPage.selectProvider();
      await oidcLoginPage.waitForLoginPage();
      await oidcLoginPage.login(user.username, user.password);
    });
  });
});
