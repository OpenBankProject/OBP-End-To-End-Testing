import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env, idp } from '../../config/env.js';

/** Cohort's home page: the open calls, and the way in to the identity provider. */
export class CohortHomePage extends BasePage {
  private loginLink = this.page.locator('[data-testid="login"]');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto(`${env.COHORT_BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30_000 });
  }

  /** The text of the page, whitespace collapsed. */
  async text(): Promise<string> {
    return ((await this.page.locator('body').innerText()) || '').replace(/\s+/g, ' ');
  }

  /**
   * Click Log in and wait for the identity provider's login page. Cohort's link is followed client-side to /login,
   * which now and then stays there; going straight to /login/<provider> then reaches the IdP.
   */
  async openIdentityProvider() {
    await this.loginLink.click();
    const reached = await this.page.waitForURL(idp.loginPage, { timeout: 5_000 }).then(() => true, () => false);
    if (!reached) {
      await this.page.goto(`${env.COHORT_BASE_URL}/login/${env.OIDC_LOGIN_PROVIDER}`, { waitUntil: 'domcontentloaded' });
      await this.page.waitForURL(idp.loginPage, { timeout: 10_000 });
    }
  }
}
