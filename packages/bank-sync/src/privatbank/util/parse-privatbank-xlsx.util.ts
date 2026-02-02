import { read, utils } from 'xlsx';

import { isNotEmptyArray } from '@rnw-community/shared';

import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankSyncErrorCodeEnum } from '../../core/enum/bank-sync-error-code.enum';
import { BankSyncError } from '../../core/error/bank-sync.error';
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

const createParseError = (message: string, originalError?: unknown): BankSyncError =>
    new BankSyncError(BankSyncErrorCodeEnum.INVALID_RESPONSE, message, BankProviderEnum.PRIVATBANK, originalError);

const parsePrivatbankDate = (dateString: string): Date => {
    const [datePart, timePart] = dateString.split(' ');

    if (!datePart || !timePart) {
        throw createParseError(`Invalid Privatbank date format: "${dateString}"`);
    }

    const [day, month, year] = datePart.split('.');
    const [hours, minutes, seconds] = timePart.split(':');

    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds));

    if (isNaN(date.getTime())) {
        throw createParseError(`Failed to parse Privatbank date: "${dateString}"`);
    }

    return date;
};

const mapRawRowToPrivatbankRow = (row: unknown[]): PrivatbankRowInterface => ({
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
});

const extractDataRows = (buffer: Uint8Array): unknown[][] => {
    const workbook = read(buffer, { type: 'buffer' });
    const [firstSheetName] = workbook.SheetNames;

    if (!firstSheetName) {
        throw createParseError('Privatbank XLSX file contains no sheets');
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows: unknown[][] = utils.sheet_to_json(sheet, { header: 1 });
    const dataRows = rawRows.slice(PRIVATBANK_DATA_START_ROW_INDEX);

    if (!isNotEmptyArray(dataRows)) {
        throw createParseError('Privatbank XLSX file contains no data rows');
    }

    return dataRows;
};

export const parsePrivatbankXlsx = (buffer: Uint8Array): PrivatbankRowInterface[] => {
    try {
        return extractDataRows(buffer).map(mapRawRowToPrivatbankRow);
    } catch (error) {
        if (error instanceof BankSyncError) {
            throw error;
        }

        throw createParseError('Failed to parse Privatbank XLSX file', error);
    }
};
