import { parseWiseCsv, SyncTransactionTypeEnum } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { readWiseStatement, WISE_STATEMENT } from '../../harness/enable-banking/wise-fixture';

const parseStatement = (text: string) => Effect.fromResult(parseWiseCsv(text));

const summarize = (text: string) =>
    Effect.map(parseStatement(text), transactionsByCurrency =>
        [...transactionsByCurrency.values()]
            .flat()
            .map(({ id, type, amount, description, time }) => [id, type, amount, description, new Date(time * 1000).toISOString()])
    );

describe('enable-banking/wise-csv-parser', () => {
    it.effect('maps every EUR row one to one, keeping fee rows separate and the conversion leg id unique per currency', () =>
        Effect.gen(function* () {
            const rows = yield* summarize(readWiseStatement(WISE_STATEMENT.EUR));

            expect(rows).toEqual([
                ['CARD-1000008', SyncTransactionTypeEnum.EXPENSE, 4, 'Example Cafe', '2023-03-17T09:00:00.000Z'],
                ['BALANCE-1000005:in', SyncTransactionTypeEnum.INCOME, 92, 'Converted 100.00 USD to 92.00 EUR', '2023-02-10T12:00:00.000Z'],
                ['FEE-TRANSFER-1000003', SyncTransactionTypeEnum.EXPENSE, 0.6, 'Alex Example', '2023-01-20T08:30:00.000Z'],
                ['TRANSFER-1000003', SyncTransactionTypeEnum.EXPENSE, 50, 'Alex Example', '2023-01-20T08:30:00.000Z'],
                ['CARD-1000002', SyncTransactionTypeEnum.INCOME, 12.5, 'Example Shop', '2022-12-05T10:15:00.000Z'],
                ['CARD-1000011', SyncTransactionTypeEnum.EXPENSE, 12.5, 'Example Shop', '2022-11-15T18:45:00.000Z'],
                ['TRANSFER-1000001', SyncTransactionTypeEnum.INCOME, 500, 'Alex Example', '2022-11-01T07:00:00.000Z']
            ]);
        })
    );

    it.effect('maps the USD conversion debit and its fee as two expenses', () =>
        Effect.gen(function* () {
            const rows = yield* summarize(readWiseStatement(WISE_STATEMENT.USD));

            expect(rows.map(([id, type, amount]) => [id, type, amount])).toEqual([
                ['CARD-1000012', SyncTransactionTypeEnum.EXPENSE, 3],
                ['FEE-BALANCE-1000005', SyncTransactionTypeEnum.EXPENSE, 1.5],
                ['BALANCE-1000005:out', SyncTransactionTypeEnum.EXPENSE, 100],
                ['TRANSFER-1000004', SyncTransactionTypeEnum.INCOME, 300]
            ]);
        })
    );

    it.effect('reads a header-only file and a file with a byte order mark', () =>
        Effect.gen(function* () {
            const headerOnly = yield* parseStatement(readWiseStatement(WISE_STATEMENT.HEADER_ONLY));
            const withBom = yield* parseStatement(`﻿${readWiseStatement(WISE_STATEMENT.GBP)}`);

            expect(headerOnly.size).toBe(0);
            expect([...withBom.keys()]).toEqual(['GBP']);
        })
    );

    it.effect('rejects a CSV without the Wise header and a row with a malformed amount', () =>
        Effect.gen(function* () {
            const wrongHeader = yield* Effect.flip(parseStatement('Date,Amount\n01-01-2023,1.00\n'));
            const malformedAmount = yield* Effect.flip(parseStatement(readWiseStatement(WISE_STATEMENT.GBP).replace('-8.00', 'eight')));

            expect(wrongHeader).toContain('Not a Wise statement');
            expect(malformedAmount).toContain('CARD-1000020');
        })
    );

    it.effect.each(['00-00-2023 13:00:00.000', '31-02-2023 13:00:00.000', '05-01-2023 24:00:00.000'])(
        'rejects a row whose Date Time %s is not on the calendar',
        dateTime =>
            Effect.gen(function* () {
                const error = yield* Effect.flip(
                    parseStatement(readWiseStatement(WISE_STATEMENT.GBP).replace('05-01-2023 13:00:00.000', dateTime))
                );

                expect(error).toContain('CARD-1000020');
            })
    );
});
