import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo(`${env.API_MANAGER_BASE_URL}/user`);
  }

  async waitForPage() {
    await this.waitForUrlContaining('/user');
  }

  /** Check that the expected username appears on the page. */
  async hasUsername(username: string): Promise<boolean> {
    const locator = this.page.locator(`text=${username}`);
    return locator.isVisible();
  }

  /** Wait for the username text to be visible on the page. */
  async waitForUsername(username: string) {
    await this.page.locator(`text=${username}`).waitFor({ state: 'visible', timeout: 30_000 });
  }

  /**
   * Extract the user_id displayed on the page.
   * Looks for a UUID-format string (standard OBP user ID pattern).
   */
  async getUserId(): Promise<string | null> {
    const body = await this.page.locator('body').textContent();
    if (!body) return null;
    const match = body.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    return match ? match[0] : null;
  }
}
