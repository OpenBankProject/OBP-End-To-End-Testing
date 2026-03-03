import { type Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

export class ConfirmVrpConsentRequestPage extends BasePage {
  private heading = this.page.locator('h1');
  private confirmButton = this.page.locator('button', { hasText: 'Confirm Consent' });
  private consentRequestIdInput = this.page.locator('input[name="consentRequestId"]');
  private errorContainer = this.page.locator('.bg-error-500\\/10');

  constructor(page: Page) {
    super(page);
  }

  async waitForPage() {
    await this.waitForUrlContaining('/confirm-vrp-consent-request');
  }

  async verifyPageLoaded() {
    await expect(this.heading).toContainText('Confirm VRP Consent Request');
  }

  async hasError(): Promise<boolean> {
    return this.errorContainer.isVisible();
  }

  async confirmConsent() {
    await this.confirmButton.click();
  }

  async getConsentRequestId(): Promise<string | null> {
    return this.consentRequestIdInput.getAttribute('value');
  }
}
