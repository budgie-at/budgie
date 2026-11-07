import { mkdirSync, writeFileSync } from 'node:fs';

import { utils, write } from 'xlsx';

const SHEET_NAME = 'Виписка по операціям';
const HEADER = ['Дата', 'Тип операції', 'Вид цінного паперу', 'Дебет', 'Кредит'];
const MILLISECONDS_PER_DAY = 86_400_000;
const EXCEL_EPOCH_OFFSET_DAYS = 25_569;
const OUTPUT_DIRECTORY = new URL('../fixtures/inzhur/', import.meta.url);
const OUTPUT_FILE = new URL('inzhur-operations-001.xlsx', OUTPUT_DIRECTORY);

const rows = [
    { at: '2026-09-10T10:00:00', type: 'Поповнення брокерського рахунку', debit: 10_000 },
    { at: '2026-09-10T10:05:00', type: 'Купівля 300 сертифікатів', fund: 'Inzhur REIT', credit: 3000 },
    { at: '2026-09-10T10:06:00', type: 'Купівля 2 сертифікатів', fund: 'Inzhur Energy', credit: 2000 },
    { at: '2026-10-15T12:00:00', type: 'Нарахування дивідендів', fund: 'Inzhur REIT', debit: 200 },
    { at: '2026-10-15T12:00:05', type: 'Сплата податку', fund: 'Inzhur REIT', credit: 36 }
];

const toSerial = localTime => Date.parse(`${localTime}Z`) / MILLISECONDS_PER_DAY + EXCEL_EPOCH_OFFSET_DAYS;

const newestFirst = [...rows].sort((left, right) => right.at.localeCompare(left.at));
const sheet = utils.aoa_to_sheet([
    HEADER,
    ...newestFirst.map(row => [toSerial(row.at), row.type, row.fund ?? '-', row.debit ?? '', row.credit ?? ''])
]);
const workbook = utils.book_new();

utils.book_append_sheet(workbook, sheet, SHEET_NAME);
mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
writeFileSync(OUTPUT_FILE, write(workbook, { type: 'buffer', bookType: 'xlsx' }));

const sum = (key, filter = () => true) => rows.filter(filter).reduce((total, row) => total + (row[key] ?? 0), 0);

console.log(`wrote ${OUTPUT_FILE.pathname}`);
console.log(`expected cash ${sum('debit') - sum('credit')}`);
console.log('expected holdings 300 certificates Inzhur REIT, 2 certificates Inzhur Energy');
