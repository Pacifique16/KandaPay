import { dialUssd } from '../modules/ussd/UssdBridge';
import { buildUssdCode, detectOperatorFromPhone, Operator } from '../constants/ussdCodes';

export async function executeTransaction(payload: {
  action: string;
  operator: Operator;
  simSlot?: number;
  params?: Record<string, string>;
}) {
  const { action, operator: rawOperator, simSlot = 0, params = {} } = payload;
  const operator = rawOperator === 'UNKNOWN' ? 'MTN' : rawOperator;
  const ussdCode = buildUssdCode(operator, action, params);
  console.log(`[KandaPay] Dialing: ${ussdCode} on SIM${simSlot + 1} (${operator})`);
  return dialUssd(ussdCode, simSlot);
}

function normalizePhone(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[\s\-().]/g, '').replace(/[^0-9+]/g, '');
  // Remove +250 or 250 country code and replace with 0
  if (cleaned.startsWith('+250')) cleaned = '0' + cleaned.slice(4);
  else if (cleaned.startsWith('250')) cleaned = '0' + cleaned.slice(3);
  return cleaned;
}

export const sendMoney = (phone: string, amount: string, simSlot = 0) => {
  const normalized = normalizePhone(phone);
  return executeTransaction({ action: 'send_money', operator: detectOperatorFromPhone(normalized), simSlot, params: { phone: normalized, amount } });
};

export const checkBalance = (operator: Operator, simSlot = 0) =>
  executeTransaction({ action: 'check_balance', operator, simSlot });

export const buyAirtime = (amount: string, operator: Operator, simSlot = 0) =>
  executeTransaction({ action: 'buy_airtime', operator, simSlot, params: { amount } });

export const buyAirtimeOther = (phone: string, amount: string, operator: Operator, simSlot = 0) => {
  const normalized = normalizePhone(phone);
  return executeTransaction({ action: 'buy_airtime_other', operator, simSlot, params: { phone: normalized, amount } });
};

export const payBill = (code: string, amount: string, operator: Operator, simSlot = 0) =>
  executeTransaction({ action: 'pay_bill', operator, simSlot, params: { code, amount } });
