import { AccountRepository } from '@budgie/contracts';
import { PrivatbankFileClient } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, TestLayer } from '../../harness';
import {
    buildOwnCardRow,
    buildOwnCardStatementClient,
    makeOwnCardStatementService
} from '../../harness/file-sync/privatbank-own-card-statement';

import type { FileBasedSyncClientInterface, PrivatbankRowInterface } from '@budgie/sync';

const CARD = '5168 **** **** 9174';
const STATEMENT_URI = 'privatbank-statement.xlsx';
const FIRST_OUTFLOW_AT = new Date('2026-09-01T09:00:00.000Z');
const SECOND_OUTFLOW_AT = new Date('2026-09-02T09:00:00.000Z');

const buildRow = (cardAmount: number, endBalance: number, operatedAt: Date): PrivatbankRowInterface => ({
    ...buildOwnCardRow(CARD, cardAmount, `Покупка ${cardAmount}`, operatedAt),
    endBalance
});

const firstOutflow = buildRow(-100, 200, FIRST_OUTFLOW_AT);
const secondOutflow = buildRow(-200, 0, SECOND_OUTFLOW_AT);

const importStatement = (client: FileBasedSyncClientInterface) =>
    Effect.gen(function* () {
        const service = yield* makeOwnCardStatementService(client);

        yield* service.executeImportForSelectedAccounts(STATEMENT_URI, [CARD]);
        const [account] = yield* (yield* AccountRepository).findByExternalIds([CARD]);

        return account.id;
    });

describe('privatbank/statement-balance-reconciliation', () => {
    it.effect('ends an outflow-only card at the statement balance', () =>
        Effect.gen(function* () {
            const accountId = yield* importStatement(new PrivatbankFileClient([secondOutflow, firstOutflow]));

            expect(yield* fetchAccountBalance(accountId)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the newer statement balance when an older statement is imported later', () =>
        Effect.gen(function* () {
            yield* importStatement(new PrivatbankFileClient([secondOutflow]));
            const accountId = yield* importStatement(new PrivatbankFileClient([firstOutflow]));

            expect(yield* fetchAccountBalance(accountId)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('takes the latest booked balance among rows of the same second regardless of file order', () =>
        Effect.gen(function* () {
            const bookedFirst = buildRow(-30, 150, SECOND_OUTFLOW_AT);
            const bookedLast = buildRow(-50, 100, SECOND_OUTFLOW_AT);
            const accountId = yield* importStatement(new PrivatbankFileClient([bookedFirst, bookedLast]));

            expect(yield* fetchAccountBalance(accountId)).toBe(100_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reconciles a re-imported statement that brings no new rows', () =>
        Effect.gen(function* () {
            const rows = [secondOutflow, firstOutflow];
            const accountId = yield* importStatement(buildOwnCardStatementClient(rows));

            expect(yield* fetchAccountBalance(accountId)).toBe(-300_000_000);

            yield* importStatement(new PrivatbankFileClient(rows));

            expect(yield* fetchAccountBalance(accountId)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores a balance in another currency', () =>
        Effect.gen(function* () {
            const accountId = yield* importStatement(new PrivatbankFileClient([{ ...secondOutflow, balanceCurrency: 'USD' }]));

            expect(yield* fetchAccountBalance(accountId)).toBe(-200_000_000);
        }).pipe(Effect.provide(TestLayer))
    );
});
