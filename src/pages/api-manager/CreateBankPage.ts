import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class CreateBankPage extends BasePage {
  private bankIdInput = this.page.locator('[data-testid="bank-id-input"]');
  private fullNameInput = this.page.locator('[data-testid="full-name-input"]');
  private submitButton = this.page.locator('[data-testid="submit-create-bank"]');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo(`${env.API_MANAGER_BASE_URL}/banks/create`);
  }

  async fillForm(bankId: string, fullName: string) {
    await this.bankIdInput.fill(bankId);
    await this.fullNameInput.fill(fullName);
  }

  async submit() {
    await this.submitButton.click();
  }

  async verifyRedirectToBankDetail(bankId: string) {
    await this.waitForUrlContaining(`/banks/${bankId}`);
  }

  async getErrorToastMessage(): Promise<string | null> {
    // Skeleton UI toasts render with data-scope="toast" and data-type="error"
    const errorToast = this.page.locator('[data-scope="toast"][data-type="error"]');
    await errorToast.waitFor({ state: 'visible', timeout: 10_000 });
    const description = errorToast.locator('[data-scope="toast"][data-part="description"]');
    return description.textContent();
  }
}
