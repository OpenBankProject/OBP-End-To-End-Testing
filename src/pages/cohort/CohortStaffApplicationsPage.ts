import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

/** Staff's list of submitted applications, one application, and the screening decision on it. */
export class CohortStaffApplicationsPage extends BasePage {
  readonly fields = this.page.locator('[data-testid="staff-application-fields"]');
  readonly decisions = this.page.locator('[data-testid="staff-decisions"]');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto(`${env.COHORT_BASE_URL}/staff/applications`, { waitUntil: 'networkidle', timeout: 30_000 });
  }

  /** The row of an application, found by its startup name. */
  application(startupName: string) {
    return this.page.locator('a', { hasText: startupName }).first();
  }

  async open(startupName: string) {
    await this.application(startupName).click();
    await this.page.waitForLoadState('networkidle');
  }

  async decide(decision: 'shortlisted' | 'rejected' | 'needs_info', reason: string, messageToApplicant: string) {
    const form = this.page.locator('[data-testid="staff-decide"]');
    await form.locator(`input[name="decision"][value="${decision}"]`).check();
    await form.locator('textarea[name="reason"]').fill(reason);
    await form.locator('textarea[name="message_to_applicant"]').fill(messageToApplicant);
    await this.page.locator('[data-testid="staff-decide-submit"]').click();
    await this.decisions.locator('[role="status"]').first().waitFor({ timeout: 15_000 });
  }

  async decisionsText(): Promise<string> {
    return ((await this.decisions.innerText()) || '').replace(/\s+/g, ' ');
  }
}
