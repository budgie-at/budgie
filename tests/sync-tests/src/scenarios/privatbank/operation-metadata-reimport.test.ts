import { CurrencyEnum, ExternalSourceEnum, PRECISION, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { PrivatbankFileClient } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { fetchExpenseEntries, makeStubFileBankSyncService, requireInstrument, seed, testDb, TestLayer } from '../../harness';

import type { PrivatbankRowInterface } from '@budgie/sync';

const FUNDING_AMOUNT = 45_000;
const EDITED_FUNDING_AMOUNT = 40_000;

const buildDepositRow = (): PrivatbankRowInterface => ({
    rawDate: '02.06.2026 15:00:00',
    date: new Date('2026-06-02T12:00:00.000Z'),
    deviceLocalDate: new Date('2026-06-02T12:00:00.000Z'),
    category: '',
    card: '4731 **** **** 9876',
    description: 'Opening term deposit',
    cardAmount: -FUNDING_AMOUNT,
    cardCurrency: 'UAH',
    operationAmount: -1000,
    operationCurrency: 'EUR',
    endBalance: 0,
    balanceCurrency: 'UAH'
});

const importDepositStatement = (operationCurrencyCode?: number) =>
    Effect.gen(function* () {
        const client = new PrivatbankFileClient([buildDepositRow()]);
        const syncService = yield* makeStubFileBankSyncService(ExternalSourceEnum.PRIVATBANK, {
            getAccounts: () => client.getAccounts(),
            getTransactions: accountId =>
                client.getTransactions(accountId).map(transaction => {
                    const { operationCurrencyCode: originalCurrencyCode, ...legacyTransaction } = transaction;

                    return operationCurrencyCode === originalCurrencyCode
                        ? transaction
                        : { ...legacyTransaction, ...(isDefined(operationCurrencyCode) && { operationCurrencyCode }) };
                })
        });

        yield* syncService.executeImportForSelectedAccounts('deposit-statement.xlsx', [buildDepositRow().card]);

        const [transaction] = yield* testDb.select().from(TransactionEntityTable);

        return transaction;
    });

describe('privatbank/operation-metadata-reimport', () => {
    it.effect.each([false, true])('retains operation currency after reimport with legacy metadata missing=%s', legacy =>
        Effect.gen(function* () {
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const transaction = yield* importDepositStatement(978);
            const [entry] = yield* fetchExpenseEntries(transaction.id);

            expect(entry).toMatchObject({ operationInstrumentId: euro.id, operationAmount: 1000 * PRECISION });

            if (legacy) {
                yield* testDb
                    .update(TransactionEntryEntityTable)
                    .set({ operationInstrumentId: null, operationAmount: null })
                    .where(eq(TransactionEntryEntityTable.id, entry.id));
                yield* testDb
                    .update(TransactionEntityTable)
                    .set({ importFingerprint: null })
                    .where(eq(TransactionEntityTable.id, transaction.id));
            }

            yield* importDepositStatement(978);
            yield* importDepositStatement(978);

            const [refreshed] = yield* fetchExpenseEntries(transaction.id);

            expect(refreshed).toMatchObject({
                amount: FUNDING_AMOUNT * PRECISION,
                operationInstrumentId: euro.id,
                operationAmount: 1000 * PRECISION
            });
            expect(yield* testDb.select().from(TransactionEntityTable)).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([undefined, 840, 999])('refreshes a matched file entry with operation currency %s', operationCurrencyCode =>
        Effect.gen(function* () {
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const dollar = yield* requireInstrument(CurrencyEnum.USD);
            const transaction = yield* importDepositStatement(978);
            yield* testDb
                .update(TransactionEntityTable)
                .set({ importFingerprint: null })
                .where(eq(TransactionEntityTable.id, transaction.id));

            yield* importDepositStatement(operationCurrencyCode);

            const [refreshed] = yield* fetchExpenseEntries(transaction.id);
            const expectedInstrumentId = !isDefined(operationCurrencyCode) ? euro.id : dollar.id;

            expect(refreshed.amount).toBe(FUNDING_AMOUNT * PRECISION);
            expect(refreshed.operationInstrumentId).toBe(operationCurrencyCode === 999 ? null : expectedInstrumentId);
            expect(refreshed.operationAmount).toBe(operationCurrencyCode === 999 ? null : 1000 * PRECISION);
            expect(yield* testDb.select().from(TransactionEntityTable)).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not backfill operation metadata for a retained user-edited amount', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const transaction = yield* importDepositStatement(978);
            const [entry] = yield* fetchExpenseEntries(transaction.id);
            const category = yield* seed.category('Funding');

            yield* transactionService.updateById(transaction.id, {
                tagIds: [],
                entries: [
                    {
                        accountId: entry.accountId,
                        amount: EDITED_FUNDING_AMOUNT,
                        categoryId: category.id,
                        mccCategoryId: null,
                        type: entry.type,
                        kind: entry.kind,
                        externalId: entry.externalId
                    }
                ]
            });
            yield* importDepositStatement(978);

            const [refreshed] = yield* fetchExpenseEntries(transaction.id);

            expect(refreshed.amount).toBe(EDITED_FUNDING_AMOUNT * PRECISION);
            expect(refreshed.operationInstrumentId).toBeNull();
            expect(refreshed.operationAmount).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});
