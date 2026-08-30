import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class ApiManagerLoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(provider = env.OIDC_LOGIN_PROVIDER) {
    await this.navigateTo(`${env.API_MANAGER_BASE_URL}/login`);

    // Single-provider installs auto-redirect past /login to the provider's
    // auth page; multi-provider installs render a picker. If we're still on
    // /login after navigation settles, click the picker; otherwise the
    // redirect already happened and there's nothing to do.
    if (!new URL(this.page.url()).pathname.startsWith('/login')) return;

    await this.page.locator(`a[href="/login/${provider}"]`).click();
  }

  async selectProvider(provider = env.OIDC_LOGIN_PROVIDER) {
    const providerLink = this.page.locator(`a[href="/login/${provider}"]`);
    await providerLink.click();
  }
}
