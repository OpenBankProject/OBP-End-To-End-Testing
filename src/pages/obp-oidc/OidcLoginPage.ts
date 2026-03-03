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
    provider = env.OBP_LOGIN_PROVIDER,
  ) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);

    // Provider may be a <select> or a hidden input depending on config
    // Provider may be a <select>, a hidden input, or already set by the redirect
    const selectVisible = await this.providerSelect.isVisible();
    if (selectVisible) {
      const options = await this.providerSelect.locator('option').allTextContents();
      const hasProvider = options.some(opt => opt.trim() === provider);
      if (hasProvider) {
        await this.providerSelect.selectOption({ label: provider });
      }
      // If provider not in options, it may already be pre-selected by the redirect
    }

    await this.signInButton.click();
  }

  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  async getErrorText(): Promise<string> {
    return this.errorMessage.textContent() ?? '';
  }
}
