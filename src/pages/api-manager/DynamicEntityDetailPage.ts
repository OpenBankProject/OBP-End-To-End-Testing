import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class DynamicEntityDetailPage extends BasePage {
  private deleteButton = this.page.locator('[data-testid="delete-entity"]');

  constructor(page: Page) {
    super(page);
  }

  async gotoFor(entityId: string) {
    await this.navigateTo(`${env.API_MANAGER_BASE_URL}/dynamic-entities/system/${entityId}`);
    // Wait for SvelteKit hydration so button clicks reach the JS handlers.
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click Delete Entity. Triggers a native confirm() and then a success or
   * error alert() — register a DialogWatcher before calling this and assert
   * on its messages ("deleted successfully") afterwards.
   */
  async deleteEntity() {
    await this.deleteButton.click();
  }
}
