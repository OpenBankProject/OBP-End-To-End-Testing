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

test.describe('Password Reset Flow', () => {
  test('should register, validate, then reset password via email and log in with new password', async ({
    registerPage,
    emailValidationPage,
    forgotPasswordPage,
    resetPasswordPage,
    oidcLoginPage,
    mailpit,
    page,
  }) => {
    const user = generateUniqueUser();
    const newPassword = 'NewSecurePass@789!';

    await test.step('Clear Mailpit inbox', async () => {
      await mailpit.deleteAllMessages();
    });

    await test.step('Register and validate a new user', async () => {
      await registerPage.goto();
      await registerPage.fillRegistrationForm(user);
      await registerPage.acceptLegalDocuments();
      await registerPage.submit();
      await registerPage.verifySuccess();

      const validationEmail = await mailpit.waitForMessage(`to:${user.email}`);
      const validationToken = mailpit.extractValidationToken(validationEmail.HTML || validationEmail.Text);
      await emailValidationPage.validateToken(validationToken);
      await emailValidationPage.verifySuccess();
    });

    await test.step('Clear Mailpit and request password reset', async () => {
      await mailpit.deleteAllMessages();
      await forgotPasswordPage.goto();
      await forgotPasswordPage.fillForm(user.username, user.email);
      await forgotPasswordPage.submit();
      await forgotPasswordPage.verifySuccess();
    });

    await test.step('Retrieve reset email and reset password', async () => {
      const resetEmail = await mailpit.waitForMessage(`to:${user.email}`);
      expect(resetEmail.Subject).toContain('Reset your password');
      const resetToken = mailpit.extractResetPasswordToken(resetEmail.HTML || resetEmail.Text);
      await resetPasswordPage.gotoWithToken(resetToken);
      await resetPasswordPage.fillNewPassword(newPassword);
      await resetPasswordPage.submit();
      await resetPasswordPage.verifyRedirectToLogin();
    });

    await test.step('Log in with new password', async () => {
      // After reset, Portal redirects to /login which auto-redirects to OIDC
      await oidcLoginPage.login(user.username, newPassword);
    });
  });

  test('should fail to log in with old password after reset', async ({
    registerPage,
    emailValidationPage,
    forgotPasswordPage,
    resetPasswordPage,
    portalLoginPage,
    oidcLoginPage,
    mailpit,
    page,
  }) => {
    const user = generateUniqueUser();
    const newPassword = 'ChangedPassword@456!';

    await test.step('Clear Mailpit inbox', async () => {
      await mailpit.deleteAllMessages();
    });

    await test.step('Register and validate a new user', async () => {
      await registerPage.goto();
      await registerPage.fillRegistrationForm(user);
      await registerPage.acceptLegalDocuments();
      await registerPage.submit();
      await registerPage.verifySuccess();

      const validationEmail = await mailpit.waitForMessage(`to:${user.email}`);
      const validationToken = mailpit.extractValidationToken(validationEmail.HTML || validationEmail.Text);
      await emailValidationPage.validateToken(validationToken);
      await emailValidationPage.verifySuccess();
    });

    await test.step('Reset password', async () => {
      await mailpit.deleteAllMessages();
      await forgotPasswordPage.goto();
      await forgotPasswordPage.fillForm(user.username, user.email);
      await forgotPasswordPage.submit();
      await forgotPasswordPage.verifySuccess();

      const resetEmail = await mailpit.waitForMessage(`to:${user.email}`);
      const resetToken = mailpit.extractResetPasswordToken(resetEmail.HTML || resetEmail.Text);
      await resetPasswordPage.gotoWithToken(resetToken);
      await resetPasswordPage.fillNewPassword(newPassword);
      await resetPasswordPage.submit();
      await resetPasswordPage.verifyRedirectToLogin();
    });

    await test.step('Attempt login with old password (should fail)', async () => {
      await portalLoginPage.goto();
      await oidcLoginPage.waitForLoginPage();
      await oidcLoginPage.login(user.username, user.password);
      const hasError = await oidcLoginPage.hasError();
      expect(hasError).toBe(true);
    });
  });
});
