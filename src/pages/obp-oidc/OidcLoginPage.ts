import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class OidcLoginPage extends BasePage {
  private usernameInput = this.page.locator('#username');
  private passwordInput = this.page.locator('#password');
  private providerSelect = this.page.locator('#provider');
  private providerHidden = this.page.locator('input[name="provider"][type="hidden"]');
  private signInButton = this.page.locator('button[type="submit"]');
  private errorMessage = this.page.locator('.error');

  constructor(page: Page) {
    super(page);
  }

  async waitForLoginPage() {
    await this.waitForUrlContaining('/obp-oidc/auth');
  }

  async login(
    username = env.OBP_LOGIN_USERNAME,
    password = env.OBP_LOGIN_PASSWORD,
    credentialsProvider = env.OIDC_LOGIN_PROVIDER,
  ) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);

    // The credentials-provider dropdown identifies WHERE this user's credentials
    // are stored (e.g. an OBP-API host URL). Labels are typically full URLs, so we
    // match `credentialsProvider` as a case-insensitive substring of the label.
    const selectVisible = await this.providerSelect.isVisible();
    if (selectVisible) {
      const options = (await this.providerSelect.locator('option').allTextContents()).map(o => o.trim());
      const needle = credentialsProvider.toLowerCase();
      const matches = options.filter(opt => opt.toLowerCase().includes(needle));
      if (matches.length === 1) {
        await this.providerSelect.selectOption({ label: matches[0] });
      } else if (matches.length > 1) {
        throw new Error(
          `Credentials provider "${credentialsProvider}" matches multiple options: ${matches.join(', ')}. ` +
          `Set <USER>_CREDENTIALS_PROVIDER to a more specific value.`,
        );
      } else {
        throw new Error(
          `Credentials provider "${credentialsProvider}" not found in options: ${options.join(', ')}. ` +
          `Set <USER>_CREDENTIALS_PROVIDER to match (substring of) one of these.`,
        );
      }
    }

    await Promise.all([
      this.page.waitForURL(url => !url.pathname.includes('/obp-oidc/auth'), { timeout: 5_000 }),
      this.signInButton.click(),
    ]);
  }

  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  async getErrorText(): Promise<string> {
    return this.errorMessage.textContent() ?? '';
  }
}
