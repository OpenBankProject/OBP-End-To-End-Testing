import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

/**
 * API Manager user detail page (/users/{user_id}).
 * Backed by GET /obp/v7.0.0/users/user-id/{user_id}, which exposes the
 * user's own mobile_phone_number fields. Viewing another user's record
 * needs the appropriate entitlement (e.g. CanGetAnyUser).
 */
export class UserDetailPage extends BasePage {
  private mobilePhoneNumber = this.page.locator('[data-testid="user-mobile-phone-number"]');
  private mobilePhoneValidated = this.page.locator('[data-testid="user-mobile-phone-validated"]');

  constructor(page: Page) {
    super(page);
  }

  async goto(userId: string) {
    await this.navigateTo(`${env.API_MANAGER_BASE_URL}/users/${encodeURIComponent(userId)}`);
  }

  /** Text shown for the mobile phone number ("N/A" when none is set). */
  async getMobilePhoneNumber(): Promise<string> {
    await this.mobilePhoneNumber.waitFor({ state: 'visible', timeout: 15_000 });
    return (await this.mobilePhoneNumber.textContent())?.trim() ?? '';
  }

  /** "Yes" / "No" / "Unknown" badge for mobile phone validation. */
  async getMobilePhoneValidated(): Promise<string> {
    await this.mobilePhoneValidated.waitFor({ state: 'visible', timeout: 15_000 });
    return (await this.mobilePhoneValidated.textContent())?.trim() ?? '';
  }
}
