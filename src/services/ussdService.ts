import { dialUssd } from '../modules/ussd/UssdBridge';
import { buildUssdCode, detectOperatorFromPhone, Operator } from '../constants/ussdCodes';

export async function executeTransaction(payload: {
  action: string;
  operator: Operator;
  simSlot?: number;
  params?: Record<string, string>;
}) {
  const { action, operator, simSlot = 0, params = {} } = payload;
  if (operator === 'UNKNOWN') return { success: false, error: 'Could not detect operator.' };
  const ussdCode = buildUssdCode(operator, action, params);
  console.log(`[KandaPay] Dialing: ${ussdCode} on SIM${simSlot + 1} (${operator})`);
  return dialUssd(ussdCode, simSlot);
}

export const sendMoney = (phone: string, amount: string, simSlot = 0) =>
  executeTransaction({ action: 'send_money', operator: detectOperatorFromPhone(phone), simSlot, params: { phone, amount } });

export const checkBalance = (operator: Operator, simSlot = 0) =>
  executeTransaction({ action: 'check_balance', operator, simSlot });

export const buyAirtime = (amount: string, operator: Operator, simSlot = 0) =>
  executeTransaction({ action: 'buy_airtime', operator, simSlot, params: { amount } });

export const payBill = (code: string, amount: string, operator: Operator, simSlot = 0) =>
  executeTransaction({ action: 'pay_bill', operator, simSlot, params: { code, amount } });
