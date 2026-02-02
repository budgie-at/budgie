import { read, utils } from 'xlsx';

import {
    PRIVATBANK_BALANCE_CURRENCY_COLUMN_INDEX,
    PRIVATBANK_CARD_AMOUNT_COLUMN_INDEX,
    PRIVATBANK_CARD_COLUMN_INDEX,
    PRIVATBANK_CARD_CURRENCY_COLUMN_INDEX,
    PRIVATBANK_CATEGORY_COLUMN_INDEX,
    PRIVATBANK_DATA_START_ROW_INDEX,
    PRIVATBANK_DATE_COLUMN_INDEX,
    PRIVATBANK_DESCRIPTION_COLUMN_INDEX,
    PRIVATBANK_END_BALANCE_COLUMN_INDEX,
    PRIVATBANK_OPERATION_AMOUNT_COLUMN_INDEX,
    PRIVATBANK_OPERATION_CURRENCY_COLUMN_INDEX
} from '../constant/privatbank.constant';

import type { PrivatbankRowInterface } from '../interface/privatbank-row.interface';

const parsePrivatbankDate = (dateString: string): Date => {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('.');
    const [hours, minutes, seconds] = timePart.split(':');

    return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds));
};

export const parsePrivatbankXlsx = (buffer: ArrayBuffer): PrivatbankRowInterface[] => {
    const workbook = read(buffer, { type: 'array' });
    const [firstSheetName] = workbook.SheetNames;
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows: unknown[][] = utils.sheet_to_json(sheet, { header: 1 });

    return rawRows.slice(PRIVATBANK_DATA_START_ROW_INDEX).map(
        (row): PrivatbankRowInterface => ({
            date: parsePrivatbankDate(String(row[PRIVATBANK_DATE_COLUMN_INDEX])),
            category: String(row[PRIVATBANK_CATEGORY_COLUMN_INDEX]),
            card: String(row[PRIVATBANK_CARD_COLUMN_INDEX]),
            description: String(row[PRIVATBANK_DESCRIPTION_COLUMN_INDEX]),
            cardAmount: Number(row[PRIVATBANK_CARD_AMOUNT_COLUMN_INDEX]),
            cardCurrency: String(row[PRIVATBANK_CARD_CURRENCY_COLUMN_INDEX]),
            operationAmount: Number(row[PRIVATBANK_OPERATION_AMOUNT_COLUMN_INDEX]),
            operationCurrency: String(row[PRIVATBANK_OPERATION_CURRENCY_COLUMN_INDEX]),
            endBalance: Number(row[PRIVATBANK_END_BALANCE_COLUMN_INDEX]),
            balanceCurrency: String(row[PRIVATBANK_BALANCE_CURRENCY_COLUMN_INDEX])
        })
    );
};
