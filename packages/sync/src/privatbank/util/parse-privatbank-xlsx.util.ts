import * as Effect from 'effect/Effect';
import { read, utils } from 'xlsx';

import { getErrorMessage, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncInvalidResponseError } from '../../core/error/sync-invalid-response.error';
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

const createParseError = (message: string): SyncInvalidResponseError =>
    new SyncInvalidResponseError({ provider: SyncProviderEnum.PRIVATBANK, message });

const parsePrivatbankDate = (dateString: string): Effect.Effect<Date, SyncInvalidResponseError> => {
    const [datePart, timePart] = dateString.split(' ');

    if (!isNotEmptyString(datePart) || !isNotEmptyString(timePart)) {
        return Effect.fail(createParseError(`Invalid Privatbank date format: "${dateString}"`));
    }

    const [day, month, year] = datePart.split('.');
    const [hours, minutes, seconds] = timePart.split(':');
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds));

    return Number.isNaN(date.getTime())
        ? Effect.fail(createParseError(`Failed to parse Privatbank date: "${dateString}"`))
        : Effect.succeed(date);
};

const mapRawRowToPrivatbankRow = (row: unknown[]): Effect.Effect<PrivatbankRowInterface, SyncInvalidResponseError> =>
    Effect.map(parsePrivatbankDate(String(row[PRIVATBANK_DATE_COLUMN_INDEX])), date => ({
        rawDate: String(row[PRIVATBANK_DATE_COLUMN_INDEX]),
        date,
        category: String(row[PRIVATBANK_CATEGORY_COLUMN_INDEX]),
        card: String(row[PRIVATBANK_CARD_COLUMN_INDEX]),
        description: String(row[PRIVATBANK_DESCRIPTION_COLUMN_INDEX]),
        cardAmount: Number(row[PRIVATBANK_CARD_AMOUNT_COLUMN_INDEX]),
        cardCurrency: String(row[PRIVATBANK_CARD_CURRENCY_COLUMN_INDEX]),
        operationAmount: Number(row[PRIVATBANK_OPERATION_AMOUNT_COLUMN_INDEX]),
        operationCurrency: String(row[PRIVATBANK_OPERATION_CURRENCY_COLUMN_INDEX]),
        endBalance: Number(row[PRIVATBANK_END_BALANCE_COLUMN_INDEX]),
        balanceCurrency: String(row[PRIVATBANK_BALANCE_CURRENCY_COLUMN_INDEX])
    }));

export const parsePrivatbankXlsx = Effect.fn('parsePrivatbankXlsx')(function* (buffer: Uint8Array) {
    const workbook = yield* Effect.try({
        try: () => read(buffer, { type: 'buffer' }),
        catch: error => createParseError(`Failed to parse Privatbank XLSX file: ${getErrorMessage(error)}`)
    });
    const [firstSheetName] = workbook.SheetNames;

    if (!isNotEmptyString(firstSheetName)) {
        return yield* createParseError('Privatbank XLSX file contains no sheets');
    }

    const rawRows: unknown[][] = utils.sheet_to_json(workbook.Sheets[firstSheetName], { header: 1 });
    const dataRows = rawRows.slice(PRIVATBANK_DATA_START_ROW_INDEX);

    if (!isNotEmptyArray(dataRows)) {
        return yield* createParseError('Privatbank XLSX file contains no data rows');
    }

    return yield* Effect.forEach(dataRows, mapRawRowToPrivatbankRow);
});
