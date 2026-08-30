import { test, expect } from '../../src/fixtures/test-fixtures.js';
import { env } from '../../src/config/env.js';
import { DialogWatcher } from '../../src/helpers/DialogWatcher.js';

/**
 * Regression test: a required integer field must accept 0 when creating or
 * editing a dynamic entity record in API Manager.
 *
 * Background: record validation used a JS truthiness check (`!value`), so 0
 * was treated as "missing" and rejected with "This field is required" even
 * though the OBP dynamic entity endpoint accepts it.
 *
 * The test creates its own system dynamic entity, exercises the record CRUD
 * modals, and deletes the entity at the end.
 */

function generateUniqueEntityName() {
  return `zero_int_e2e_${Date.now()}`;
}

const ENTITY_SCHEMA = {
  required: ['age_required'],
  properties: {
    name: {
      type: 'string',
      description: 'Name field',
      example: 'Example Name',
    },
    age_required: {
      type: 'integer',
      description: 'Age in years',
      example: 25,
      minimum: 0,
      maximum: 150,
    },
  },
};

test.describe('Dynamic entity record CRUD — required integer accepts 0', () => {
  test('should accept 0 in a required integer field on create and edit', async ({
    page,
    apiManagerLoginPage,
    oidcLoginPage,
    dynamicEntityCreatePage,
    dynamicEntitiesListPage,
    dynamicEntityDetailPage,
    dynamicEntityCrudPage,
  }) => {
    const dialogs = new DialogWatcher(page);
    const entityName = generateUniqueEntityName();
    let entityId = '';

    await test.step('Log in to API Manager as Powerful User 1', async () => {
      await apiManagerLoginPage.goto();
      await oidcLoginPage.waitForLoginPage();
      await oidcLoginPage.login(
        env.POWERFUL_USER_1_USERNAME,
        env.POWERFUL_USER_1_PASSWORD,
        env.POWERFUL_USER_1_CREDENTIALS_PROVIDER,
      );
    });

    await test.step('Create a system dynamic entity with a required integer field', async () => {
      await dynamicEntityCreatePage.goto();
      await dynamicEntityCreatePage.createEntity(entityName, ENTITY_SCHEMA);
      await dialogs.waitFor('created successfully');
      entityId = await dynamicEntitiesListPage.entityIdForName(entityName);
    });

    await test.step('Submitting the create form without the required field is rejected', async () => {
      await dynamicEntityCrudPage.gotoFor(entityId);
      await dynamicEntityCrudPage.openCreateModal();
      await dynamicEntityCrudPage.createFieldInput('name').fill('probe-empty');
      await dynamicEntityCrudPage.submitCreate();
      await expect(dynamicEntityCrudPage.createFieldError('age_required')).toHaveText(
        'This field is required',
      );
    });

    await test.step('Entering 0 in the required integer field creates the record', async () => {
      await dynamicEntityCrudPage.createFieldInput('name').fill('zero-record');
      await dynamicEntityCrudPage.createFieldInput('age_required').fill('0');
      await dynamicEntityCrudPage.submitCreate();
      await dialogs.waitFor('Record created successfully');
      await expect(dynamicEntityCrudPage.recordRow(0)).toContainText('zero-record');
      await expect(dynamicEntityCrudPage.recordRow(0)).toContainText('0');
    });

    await test.step('Editing the record keeps 0 valid', async () => {
      await dynamicEntityCrudPage.openEditModalForRow(0);
      await expect(dynamicEntityCrudPage.editFieldInput('age_required')).toHaveValue('0');
      await dynamicEntityCrudPage.editFieldInput('name').fill('zero-record-edited');
      await dynamicEntityCrudPage.editFieldInput('age_required').fill('0');
      await dynamicEntityCrudPage.submitEdit();
      await dialogs.waitFor('Record updated successfully');
      await expect(dynamicEntityCrudPage.recordRow(0)).toContainText('zero-record-edited');
    });

    await test.step('Clean up: delete the record, then the dynamic entity', async () => {
      // OBP refuses to delete an entity that still has data (OBP-09006),
      // so remove the record first.
      await dynamicEntityCrudPage.deleteRecord(0);
      await dialogs.waitFor('Record deleted successfully');
      await dynamicEntityDetailPage.gotoFor(entityId);
      await dynamicEntityDetailPage.deleteEntity();
      await dialogs.waitFor('dynamic entity deleted successfully');
      await page.waitForURL('**/dynamic-entities/system', { timeout: 15_000 });
    });
  });
});
