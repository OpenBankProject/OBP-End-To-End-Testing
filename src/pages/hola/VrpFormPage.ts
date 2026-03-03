import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { env } from '../../config/env.js';

export class VrpFormPage extends BasePage {
  // From Account
  private fromBankRoutingScheme = this.page.locator('#from_bank_routing_scheme');
  private fromBankRoutingAddress = this.page.locator('#from_bank_routing_address');
  private fromRoutingScheme = this.page.locator('#from_routing_scheme');
  private fromRoutingAddress = this.page.locator('#from_routing_address');

  // To Account
  private toBankRoutingScheme = this.page.locator('#to_bank_routing_scheme');
  private toBankRoutingAddress = this.page.locator('#to_bank_routing_address');
  private toBranchRoutingScheme = this.page.locator('#to_branch_routing_scheme');
  private toBranchRoutingAddress = this.page.locator('#to_branch_routing_address');
  private toRoutingScheme = this.page.locator('#to_routing_scheme');
  private toRoutingAddress = this.page.locator('#to_routing_address');

  // Limits
  private currency = this.page.locator('#currency');
  private maxSingleAmount = this.page.locator('#max_single_amount');
  private maxMonthlyAmount = this.page.locator('#max_monthly_amount');
  private maxYearlyAmount = this.page.locator('#max_yearly_amount');
  private maxMonthlyTransactions = this.page.locator('#max_number_of_monthly_transactions');
  private maxYearlyTransactions = this.page.locator('#max_number_of_yearly_transactions');

  // Submit
  private proceedButton = this.page.locator('.btn.btn-success');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo(`${env.HOLA_BASE_URL}/index_obp_vrp`);
  }

  async fillVrpForm() {
    await this.fromBankRoutingAddress.fill(env.VRP_FROM_BANK_ROUTING_ADDRESS);
    await this.fromRoutingAddress.fill(env.VRP_FROM_ROUTING_ADDRESS);
    await this.toRoutingAddress.fill(env.VRP_TO_ROUTING_ADDRESS);
    await this.currency.fill(env.VRP_CURRENCY);
    await this.maxSingleAmount.fill(env.VRP_MAX_SINGLE_AMOUNT);
    await this.maxMonthlyAmount.fill(env.VRP_MAX_MONTHLY_AMOUNT);
    await this.maxYearlyAmount.fill(env.VRP_MAX_YEARLY_AMOUNT);
    await this.maxMonthlyTransactions.fill(env.VRP_MAX_MONTHLY_FREQUENCY);
    await this.maxYearlyTransactions.fill(env.VRP_MAX_YEARLY_FREQUENCY);
  }

  async submit() {
    await this.proceedButton.click();
  }
}
