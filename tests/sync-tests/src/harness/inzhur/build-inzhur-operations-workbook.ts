import { utils, write } from 'xlsx';

import type { InzhurOperationRowInterface } from './inzhur-operation-row.interface';

const SHEET_NAME = 'Виписка по операціям';
const HEADER = ['Дата', 'Тип операції', 'Вид цінного паперу', 'Дебет', 'Кредит'];
const MILLISECONDS_PER_DAY = 86_400_000;
const EXCEL_EPOCH_OFFSET_DAYS = 25_569;

const toSerial = (localTime: string) => Date.parse(`${localTime}Z`) / MILLISECONDS_PER_DAY + EXCEL_EPOCH_OFFSET_DAYS;

export const buildInzhurOperationsWorkbook = (rows: readonly InzhurOperationRowInterface[]): Uint8Array => {
    const newestFirst = [...rows].sort((left, right) => right.at.localeCompare(left.at));
    const sheet = utils.aoa_to_sheet([
        HEADER,
        ...newestFirst.map(row => [toSerial(row.at), row.type, row.fund ?? '-', row.debit ?? '', row.credit ?? ''])
    ]);
    const workbook = utils.book_new();

    utils.book_append_sheet(workbook, sheet, SHEET_NAME);

    const written: unknown = write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return written instanceof Uint8Array ? written : new Uint8Array();
};
