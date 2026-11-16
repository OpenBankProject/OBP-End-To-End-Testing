import { test, expect } from '../../src/fixtures/test-fixtures.js';
import { env } from '../../src/config/env.js';
import { CohortApi } from '../../src/helpers/CohortApi.js';
import { CohortHomePage } from '../../src/pages/cohort/CohortHomePage.js';
import { CohortCallPage } from '../../src/pages/cohort/CohortCallPage.js';
import { CohortApplicationPage } from '../../src/pages/cohort/CohortApplicationPage.js';
import { CohortStaffApplicationsPage } from '../../src/pages/cohort/CohortStaffApplicationsPage.js';
import { OidcLoginPage } from '../../src/pages/obp-oidc/OidcLoginPage.js';

/**
 * An application to a Cohort call, from the call to the applicant reading the outcome, and then nothing left behind.
 *
 * Staff set up a programme and an open call through OBP-API. A visitor sees the call and is asked to sign in when
 * applying. The applicant applies (giving their details the first time), is told what is missing, saves a draft and
 * submits. Staff open the application and shortlist it with a private reason and a message. The applicant reads the
 * message and never the reason.
 *
 * Cleanup always runs: it deletes the screening decisions, applications, call and programme the run wrote and the
 * applicant's Customer (cascade delete, so OBP-API needs allow_cascade_delete=true and the user the Role
 * CanDeleteCustomerCascade at the Cohort space), then reads the space back and fails on anything of the run left.
 * Everything the run makes carries the marker "E2E <run id>".
 *
 * Staff are Powerful User 1. The applicant is COHORT_APPLICANT_USERNAME, or Powerful User 1 again when unset.
 */

const run = Date.now().toString(36);
const marker = `E2E ${run}`;
const startupName = `${marker} Startup`;
const reason = `${marker} private reason`;
const message = `${marker} message to the applicant`;

const staff = {
  username: env.POWERFUL_USER_1_USERNAME,
  password: env.POWERFUL_USER_1_PASSWORD,
  provider: env.POWERFUL_USER_1_CREDENTIALS_PROVIDER,
};
const applicant = env.COHORT_APPLICANT_USERNAME
  ? { username: env.COHORT_APPLICANT_USERNAME, password: env.COHORT_APPLICANT_PASSWORD, provider: staff.provider }
  : staff;

const created = { programmeId: '', callId: '', applicationIds: [] as string[] };

async function signIn(page: import('@playwright/test').Page, user: typeof staff) {
  const home = new CohortHomePage(page);
  await home.goto();
  await home.openIdentityProvider();
  await new OidcLoginPage(page).login(user.username, user.password, user.provider);
}

