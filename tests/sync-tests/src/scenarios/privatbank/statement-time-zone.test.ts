import { parsePrivatbankXlsx } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { utils, write } from 'xlsx';

const STATEMENT_HEADER_ROWS = [['Історія операцій'], ['Дата', 'Категорія', 'Картка', 'Опис операції']];

const buildStatement = (rawDates: readonly string[]): Uint8Array => {
    const workbook = utils.book_new();
    const rows = rawDates.map(rawDate => [rawDate, 'Зарахування', '5523 **** **** 0356', 'Transfer', 100, 'UAH', 100, 'UAH', 0, 'UAH']);

    utils.book_append_sheet(workbook, utils.aoa_to_sheet([...STATEMENT_HEADER_ROWS, ...rows]), 'Statement');

    return new Uint8Array(write(workbook, { type: 'buffer', bookType: 'xlsx' }));
};

const parseStatementDates = (rawDates: readonly string[]) =>
    Effect.map(parsePrivatbankXlsx(buildStatement(rawDates)), rows => rows.map(row => row.date.toISOString()));

describe('privatbank/statement-time-zone', () => {
    it.effect('reads summer statement times as Kyiv summer time so a receipt never precedes its payment', () =>
        Effect.gen(function* () {
            expect(yield* parseStatementDates(['23.06.2026 16:29:26', '23.06.2026 13:54:22'])).toEqual([
                '2026-06-23T13:29:26.000Z',
                '2026-06-23T10:54:22.000Z'
            ]);
        })
    );

    it.effect('reads winter statement times as Kyiv standard time', () =>
        Effect.gen(function* () {
            expect(yield* parseStatementDates(['05.01.2026 14:50:14'])).toEqual(['2026-01-05T12:50:14.000Z']);
        })
    );

    it.effect('switches offsets at the Kyiv daylight saving boundaries', () =>
        Effect.gen(function* () {
            expect(
                yield* parseStatementDates(['29.03.2026 02:59:59', '29.03.2026 04:00:00', '25.10.2026 02:59:59', '25.10.2026 04:00:00'])
            ).toEqual(['2026-03-29T00:59:59.000Z', '2026-03-29T01:00:00.000Z', '2026-10-24T23:59:59.000Z', '2026-10-25T02:00:00.000Z']);
        })
    );

    it.effect('keeps the device-local reading of the wall clock for legacy external ids', () =>
        Effect.gen(function* () {
            const [row] = yield* parsePrivatbankXlsx(buildStatement(['23.06.2026 16:29:26']));

            expect(row.deviceLocalDate).toEqual(new Date(2026, 5, 23, 16, 29, 26));
        })
    );
});
