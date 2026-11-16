import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

/** A call's public page, and the first steps of applying to it. */
export class CohortCallPage extends BasePage {
  private apply = this.page.locator('[data-testid="call-apply"], [data-testid="call-continue"]').first();

  constructor(page: Page) {
    super(page);
  }

  async goto(callId: string) {
    await this.page.goto(`${env.COHORT_BASE_URL}/calls/${callId}`, { waitUntil: 'networkidle', timeout: 30_000 });
  }

  async text(): Promise<string> {
    return ((await this.page.locator('body').innerText()) || '').replace(/\s+/g, ' ');
  }

  async clickApply() {
    await this.apply.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** The "Your details" step an applicant who is not yet a Customer of the space goes through. */
  get onDetailsStep(): boolean {
    return this.page.url().includes('/details');
  }

  async giveDetails(legalName: string, mobile: string, email: string) {
    await this.page.locator('input[name="legal_name"]').fill(legalName);
    await this.page.locator('input[name="mobile_phone_number"]').fill(mobile);
    await this.page.locator('input[name="email"]').fill(email);
    await this.page.locator('[data-testid="details-continue"]').click();
    await this.page.waitForLoadState('networkidle');
  }
}
