import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export type ApplicationFields = {
  startupName: string;
  sector: string;
  stage: string;
  teamSize: string;
  problem: string;
  solution: string;
  market: string;
};

/** The applicant's own application: the form, and once decided its outcome. */
export class CohortApplicationPage extends BasePage {
  private submit = this.page.locator('[data-testid="application-submit"]');
  private save = this.page.locator('[data-testid="application-save"]');
  readonly missing = this.page.locator('[data-testid="application-missing"]');
  readonly submitted = this.page.locator('[data-testid="application-submitted"]');
  readonly outcome = this.page.locator('[data-testid="application-outcome"]');

  constructor(page: Page) {
    super(page);
  }

  async goto(applicationId: string) {
    await this.page.goto(`${env.COHORT_BASE_URL}/applications/${applicationId}`, { waitUntil: 'networkidle', timeout: 30_000 });
  }

  async gotoList() {
    await this.page.goto(`${env.COHORT_BASE_URL}/applications`, { waitUntil: 'networkidle', timeout: 30_000 });
  }

  async text(): Promise<string> {
    return ((await this.page.locator('body').innerText()) || '').replace(/\s+/g, ' ');
  }

  /** Submit and wait for the list of what is missing; the form is posted in the page, not as a navigation. */
  async submitExpectingMissing() {
    await this.submit.click();
    await this.missing.waitFor({ timeout: 15_000 });
  }

  async fill(fields: ApplicationFields) {
    await this.page.locator('input[name="startup_name"]').fill(fields.startupName);
    await this.page.locator('input[name="sector"]').fill(fields.sector);
    await this.page.locator('select[name="stage"]').selectOption(fields.stage);
    await this.page.locator('input[name="team_size"]').fill(fields.teamSize);
    await this.page.locator('textarea[name="problem_statement"]').fill(fields.problem);
    await this.page.locator('textarea[name="solution"]').fill(fields.solution);
    await this.page.locator('textarea[name="market_understanding"]').fill(fields.market);
    await this.page.locator('input[name="local_resident"]').check();
  }

  async saveDraft() {
    await this.save.click();
    await this.page.locator('[role="status"]').first().waitFor({ timeout: 15_000 });
  }

  async submitApplication() {
    await this.submit.click();
    await this.submitted.waitFor({ timeout: 15_000 });
  }
}
