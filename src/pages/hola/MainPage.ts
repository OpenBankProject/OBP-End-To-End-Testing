import { type Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class MainPage extends BasePage {
  private getAccountsButton = this.page.locator('#get_accounts_obp');
  private consentInfoButton = this.page.locator('#consent_info_obp');
  private revokeConsentButton = this.page.locator('#revoke_consent_obp');

  constructor(page: Page) {
    super(page);
  }

  async waitForMainPage() {
    await this.waitForUrlContaining('/main');
  }

  async verifyConsentAccepted() {
    const url = new URL(this.page.url());
    const status = url.searchParams.get('status');
    expect(status).toBe('ACCEPTED');
  }

  async verifyConsentRequestIdPresent() {
    const url = new URL(this.page.url());
    const consentRequestId = url.searchParams.get('CONSENT_REQUEST_ID');
    expect(consentRequestId).toBeTruthy();
    return consentRequestId;
  }

  async isGetAccountsVisible(): Promise<boolean> {
    return this.getAccountsButton.isVisible();
  }
}
