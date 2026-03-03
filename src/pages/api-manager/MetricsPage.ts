import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class MetricsPage extends BasePage {
  // Role Checker Widget (appears when user lacks required entitlement)
  private roleCheckerWidget = this.page.locator('.alert.alert-missing-role');
  private roleCheckerHeader = this.page.locator('.alert-header');
  private alertTitle = this.page.locator('.alert-title');
  private entitlementNames = this.page.locator('.entitlement-name');
  private requestButton = this.page.locator('.btn-request');
  private submitSuccess = this.page.locator('.submit-success');
  private submitError = this.page.locator('.submit-error');
  private tipBox = this.page.locator('.tip-box');

  // Metrics page content (shown when user has required role)
  private queryMetricsHeading = this.page.locator('h1, h2, h3, h4', { hasText: 'Query Metrics' });
  private optionalRoleNote = this.page.locator('.optional-role-note');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo(`${env.API_MANAGER_BASE_URL}/metrics`);
  }

  async waitForPage() {
    await this.waitForUrlContaining('/metrics');
  }

  /** Returns true if the missing-role widget is blocking the page. */
  async hasMissingRoleWidget(): Promise<boolean> {
    return this.roleCheckerWidget.isVisible();
  }

  /** Returns true if the widget is in its expanded state. */
  async isWidgetExpanded(): Promise<boolean> {
    return this.page.locator('.alert.alert-missing-role.expanded').isVisible();
  }

  /** Click the header bar to expand/collapse the widget. */
  async toggleWidget() {
    await this.roleCheckerHeader.click();
  }

  /** Get the title text (e.g. "Missing Entitlement: CanReadMetrics"). */
  async getAlertTitle(): Promise<string> {
    return (await this.alertTitle.textContent()) ?? '';
  }

  /** Get all missing entitlement names listed in the expanded widget. */
  async getEntitlementNames(): Promise<string[]> {
    const names: string[] = [];
    const count = await this.entitlementNames.count();
    for (let i = 0; i < count; i++) {
      const text = await this.entitlementNames.nth(i).textContent();
      if (text) names.push(text.trim());
    }
    return names;
  }

  /** Click "Request Entitlement" and wait for the success confirmation. */
  async requestEntitlement() {
    await this.requestButton.click();
    await this.submitSuccess.waitFor({ state: 'visible', timeout: 30_000 });
  }

  /** Returns true if the entitlement request succeeded. */
  async hasRequestSuccess(): Promise<boolean> {
    return this.submitSuccess.isVisible();
  }

  /** Returns true if the entitlement request errored. */
  async hasRequestError(): Promise<boolean> {
    return this.submitError.isVisible();
  }

  /** Returns true if the optional-role info bar is visible (page accessible but missing optional roles). */
  async hasOptionalRoleNote(): Promise<boolean> {
    return this.optionalRoleNote.isVisible();
  }

  /** Verify the metrics page content loaded (only when user has the role). */
  async verifyPageLoaded() {
    await this.queryMetricsHeading.waitFor({ state: 'visible', timeout: 30_000 });
  }
}
