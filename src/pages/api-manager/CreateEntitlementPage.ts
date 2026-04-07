import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class CreateEntitlementPage extends BasePage {
  // User search (UserSearchPickerWidget)
  private userSearchInput = this.page.locator(
    'input[placeholder="Enter username, email, or user ID..."]',
  );
  private searchResults = this.page.locator('.search-results');
  private userResults = this.page.locator('.search-results .user-result');
  private selectedUser = this.page.locator('.selected-user');

  // Role search (RoleSearchWidget)
  private roleSearchInput = this.page.locator('input[placeholder="Search roles..."]');
  private roleOptions = this.page.locator('.role-option');

  // Form actions
  private submitButton = this.page.locator('button:has-text("Create Entitlement")');
  private formError = this.page.locator('[data-testid="form-error"]');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo(`${env.API_MANAGER_BASE_URL}/rbac/entitlements/create`);
  }

  async searchUser(username: string) {
    await this.userSearchInput.fill(username);
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
    // After successful creation, the page redirects to /rbac/entitlements
    await this.waitForUrlContaining('/rbac/entitlements');
  }

  async hasError(): Promise<boolean> {
    return this.formError.isVisible();
  }

  async isUserSelected(): Promise<boolean> {
    return this.selectedUser.isVisible();
  }
}
