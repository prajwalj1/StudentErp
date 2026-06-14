import { adToBs, bsToAd } from '@sbmdkl/nepali-date-converter';

export function toNepaliDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const bs = adToBs(`${y}-${m}-${day}`);
    if (!bs) return dateStr;
    const [by, bm, bd] = bs.split('-');
    const monthNames = ['Baisakh', 'Jestha', 'Asar', 'Shrawn', 'Bhadra', 'Aswin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
    const mIdx = parseInt(bm, 10) - 1;
    return `${monthNames[mIdx] || bm} ${parseInt(bd, 10)}, ${by}`;
  } catch {
    return dateStr;
  }
}

export function getNepaliYear(date) {
  try {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const bs = adToBs(`${y}-${m}-${day}`);
    if (!bs) return String(y);
    return bs.split('-')[0];
  } catch {
    return String(new Date(date).getFullYear());
  }
}

export function toNepaliDateShort(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const bs = adToBs(`${y}-${m}-${day}`);
    if (!bs) return dateStr;
    const [by, bm, bd] = bs.split('-');
    return `${by}-${bm}-${bd}`;
  } catch {
    return dateStr;
  }
}

export function toLocalDateStr(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const BS_MONTHS = ['Baisakh', 'Jestha', 'Asar', 'Shrawn', 'Bhadra', 'Aswin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];

export function getBsMonthName(monthIndex) {
  return BS_MONTHS[monthIndex] || '';
}

export function getDaysInBsMonth(bsYear, bsMonth) {
  const pad = (n) => String(n).padStart(2, '0');
  const startStr = bsToAd(`${bsYear}-${pad(bsMonth)}-01`);
  const nextMonth = bsMonth === 12 ? 1 : bsMonth + 1;
  const nextYear = bsMonth === 12 ? bsYear + 1 : bsYear;
  const endStr = bsToAd(`${nextYear}-${pad(nextMonth)}-01`);
  const start = new Date(startStr);
  const end = new Date(endStr);
  return (end - start) / (1000 * 60 * 60 * 24);
}

export function bsDateToAd(bsYear, bsMonth, bsDay) {
  const pad = (n) => String(n).padStart(2, '0');
  return bsToAd(`${bsYear}-${pad(bsMonth)}-${pad(bsDay)}`);
}

export function adDateToBs(adStr) {
  if (!adStr) return null;
  const bs = adToBs(adStr);
  if (!bs) return null;
  const [y, m, d] = bs.split('-').map(Number);
  return { year: y, month: m, day: d };
}
