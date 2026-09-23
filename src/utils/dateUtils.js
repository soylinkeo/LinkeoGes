export function localDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = name => parts.find(p => p.type === name).value;
  return value('year') + '-' + value('month') + '-' + value('day');
}
export const getAccountingMonth = (dateStr = localDate()) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || localDate());
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) return '';
  const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return names[Number(match[2]) - 1] + ' ' + match[1];
};
export function accountingMonths(extraDates = []) {
  const year = Number(localDate().slice(0,4));
  const values = new Set();
  for (let y = year - 5; y <= year + 5; y++) for (let m = 1; m <= 12; m++) values.add(getAccountingMonth(y + '-' + String(m).padStart(2,'0') + '-01'));
  extraDates.forEach(date => { const value = getAccountingMonth(date); if (value) values.add(value); });
  return [...values];
}
export const ACCOUNTING_MONTHS = accountingMonths();
