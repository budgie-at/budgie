import * as Effect from 'effect/Effect';
import { read, utils } from 'xlsx';

import { getErrorMessage, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncInvalidResponseError } from '../../core/error/sync-invalid-response.error';

import type { PrivatbankRowInterface } from '../interface/privatbank-row.interface';

const DATA_START_ROW_INDEX = 2;

const MARCH_MONTH_INDEX = 2;
const OCTOBER_MONTH_INDEX = 9;
const KYIV_DST_SWITCH_UTC_HOUR = 1;
const KYIV_STANDARD_OFFSET_MILLISECONDS = 2 * 60 * 60 * 1000;
const KYIV_DAYLIGHT_SAVING_OFFSET_MILLISECONDS = 3 * 60 * 60 * 1000;

const findLastSundayUtc = (year: number, monthIndex: number): number => {
    const lastDayOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0));

    return Date.UTC(year, monthIndex, lastDayOfMonth.getUTCDate() - lastDayOfMonth.getUTCDay(), KYIV_DST_SWITCH_UTC_HOUR);
};

const resolveKyivUtcOffsetMilliseconds = (wallClockTime: number, year: number): number => {
    const daylightSavingCandidate = wallClockTime - KYIV_DAYLIGHT_SAVING_OFFSET_MILLISECONDS;

    return daylightSavingCandidate >= findLastSundayUtc(year, MARCH_MONTH_INDEX) &&
        daylightSavingCandidate < findLastSundayUtc(year, OCTOBER_MONTH_INDEX)
        ? KYIV_DAYLIGHT_SAVING_OFFSET_MILLISECONDS
        : KYIV_STANDARD_OFFSET_MILLISECONDS;
};

const createParseError = (message: string): SyncInvalidResponseError =>
    SyncInvalidResponseError.make({ provider: SyncProviderEnum.PRIVATBANK, message });

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

const mapRawRowToPrivatbankRow = ([
    rawDate,
    category,
    card,
    description,
    cardAmount,
    cardCurrency,
    operationAmount,
    operationCurrency,
    endBalance,
    balanceCurrency
]: unknown[]): Effect.Effect<PrivatbankRowInterface, SyncInvalidResponseError> =>
    Effect.map(parsePrivatbankDates(String(rawDate)), dates => ({
        rawDate: String(rawDate),
        ...dates,
        category: String(category),
        card: String(card),
        description: String(description),
        cardAmount: Number(cardAmount),
        cardCurrency: String(cardCurrency),
        operationAmount: Number(operationAmount),
        operationCurrency: String(operationCurrency),
        endBalance: Number(endBalance),
        balanceCurrency: String(balanceCurrency)
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
    const dataRows = rawRows.slice(DATA_START_ROW_INDEX);

    if (!isNotEmptyArray(dataRows)) {
        return yield* createParseError('Privatbank XLSX file contains no data rows');
    }

    return yield* Effect.forEach(dataRows, mapRawRowToPrivatbankRow);
});
