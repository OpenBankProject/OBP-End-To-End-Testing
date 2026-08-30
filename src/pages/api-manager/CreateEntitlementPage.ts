import { type Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class CreateEntitlementPage extends BasePage {
  // User search (UserSearchPickerWidget)
  private userSearchInput = this.page.locator('[data-testid="user-search-input"]');
  private searchResults = this.page.locator('.search-results');
  private userResults = this.page.locator('.search-results .user-result');
  private selectedUser = this.page.locator('.selected-user');

  // Role search (RoleSearchWidget)
  private roleSearchInput = this.page.locator('input[placeholder="Search roles..."]');
  private roleOptions = this.page.locator('.role-option');

  // Form actions
  private submitButton = this.page.locator('button:has-text("Create Entitlement")');
  private formError = this.page.locator('[data-testid="form-error"]');
  private successToast = this.page.getByText('Entitlement Created', { exact: true });

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo(`${env.API_MANAGER_BASE_URL}/rbac/entitlements/create`);
  }

  async searchUser(username: string) {
    await this.userSearchInput.waitFor({ state: 'visible', timeout: 15_000 });
    // The widget is server-rendered; a fill that lands before Svelte hydrates
    // is wiped when the client takes over and its input handler never runs.
    // The input's data-state flips to "unselected" only once that handler has
    // seen the value, so keep filling until the widget acknowledges it.
    await expect(async () => {
      await this.userSearchInput.fill(username);
      await expect(this.userSearchInput).toHaveAttribute('data-state', 'unselected', { timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    // Wait for debounced search results to appear
    await this.searchResults.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async selectUser(username: string) {
    const userResult = this.userResults.filter({
      has: this.page.locator('.user-result-name', { hasText: username }),
    });
    await userResult.first().click();
    await this.selectedUser.waitFor({ state: 'visible', timeout: 5_000 });
  }

  async searchAndSelectUser(username: string) {
    await this.searchUser(username);
    await this.selectUser(username);
  }

  async searchRole(roleName: string) {
    await this.roleSearchInput.fill(roleName);
  }

  async selectRole(roleName: string) {
    const roleOption = this.roleOptions.filter({
      has: this.page.locator('.role-option-name', { hasText: roleName }),
    });
    await roleOption.first().click();
  }

  async searchAndSelectRole(roleName: string) {
    await this.searchRole(roleName);
    await this.selectRole(roleName);
  }

  async submit() {
    await this.submitButton.click();
  }

  async verifySuccess() {
    // On success the page stays on /rbac/entitlements/create and shows an
    // "Entitlement Created" toast (only Cancel navigates away).
    await this.successToast.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async hasError(): Promise<boolean> {
    return this.formError.isVisible();
  }

  async isUserSelected(): Promise<boolean> {
    return this.selectedUser.isVisible();
  }
}
