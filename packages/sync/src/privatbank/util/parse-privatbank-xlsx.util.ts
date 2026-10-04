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

const MARCH_MONTH_INDEX = 2;
const OCTOBER_MONTH_INDEX = 9;
const KYIV_DST_SWITCH_UTC_HOUR = 1;
const KYIV_STANDARD_OFFSET_MILLISECONDS = 2 * 60 * 60 * 1000;
const KYIV_DAYLIGHT_SAVING_OFFSET_MILLISECONDS = 3 * 60 * 60 * 1000;

const createParseError = (message: string): SyncInvalidResponseError =>
    new SyncInvalidResponseError({ provider: SyncProviderEnum.PRIVATBANK, message });

const findLastSundayUtc = (year: number, month: number): number => {
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

    return Date.UTC(year, month, lastDayOfMonth.getUTCDate() - lastDayOfMonth.getUTCDay(), KYIV_DST_SWITCH_UTC_HOUR);
};

const resolveKyivUtcOffsetMilliseconds = (wallClockTime: number, year: number): number => {
    const daylightSavingStart = findLastSundayUtc(year, MARCH_MONTH_INDEX);
    const daylightSavingEnd = findLastSundayUtc(year, OCTOBER_MONTH_INDEX);
    const daylightSavingCandidate = wallClockTime - KYIV_DAYLIGHT_SAVING_OFFSET_MILLISECONDS;

    return daylightSavingCandidate >= daylightSavingStart && daylightSavingCandidate < daylightSavingEnd
        ? KYIV_DAYLIGHT_SAVING_OFFSET_MILLISECONDS
        : KYIV_STANDARD_OFFSET_MILLISECONDS;
};

const parsePrivatbankDates = (
    dateString: string
): Effect.Effect<Pick<PrivatbankRowInterface, 'date' | 'deviceLocalDate'>, SyncInvalidResponseError> => {
    const [datePart, timePart] = dateString.split(' ');

    if (!isNotEmptyString(datePart) || !isNotEmptyString(timePart)) {
        return Effect.fail(createParseError(`Invalid Privatbank date format: "${dateString}"`));
    }

    const [day, month, year] = datePart.split('.').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    const wallClockTime = Date.UTC(year, month - 1, day, hours, minutes, seconds);
    const date = new Date(wallClockTime - resolveKyivUtcOffsetMilliseconds(wallClockTime, year));

    return Number.isNaN(date.getTime())
        ? Effect.fail(createParseError(`Failed to parse Privatbank date: "${dateString}"`))
        : Effect.succeed({ date, deviceLocalDate: new Date(year, month - 1, day, hours, minutes, seconds) });
};

const mapRawRowToPrivatbankRow = (row: unknown[]): Effect.Effect<PrivatbankRowInterface, SyncInvalidResponseError> =>
    Effect.map(parsePrivatbankDates(String(row[PRIVATBANK_DATE_COLUMN_INDEX])), dates => ({
        rawDate: String(row[PRIVATBANK_DATE_COLUMN_INDEX]),
        ...dates,
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
