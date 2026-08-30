import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class RegisterPage extends BasePage {
  private firstNameInput = this.page.locator('input[name="first_name"]');
  private lastNameInput = this.page.locator('input[name="last_name"]');
  private emailInput = this.page.locator('input[name="email"]');
  private usernameInput = this.page.locator('input[name="username"]');
  private mobilePhoneNumberInput = this.page.locator('input[name="mobile_phone_number"]');
  private passwordInput = this.page.locator('input[name="password"]');
  private repeatPasswordInput = this.page.locator('input[name="repeat_password"]');
  private submitButton = this.page.locator('[data-testid="submit-registration"]');
  private errorMessage = this.page.locator('[data-testid="registration-error"]');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo(`${env.OBP_PORTAL_BASE_URL}/register`);
  }

  async fillRegistrationForm(user: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    /** Optional (v7.0.0 Create User); left untouched when omitted */
    mobilePhoneNumber?: string;
  }) {
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.emailInput.fill(user.email);
    await this.usernameInput.fill(user.username);
    if (user.mobilePhoneNumber) {
      await this.mobilePhoneNumberInput.fill(user.mobilePhoneNumber);
    }
    await this.passwordInput.fill(user.password);
    await this.repeatPasswordInput.fill(user.password);
  }

  async acceptLegalDocuments() {
    await this.readAndAcceptDocument('Terms of Service');
    await this.readAndAcceptDocument('Privacy Policy');
  }

  private async readAndAcceptDocument(documentName: string) {
    const docMap: Record<string, string> = {
      'Terms of Service': 'webui_terms_and_conditions',
      'Privacy Policy': 'webui_privacy_policy',
    };
    const trigger = this.page.locator(`[data-testid="legal-trigger-${docMap[documentName]}"]`);
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const acceptButton = this.page.locator('[data-testid="legal-accept"]');
    await acceptButton.waitFor({ state: 'visible', timeout: 15_000 });
    await acceptButton.click();
    await acceptButton.waitFor({ state: 'hidden', timeout: 10_000 });
  }

  async submit() {
    await this.submitButton.click();
  }

  async waitForSuccess() {
    await this.waitForUrlContaining('/register/success');
  }

  async verifySuccess() {
    await this.waitForSuccess();
  }

  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent())?.trim() ?? '';
  }

  /**
   * True when the browser's built-in validation rejects the typed mobile phone
   * number (the input carries an HTML `pattern`), which blocks form submission
   * before anything reaches the server.
   */
  async isMobilePhoneNumberRejectedByBrowser(): Promise<boolean> {
    return this.mobilePhoneNumberInput.evaluate(el => (el as HTMLInputElement).validity.patternMismatch);
  }
}
