export function formatRwf(amount: string | number): string {
  return 'RWF ' + Number(amount).toLocaleString();
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  return phone;
}

export function generateTxId(): string {
  return 'KP-' + Date.now().toString(36).toUpperCase();
}
