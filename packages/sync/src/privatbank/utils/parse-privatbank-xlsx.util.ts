import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { read, utils } from 'xlsx';

import { getErrorMessage, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncInvalidResponseError } from '../../core/error/sync-invalid-response.error';

import type { PrivatbankRowInterface } from '../interface/privatbank-row.interface';

const DATA_START_ROW_INDEX = 2;

const createParseError = (message: string): SyncInvalidResponseError =>
    new SyncInvalidResponseError({ provider: SyncProviderEnum.PRIVATBANK, message });

const parsePrivatbankDates = (
    dateString: string
): Effect.Effect<Pick<PrivatbankRowInterface, 'date' | 'deviceLocalDate'>, SyncInvalidResponseError> => {
    const [datePart, timePart] = dateString.split(' ');

    if (!isNotEmptyString(datePart) || !isNotEmptyString(timePart)) {
        return Effect.fail(createParseError(`Invalid Privatbank date format: "${dateString}"`));
    }

    const [day, month, year] = datePart.split('.').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    return Option.match(
        DateTime.makeZoned(
            { year, month, day, hour: hours, minute: minutes, second: seconds },
            { timeZone: 'Europe/Kyiv', adjustForTimeZone: true }
        ),
        {
            onNone: () => Effect.fail(createParseError(`Failed to parse Privatbank date: "${dateString}"`)),
            onSome: zonedDate =>
                Effect.succeed({
                    date: DateTime.toDateUtc(zonedDate),
                    deviceLocalDate: new Date(year, month - 1, day, hours, minutes, seconds)
                })
        }
    );
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
