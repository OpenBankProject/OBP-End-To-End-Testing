import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class ForgotPasswordPage extends BasePage {
  private usernameInput = this.page.locator('input[name="username"]');
  private emailInput = this.page.locator('input[name="email"]');
  private submitButton = this.page.locator('[data-testid="submit-forgot-password"]');
  private successMessage = this.page.locator('[data-testid="forgot-password-success"]');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo(`${env.OBP_PORTAL_BASE_URL}/forgot-password`);
  }

  async fillForm(username: string, email: string) {
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
  }

  async submit() {
    await this.submitButton.click();
  }

  async verifySuccess() {
    await this.successMessage.waitFor({ state: 'visible', timeout: 15_000 });
  }
}
