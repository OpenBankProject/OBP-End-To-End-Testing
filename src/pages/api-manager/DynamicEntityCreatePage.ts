import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class DynamicEntityCreatePage extends BasePage {
  private entityNameInput = this.page.locator('#entityName');
  private schemaTextarea = this.page.locator('#schema');
  private submitButton = this.page.locator('[data-testid="submit-create-entity"]');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo(`${env.API_MANAGER_BASE_URL}/dynamic-entities/system/create`);
  }

  /**
   * Create a system dynamic entity. `schema` must contain `properties` and
   * (optionally) `required`, matching what the schema textarea expects.
   * On success API Manager shows an alert (auto-accept it with DialogWatcher)
   * and redirects to the system entity list.
   */
  async createEntity(entityName: string, schema: object) {
    // Wait for SvelteKit hydration: interacting earlier means bind:value
    // resets filled inputs and the submit click triggers a native GET form
    // submission instead of the JS handler.
    await this.page.waitForLoadState('networkidle');
    await this.entityNameInput.fill(entityName);
    await this.schemaTextarea.fill(JSON.stringify(schema, null, 2));
    await this.submitButton.click();
    await this.page.waitForURL('**/dynamic-entities/system', { timeout: 15_000 });
  }
}
