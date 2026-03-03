import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class ApiManagerLoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo(`${env.API_MANAGER_BASE_URL}/login`);
  }

  async selectProvider(provider = env.OBP_LOGIN_PROVIDER) {
    const providerLink = this.page.locator(`a[href="/login/${provider}"]`);
    await providerLink.click();
  }
}
