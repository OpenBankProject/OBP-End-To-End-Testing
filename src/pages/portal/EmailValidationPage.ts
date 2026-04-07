import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class EmailValidationPage extends BasePage {
  private successContainer = this.page.locator('[data-testid="validation-success"]');
  private goToLoginLink = this.page.locator('[data-testid="go-to-login"]');
  private errorContainer = this.page.locator('[data-testid="validation-error"]');

  constructor(page: Page) {
    super(page);
  }

  async validateToken(token: string) {
    await this.navigateTo(
      `${env.OBP_PORTAL_BASE_URL}/user-validation?token=${encodeURIComponent(token)}`,
    );
  }

  async verifySuccess() {
    await this.successContainer.waitFor({ state: 'visible', timeout: 30_000 });
  }

  async goToLogin() {
    await this.goToLoginLink.click();
  }

  async hasError(): Promise<boolean> {
    return this.errorContainer.isVisible();
  }
}
