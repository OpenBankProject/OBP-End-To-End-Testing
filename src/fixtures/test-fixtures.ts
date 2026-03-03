import { test as base } from '@playwright/test';
import { VrpFormPage } from '../pages/hola/VrpFormPage.js';
import { MainPage } from '../pages/hola/MainPage.js';
import { OidcLoginPage } from '../pages/obp-oidc/OidcLoginPage.js';
import { LoginPage } from '../pages/portal/LoginPage.js';
import { ConfirmVrpConsentRequestPage } from '../pages/portal/ConfirmVrpConsentRequestPage.js';
import { ConfirmVrpConsentPage } from '../pages/portal/ConfirmVrpConsentPage.js';
import { RegisterPage } from '../pages/portal/RegisterPage.js';
import { ApiManagerLoginPage } from '../pages/api-manager/ApiManagerLoginPage.js';
import { MetricsPage } from '../pages/api-manager/MetricsPage.js';
import { ProfilePage } from '../pages/api-manager/ProfilePage.js';

type TestFixtures = {
  vrpFormPage: VrpFormPage;
  mainPage: MainPage;
  oidcLoginPage: OidcLoginPage;
  portalLoginPage: LoginPage;
  confirmVrpConsentRequestPage: ConfirmVrpConsentRequestPage;
  confirmVrpConsentPage: ConfirmVrpConsentPage;
  registerPage: RegisterPage;
  apiManagerLoginPage: ApiManagerLoginPage;
  metricsPage: MetricsPage;
  profilePage: ProfilePage;
};

export const test = base.extend<TestFixtures>({
  vrpFormPage: async ({ page }, use) => {
    await use(new VrpFormPage(page));
  },
  mainPage: async ({ page }, use) => {
    await use(new MainPage(page));
  },
  oidcLoginPage: async ({ page }, use) => {
    await use(new OidcLoginPage(page));
  },
  portalLoginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  confirmVrpConsentRequestPage: async ({ page }, use) => {
    await use(new ConfirmVrpConsentRequestPage(page));
  },
  confirmVrpConsentPage: async ({ page }, use) => {
    await use(new ConfirmVrpConsentPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  apiManagerLoginPage: async ({ page }, use) => {
    await use(new ApiManagerLoginPage(page));
  },
  metricsPage: async ({ page }, use) => {
    await use(new MetricsPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
});

export { expect } from '@playwright/test';
