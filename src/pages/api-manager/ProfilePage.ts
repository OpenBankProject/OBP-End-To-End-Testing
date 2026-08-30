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

  /**
   * The username as rendered on the page. Exact match, so an email such as
   * `<username>@example.com` doesn't count; `.first()` because the header's
   * user menu and the User Information section both legitimately show it.
   */
  private usernameText(username: string) {
    return this.page.getByText(username, { exact: true }).first();
  }

  /** Check that the expected username appears on the page. */
  async hasUsername(username: string): Promise<boolean> {
    return this.usernameText(username).isVisible();
  }

  /** Wait for the username text to be visible on the page. */
  async waitForUsername(username: string) {
    await this.usernameText(username).waitFor({ state: 'visible', timeout: 30_000 });
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
