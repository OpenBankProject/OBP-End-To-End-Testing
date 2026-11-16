import { env } from '../config/env.js';

type Json = Record<string, any>;

/** The Roles cleanup needs, at the Cohort space. Granted once to Powerful User 1 and left in place. */
export const CLEANUP_ROLES = [
  'CanDeleteDynamicEntityRecord_cohort_programme',
  'CanDeleteDynamicEntityRecord_cohort_call',
  'CanDeleteDynamicEntityRecord_cohort_screening_decision',
  'CanDeleteDynamicEntityRecord_cohort_application',
  'CanDeleteCustomerCascade',
];

/**
 * OBP-API as seen by the Cohort tests: they create a programme and a call before the browser runs, and delete
 * everything the run wrote afterwards. Records are Dynamic Entity records in the Cohort space.
 */
export class CohortApi {
  private readonly data = `/obp/v7.0.0/banks/${env.COHORT_SPACE_ID}/dynamic-entities`;

  private constructor(readonly token: string) {}

  /** DirectLogin; throws when OBP_CONSUMER_KEY is not set or the login is refused. */
  static async login(username: string, password: string): Promise<CohortApi> {
    if (!env.OBP_CONSUMER_KEY) throw new Error('Missing OBP_CONSUMER_KEY: the Cohort tests log in to OBP-API with it');
    const response = await fetch(`${env.OBP_API_BASE_URL}/my/logins/direct`, {
      method: 'POST',
      headers: {
        Authorization: `DirectLogin username="${username}", password="${password}", consumer_key="${env.OBP_CONSUMER_KEY}"`,
        'Content-Type': 'application/json',
      },
    });
    const token = ((await response.json().catch(() => ({}))) as Json).token;
    if (!token) throw new Error(`DirectLogin as ${username}: HTTP ${response.status}`);
    return new CohortApi(token);
  }

  private async call(method: string, path: string, body?: Json): Promise<{ status: number; body: Json }> {
    const response = await fetch(`${env.OBP_API_BASE_URL}${path}`, {
      method,
      headers: { Authorization: `DirectLogin token="${this.token}"`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: (await response.json().catch(() => ({}))) as Json };
  }

  /** Grant the user the Roles cleanup needs, if it lacks them. */
  async ensureCleanupRoles(): Promise<void> {
    const me = (await this.call('GET', '/obp/v6.0.0/users/current')).body.user_id as string;
    const held = (((await this.call('GET', '/obp/v6.0.0/my/entitlements')).body.list ?? []) as Json[])
      .filter((e) => e.bank_id === env.COHORT_SPACE_ID)
      .map((e) => e.role_name as string);
    for (const role of CLEANUP_ROLES.filter((r) => !held.includes(r))) {
      const r = await this.call('POST', `/obp/v6.0.0/users/${me}/entitlements`, { bank_id: env.COHORT_SPACE_ID, role_name: role });
      if (r.status !== 201) throw new Error(`Granting ${role} at ${env.COHORT_SPACE_ID}: HTTP ${r.status} ${r.body.message ?? ''}`);
    }
  }

  /** The records of one entity through `scope` ('public', 'community', 'my', or '' for the Role-guarded list). */
  async list(entity: string, scope = ''): Promise<Json[]> {
    const r = await this.call('GET', `${this.data}/${scope ? `${scope}/` : ''}${entity}`);
    if (r.status !== 200) throw new Error(`Reading ${entity} (${scope || 'by Role'}): HTTP ${r.status} ${r.body.message ?? ''}`);
    return ((r.body[`${entity}_list`] ?? []) as Json[]).map((row) => row[entity] ?? row);
  }

  async create(entity: string, record: Json): Promise<string> {
    const r = await this.call('POST', `${this.data}/${entity}`, record);
    const id = r.body[entity]?.[`${entity}_id`];
    if (r.status !== 201 || !id) throw new Error(`Creating ${entity}: HTTP ${r.status} ${r.body.message ?? ''}`);
    return id as string;
  }

  /** Delete one record; `my` deletes the caller's own personal record, which needs no Role. */
  async remove(entity: string, id: string, scope = ''): Promise<number> {
    return (await this.call('DELETE', `${this.data}/${scope ? `${scope}/` : ''}${entity}/${id}`)).status;
  }

  /** The Customers in the Cohort space whose legal name matches. */
  async customers(match: RegExp): Promise<Json[]> {
    const r = await this.call('GET', `/obp/v7.0.0/banks/${env.COHORT_SPACE_ID}/customers?limit=500`);
    return ((r.body.customers ?? []) as Json[]).filter((c) => match.test(c.legal_name ?? ''));
  }

  /**
   * Delete a Customer with everything stored under it. OBP-API routes this only when allow_cascade_delete=true and
   * the caller holds CanDeleteCustomerCascade at the bank; a 404 means the route is not served.
   */
  async removeCustomerCascade(customerId: string): Promise<number> {
    return (await this.call('DELETE', `/obp/v4.0.0/management/cascading/banks/${env.COHORT_SPACE_ID}/customers/${customerId}`)).status;
  }
}
