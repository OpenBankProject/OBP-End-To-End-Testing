import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const env = {
  // Base URLs
  HOLA_BASE_URL: optional('HOLA_BASE_URL', 'http://localhost:8087'),
  OBP_PORTAL_BASE_URL: optional('OBP_PORTAL_BASE_URL', 'http://localhost:5174'),
  API_MANAGER_BASE_URL: optional('API_MANAGER_BASE_URL', 'http://localhost:3003'),

  // OBP-OIDC login credentials (optional — only needed by tests that use default login)
  OBP_LOGIN_PROVIDER: optional('OBP_LOGIN_PROVIDER', 'OBP-API'),
  OBP_LOGIN_USERNAME: optional('OBP_LOGIN_USERNAME', ''),
  OBP_LOGIN_PASSWORD: optional('OBP_LOGIN_PASSWORD', ''),

  // VRP form: bank & account routing (optional — only needed by VRP tests)
  VRP_FROM_BANK_ROUTING_ADDRESS: optional('VRP_FROM_BANK_ROUTING_ADDRESS', ''),
  VRP_FROM_ROUTING_ADDRESS: optional('VRP_FROM_ROUTING_ADDRESS', ''),
  VRP_TO_ROUTING_ADDRESS: optional('VRP_TO_ROUTING_ADDRESS', ''),
  VRP_CURRENCY: optional('VRP_CURRENCY', 'EUR'),

  // VRP form: limits
  VRP_MAX_SINGLE_AMOUNT: optional('VRP_MAX_SINGLE_AMOUNT', '100'),
  VRP_MAX_MONTHLY_AMOUNT: optional('VRP_MAX_MONTHLY_AMOUNT', '1000'),
  VRP_MAX_MONTHLY_FREQUENCY: optional('VRP_MAX_MONTHLY_FREQUENCY', '10'),
  VRP_MAX_YEARLY_AMOUNT: optional('VRP_MAX_YEARLY_AMOUNT', '10000'),
  VRP_MAX_YEARLY_FREQUENCY: optional('VRP_MAX_YEARLY_FREQUENCY', '100'),
  VRP_MAX_NUMBER_OF_HISTORICAL_CONSENTS_SHOWN: optional('VRP_MAX_NUMBER_OF_HISTORICAL_CONSENTS_SHOWN', '10'),

  // OTP
  TEST_OTP_VALUE: optional('TEST_OTP_VALUE', '123456'),
};
