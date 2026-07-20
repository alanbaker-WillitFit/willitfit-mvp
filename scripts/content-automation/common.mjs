import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

export const RUNTIME_CONTRACT = {
  '01_Airlines': ['AirlineID','AirlineName','Slug','OfficialBaggageURL','Status','LastChecked'],
  '02_Baggage_Rules': ['RuleID','AirlineID','FareClass','BagType','HeightCm','WidthCm','DepthCm','Status'],
  '06_Travel_Tips': ['TipID','Title','Slug','Content','Category','Status'],
  '07_Poll_Questions': ['Question','OptionA','OptionB','Status'],
  '08_SEO_Pages': ['PageSlug','Title','MetaDescription','H1','BodyContent','Status'],
  '09_Affiliate_Products': ['AffiliateID','Brand','Product','Category','AffiliateURL','Status'],
};

export function workbookPath() {
  const arg = process.argv.find((item) => item.startsWith('--workbook='));
  const value = arg ? arg.slice('--workbook='.length) : process.env.CONTENT_ENGINE_WORKBOOK;
  if (!value) throw new Error('Set CONTENT_ENGINE_WORKBOOK or pass --workbook=/absolute/path/file.xlsx');
  return path.resolve(value);
}

export function loadWorkbook(filePath = workbookPath()) {
  if (!fs.existsSync(filePath)) throw new Error(`Workbook not found: ${filePath}`);
  return { filePath, workbook: XLSX.readFile(filePath, { cellDates: true }) };
}

export function rows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
}

export function headers(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  return (matrix[0] ?? []).map((v) => String(v).trim()).filter(Boolean);
}

export function exactLive(value) { return String(value ?? '').trim() === 'Live'; }
export function clean(value) { return String(value ?? '').trim(); }
export function slugOk(value) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean(value)); }
export function positiveDimension(value) { const n=Number(value); return Number.isFinite(n) && n >= 1 && n <= 150; }
export function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
export function writeJson(file, data) { ensureDir(path.dirname(file)); fs.writeFileSync(file, JSON.stringify(data, null, 2)+'\n'); }
export function csvEscape(v) { const s=String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replaceAll('"','""')}"` : s; }
export function writeCsv(file, records, fields) {
  ensureDir(path.dirname(file));
  const lines=[fields.join(','), ...records.map(r=>fields.map(f=>csvEscape(r[f])).join(','))];
  fs.writeFileSync(file, lines.join('\n')+'\n');
}
export function stamp() { return new Date().toISOString().replace(/[:.]/g,'-'); }
