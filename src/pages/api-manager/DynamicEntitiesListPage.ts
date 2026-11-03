import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class DynamicEntitiesListPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo(`${env.API_MANAGER_BASE_URL}/dynamic-entities/system`);
  }

  /** Resolve a dynamic entity's id from its name link on the list page. */
  async entityIdForName(entityName: string): Promise<string> {
    const link = this.page.locator('a[href^="/dynamic-entities/system/"]', {
      hasText: entityName,
    });
    const href = await link.first().getAttribute('href');
    if (!href) {
      throw new Error(`No entity link found for "${entityName}"`);
    }
    // API Manager links an entity as /dynamic-entities/system/{id}?bank_id=SYS since its November 2026 build;
    // the id is the path's last segment, without the query.
    const id = new URL(href, 'http://api-manager.invalid').pathname.split('/').pop();
    if (!id) {
      throw new Error(`Could not extract entity id from href "${href}"`);
    }
    return id;
  }
}
