import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class LoginPage extends BasePage {
  private heading = this.page.locator('h1');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo(`${env.OBP_PORTAL_BASE_URL}/login`);
  }

  async waitForLoginPage() {
    await this.waitForUrlContaining('/login');
  }

  async selectProvider(provider = env.OBP_LOGIN_PROVIDER) {
    const providerLink = this.page.locator(`a[href="/login/${provider}"]`);
    await providerLink.click();
  }
}
