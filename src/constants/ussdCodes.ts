export type Operator = 'MTN' | 'AIRTEL' | 'UNKNOWN';

export const USSD_CODES: Record<string, Record<string, string>> = {
  MTN: {
    send_money: '*182*1*1*{phone}*{amount}#',
    check_balance: '*182*6*1#',
    buy_airtime: '*182*2*1*1*1*{amount}#',
    buy_airtime_other: '*182*2*2*{phone}*{amount}#',
    pay_bill: '*182*8*1*{code}*{amount}#',
    mini_statement: '*182*6*2#',
  },
  AIRTEL: {
    send_money: '*185*1*{phone}*{amount}#',
    check_balance: '*185*5#',
    buy_airtime: '*185*2*1*{amount}#',
    buy_airtime_other: '*185*2*2*{phone}*{amount}#',
    pay_bill: '*185*9*{code}*{amount}#',
    mini_statement: '*185*6#',
  },
};

export const OPERATOR_PREFIXES: Record<string, Operator> = {
  '078': 'MTN', '079': 'MTN',
  '072': 'AIRTEL', '073': 'AIRTEL',
};

export function detectOperatorFromPhone(phone: string): Operator {
  const cleaned = phone.replace(/\D/g, '').slice(-9);
  const prefix = '0' + cleaned.slice(0, 2);
  return OPERATOR_PREFIXES[prefix] ?? 'UNKNOWN';
}

export function buildUssdCode(operator: Operator, action: string, params: Record<string, string> = {}): string {
  const template = USSD_CODES[operator]?.[action];
  if (!template) throw new Error(`No USSD code for ${operator} - ${action}`);
  return Object.entries(params).reduce((code, [key, val]) => code.replace(`{${key}}`, val), template);
}
