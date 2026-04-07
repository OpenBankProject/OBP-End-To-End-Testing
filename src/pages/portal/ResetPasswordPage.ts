import { type Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class ResetPasswordPage extends BasePage {
  private newPasswordInput = this.page.locator('input[name="new_password"]');
  private confirmPasswordInput = this.page.locator('input[name="confirm_password"]');
  private submitButton = this.page.locator('[data-testid="submit-reset-password"]');

  constructor(page: Page) {
    super(page);
  }

  async gotoWithToken(token: string) {
    const encodedToken = encodeURIComponent(token);
    await this.navigateTo(`${env.OBP_PORTAL_BASE_URL}/reset-password/${encodedToken}`);
  }

  async fillNewPassword(password: string) {
    await this.newPasswordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async verifyRedirectToLogin() {
    // Portal redirects to /login?reset=success, which then auto-redirects to OBP-OIDC
    // Wait for either the Portal login page or the OIDC sign-in page
    await this.page.waitForURL(
      (url) => url.pathname.includes('/login') || url.pathname.includes('/auth'),
      { timeout: 30_000 },
    );
  }
}
