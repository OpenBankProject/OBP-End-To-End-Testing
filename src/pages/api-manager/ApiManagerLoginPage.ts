import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class ApiManagerLoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(provider = env.OIDC_LOGIN_PROVIDER) {
    await this.navigateTo(`${env.API_MANAGER_BASE_URL}/login`);

    // If only one provider is configured, API Manager auto-redirects (server-
    // or client-side) to the provider's auth page — no picker is shown. Race
    // the picker link against navigation away from /login: whichever happens
    // first wins.
    const providerLink = this.page.locator(`a[href="/login/${provider}"]`);
    const navigatedAway = this.page
      .waitForURL(url => !url.pathname.includes('/login'), { timeout: 5_000 })
      .then(() => 'navigated' as const)
      .catch(() => null);
    const linkAppeared = providerLink
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => 'picker' as const)
      .catch(() => null);

    const winner = await Promise.race([navigatedAway, linkAppeared]);
    if (winner === 'picker') {
      await providerLink.click();
    }
    // If neither resolved, fall through — caller will likely fail at the next
    // step with a clearer error than a silent hang here.
  }

  async selectProvider(provider = env.OIDC_LOGIN_PROVIDER) {
    const providerLink = this.page.locator(`a[href="/login/${provider}"]`);
    await providerLink.click();
  }
}