test.describe('Cohort application lifecycle', () => {
  test.afterAll(async () => {
    const api = await CohortApi.login(staff.username, staff.password);
    const problems: string[] = [];
    const applicantApi = applicant === staff ? api : await CohortApi.login(applicant.username, applicant.password);

    // every application of the run's call, wherever the run stopped
    if (created.callId) {
      for (const a of await api.list('cohort_application', 'community'))
        if (a.call_id === created.callId && !created.applicationIds.includes(a.cohort_application_id)) created.applicationIds.push(a.cohort_application_id);
    }
    for (const d of await api.list('cohort_screening_decision'))
      if (created.applicationIds.includes(d.application_id) && (await api.remove('cohort_screening_decision', d.cohort_screening_decision_id)) !== 200)
        problems.push(`decision ${d.cohort_screening_decision_id}`);
    for (const id of created.applicationIds) {
      // the applicant's own record needs no Role
      let status = await applicantApi.remove('cohort_application', id, 'my');
      if (status !== 200) status = await api.remove('cohort_application', id);
      if (status !== 200) problems.push(`application ${id}`);
    }
    if (created.callId && (await api.remove('cohort_call', created.callId)) !== 200) problems.push(`call ${created.callId}`);
    if (created.programmeId && (await api.remove('cohort_programme', created.programmeId)) !== 200) problems.push(`programme ${created.programmeId}`);

    // the Customers the test made, named by the details step
    const testCustomer = /^E2E [a-z0-9]+ Applicant$/;
    for (const c of await api.customers(testCustomer)) {
      const status = await api.removeCustomerCascade(c.customer_id);
      if (status !== 200 && status !== 204) problems.push(`Customer ${c.customer_id} (HTTP ${status}; the cascade delete needs allow_cascade_delete=true)`);
    }

    // read the space back
    const left: string[] = [];
    for (const [entity, scope] of [['cohort_programme', 'public'], ['cohort_call', 'public'], ['cohort_application', 'community'], ['cohort_screening_decision', '']] as const)
      for (const row of await api.list(entity, scope))
        if (JSON.stringify(row).includes(marker) || row.call_id === created.callId || created.applicationIds.includes(row.application_id)) left.push(`${entity} ${row[`${entity}_id`]}`);
    if ((await api.customers(testCustomer)).length) left.push('a test Customer');
    expect(problems, 'deleting what the run wrote').toEqual([]);
    expect(left, 'what the run left in the space').toEqual([]);
  });

  test('an applicant applies, staff shortlist, the applicant reads the outcome', async ({
    page,
    browser,
    cohortHomePage,
    cohortCallPage,
  }) => {
    test.setTimeout(240_000);
    const staffApi = await CohortApi.login(staff.username, staff.password);

    await test.step('Staff set up a programme and an open call', async () => {
      await staffApi.ensureCleanupRoles();
      const today = new Date().toISOString().slice(0, 10);
      const inAMonth = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
      created.programmeId = await staffApi.create('cohort_programme', { name: `${marker} programme`, description: 'End-to-end run', status: 'open' });
      created.callId = await staffApi.create('cohort_call', {
        programme_id: created.programmeId,
        title: `${marker} call`,
        description: 'Applications for the end-to-end run.',
        status: 'open',
        opens_at: today,
        closes_at: inAMonth,
        eligibility_residency: 'none',
      });
    });

    await test.step('A visitor sees the call and is asked to sign in when applying', async () => {
      await cohortHomePage.goto();
      expect(await cohortHomePage.text()).toContain(`${marker} call`);
      await cohortCallPage.goto(created.callId);
      const text = await cohortCallPage.text();
      expect(text).toContain(`${marker} call`);
      expect(text).toContain(`${marker} programme`);
      await cohortCallPage.clickApply();
      // Cohort's own login page, or straight on to the identity provider
      expect(new URL(page.url()).pathname).toMatch(/^\/(login|obp-oidc\/auth)/);
    });

    const applicantContext = await browser.newContext();
    const applicantPage = await applicantContext.newPage();
    const applicantCall = new CohortCallPage(applicantPage);
    const applicantApplication = new CohortApplicationPage(applicantPage);
    let applicationId = '';

    await test.step('The applicant signs in, applies, and is told what is missing', async () => {
      await signIn(applicantPage, applicant);
      await applicantCall.goto(created.callId);
      await applicantCall.clickApply();
      if (applicantCall.onDetailsStep) await applicantCall.giveDetails(`${marker} Applicant`, '+49 170 0000000', `e2e-${run}@example.org`);
      expect(applicantPage.url()).toMatch(/\/applications\/[^/]+$/);
      await applicantApplication.submitExpectingMissing();
    });

    await test.step('The applicant saves a draft and submits', async () => {
      await applicantApplication.fill({
        startupName,
        sector: 'payments',
        stage: 'mvp',
        teamSize: '3',
        problem: 'Small merchants cannot accept card payments cheaply.',
        solution: 'A QR payment app with low fees.',
        market: 'Most small merchants still take cash.',
      });
      await applicantApplication.saveDraft();
      const applicantApi = applicant === staff ? staffApi : await CohortApi.login(applicant.username, applicant.password);
      const draft = (await applicantApi.list('cohort_application', 'my')).find((a) => a.call_id === created.callId);
      expect(draft?.status).toBe('draft');
      expect(draft?.startup_name).toBe(startupName);
      await applicantApplication.submitApplication();
      const submitted = (await applicantApi.list('cohort_application', 'my')).find((a) => a.call_id === created.callId);
      expect(submitted?.status).toBe('submitted');
      expect(submitted?.eligibility).toBeTruthy();
      applicationId = submitted?.cohort_application_id;
      created.applicationIds.push(applicationId);
    });

    const staffContext = applicant === staff ? applicantContext : await browser.newContext();
    const staffPage = applicant === staff ? applicantPage : await staffContext.newPage();
    const staffApplications = new CohortStaffApplicationsPage(staffPage);

    await test.step('Staff read the application and shortlist it', async () => {
      if (staffPage !== applicantPage) await signIn(staffPage, staff);
      await staffApplications.goto();
      await expect(staffApplications.application(startupName)).toBeVisible();
      await staffApplications.open(startupName);
      const fields = ((await staffApplications.fields.innerText()) || '').replace(/\s+/g, ' ');
      expect(fields).toContain('payments');
      expect(fields).toContain('A QR payment app with low fees.');
      await staffApplications.decide('shortlisted', reason, message);
      const decisions = await staffApplications.decisionsText();
      expect(decisions).toContain(reason);
      expect(decisions).toContain(message);
      const stored = (await staffApi.list('cohort_screening_decision')).filter((d) => d.application_id === applicationId);
      expect(stored).toHaveLength(1);
      expect(stored[0].decision).toBe('shortlisted');
    });

    await test.step('The applicant reads the message and never the private reason', async () => {
      await applicantApplication.goto(applicationId);
      expect(((await applicantApplication.outcome.innerText()) || '').replace(/\s+/g, ' ')).toContain(message);
      expect(await applicantApplication.text()).not.toContain(reason);
      await applicantApplication.gotoList();
      expect(await applicantApplication.text()).toContain(startupName);
    });

    await applicantContext.close();
    if (staffContext !== applicantContext) await staffContext.close();
  });
});
