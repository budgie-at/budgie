import { PRECISION, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { consolidateInzhur } from '../../harness/inzhur/consolidate-inzhur';
import { fetchBankTransactions } from '../../harness/inzhur/fetch-bank-transactions';
import { fetchInzhurOperationsLedger } from '../../harness/inzhur/fetch-inzhur-operations-ledger';
import { importInzhurBankFlow } from '../../harness/inzhur/import-inzhur-bank-flow';
import { importInzhurBankTransaction } from '../../harness/inzhur/import-inzhur-bank-transaction';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { TOP_UP_DESCRIPTION, WITHDRAWAL_COMMENT, WITHDRAWAL_DESCRIPTION } from '../../harness/inzhur/inzhur-bank-descriptions.constant';
import { CASH_AFTER_HISTORY, FULL_HISTORY_ROWS, TOP_UP_AMOUNT, TOP_UP_TYPE } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';
import { seedInzhurReitPrices } from '../../harness/inzhur/seed-inzhur-reit-prices';

const URI = 'operations.xlsx';
const BANK_TOP_UP_AT = new Date('2026-01-11T08:00:00.000Z');
const BANK_WITHDRAWAL_AT = new Date('2026-03-21T08:00:00.000Z');
const UNCLAIMED_AT = new Date('2026-02-10T08:00:00.000Z');

const layer = makeInzhurOperationsLayer({ [URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS) });

const prepare = Effect.gen(function* () {
    yield* seedInzhurReitPrices;

    return yield* seedInzhurBankAccount;
});

const importBankTopUp = (bankAccountId: number) =>
    importInzhurBankTransaction(bankAccountId, 'bank-top-up', TOP_UP_DESCRIPTION, -TOP_UP_AMOUNT, BANK_TOP_UP_AT);

const importBankWithdrawal = (bankAccountId: number) =>
    importInzhurBankTransaction(bankAccountId, 'bank-withdrawal', WITHDRAWAL_DESCRIPTION, 500, BANK_WITHDRAWAL_AT, {
        comment: WITHDRAWAL_COMMENT
    });

describe('inzhur/operations-bank-pairing', () => {
    it.effect('pairs bank history that predates setup with the export rows into single transfers', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* importBankTopUp(bankAccount.id);
            yield* importBankWithdrawal(bankAccount.id);
            yield* consolidateInzhur;

            expect(yield* fetchBankTransactions()).toMatchObject([
                { type: TransactionTypeEnum.EXPENSE },
                { type: TransactionTypeEnum.INCOME }
            ]);

            const summary = yield* importInzhurOperations(URI);
            const { cashAccount } = yield* requireInzhurSetup();

            expect(summary).toMatchObject({ bankMatches: { paired: 2, unpaired: 0 }, unmatchedBankCount: 0 });
            expect((yield* fetchInzhurOperationsLedger).filter(({ title }) => title.endsWith('Inzhur'))).toEqual([]);
            expect(yield* fetchBankTransactions()).toMatchObject([
                { type: TransactionTypeEnum.TRANSFER, fromAccountId: bankAccount.id, toAccountId: cashAccount.id },
                { type: TransactionTypeEnum.TRANSFER, fromAccountId: cashAccount.id, toAccountId: bankAccount.id }
            ]);
            expect(yield* fetchAccountBalance(bankAccount.id)).toBe((500 - TOP_UP_AMOUNT) * PRECISION);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('keeps a placeholder for a row without a bank counterpart and counts a bank payment no row claimed', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* importBankTopUp(bankAccount.id);
            yield* importInzhurBankTransaction(bankAccount.id, 'unclaimed', TOP_UP_DESCRIPTION, -777, UNCLAIMED_AT);

            const summary = yield* importInzhurOperations(URI);
            const { cashAccount } = yield* requireInzhurSetup();
            const ledger = yield* fetchInzhurOperationsLedger;

            expect(summary).toMatchObject({ bankMatches: { paired: 1, unpaired: 1 }, unmatchedBankCount: 1 });
            expect(ledger.filter(({ title }) => title === 'Withdrawal from Inzhur')).toHaveLength(1);
            expect(ledger.filter(({ title }) => title === 'Top-up to Inzhur')).toEqual([]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe((CASH_AFTER_HISTORY + 777) * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('records an unmatched top-up as a one-sided transfer and pairs the bank row that arrives later', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* importInzhurOperations(URI);

            const { cashAccount } = yield* requireInzhurSetup();
            const unpaired = (yield* fetchInzhurOperationsLedger).filter(({ title }) => title === 'Top-up to Inzhur');

            expect(unpaired).toMatchObject([{ type: TransactionTypeEnum.TRANSFER, fromAccountId: null, toAccountId: cashAccount.id }]);

            yield* importBankTopUp(bankAccount.id);
            yield* consolidateInzhur;

            expect((yield* fetchInzhurOperationsLedger).filter(({ title }) => title === 'Top-up to Inzhur')).toEqual([]);
            expect(yield* fetchBankTransactions()).toMatchObject([
                { type: TransactionTypeEnum.TRANSFER, fromAccountId: bankAccount.id, toAccountId: cashAccount.id }
            ]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);

            const summary = yield* importInzhurOperations(URI);

            expect(summary).toMatchObject({ recordedCount: 0, bankMatches: { paired: 1, unpaired: 1 } });
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('pairs a later withdrawal row with its placeholder as well', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* importInzhurOperations(URI);

            const { cashAccount } = yield* requireInzhurSetup();

            yield* importBankWithdrawal(bankAccount.id);
            yield* consolidateInzhur;

            expect((yield* fetchInzhurOperationsLedger).filter(({ title }) => title === 'Withdrawal from Inzhur')).toEqual([]);
            expect(yield* fetchBankTransactions()).toMatchObject([
                { type: TransactionTypeEnum.TRANSFER, fromAccountId: cashAccount.id, toAccountId: bankAccount.id }
            ]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('keeps the placeholder when the bank row is outside the two day window', () =>
        Effect.gen(function* () {
            const bankAccount = yield* prepare;

            yield* importInzhurOperations(URI);

            const { cashAccount } = yield* requireInzhurSetup();

            yield* importInzhurBankFlow(
                bankAccount.id,
                'far-top-up',
                TOP_UP_DESCRIPTION,
                -TOP_UP_AMOUNT,
                new Date('2026-01-20T08:00:00.000Z')
            );

            expect((yield* fetchInzhurOperationsLedger).filter(({ title }) => title === 'Top-up to Inzhur')).toHaveLength(1);
            expect(yield* fetchBankTransactions()).toMatchObject([{ type: TransactionTypeEnum.TRANSFER, toAccountId: cashAccount.id }]);
        }).pipe(
            Effect.provide(
                makeInzhurOperationsLayer({
                    [URI]: buildInzhurOperationsWorkbook([
                        { at: '2026-01-10T10:00:00', type: TOP_UP_TYPE, debit: TOP_UP_AMOUNT },
                        ...FULL_HISTORY_ROWS.slice(1)
                    ])
                })
            )
        )
    );
});
