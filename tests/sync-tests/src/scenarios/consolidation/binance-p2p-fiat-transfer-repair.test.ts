import {
    AccountEntityTable,
    AccountTypeEnum,
    ExternalSourceEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { getDefined } from '@rnw-community/shared';

import {
    P2P_OPERATED_AT,
    P2P_UAH_TOTAL,
    P2P_USDT_AMOUNT,
    fetchTransactionById,
    seed,
    seedBankPair,
    seedP2pFiatTransferFixture,
    seedP2pIncome,
    testDb,
    TestLayer,
    expectParentedToCanonical
} from '../../harness';

const REPAIR_PRIMARY_AMOUNT = 3_500 * PRECISION;
const REPAIR_EXTRA_AMOUNT = 500 * PRECISION;
const REPAIR_WRONG_AMOUNT = REPAIR_PRIMARY_AMOUNT + REPAIR_EXTRA_AMOUNT;
const REPAIR_SCOPE_WINDOW_MS = 60_000;

const backfillP2pQuote = (quotedInstrumentId: number, incomeTransactionId: number) =>
    Effect.gen(function* () {
        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({
                quotedInstrumentId,
                quotedAmount: REPAIR_PRIMARY_AMOUNT,
                quotedUnitPrice: 35 * PRECISION
            })
            .where(eq(TransactionEntryEntityTable.originalTransactionId, incomeTransactionId));
    });

const seedWrongP2pRepairScenario = (externalIdPrefix: string, bankAccountId: number, binanceAccountId: number) =>
    Effect.gen(function* () {
        const wrongExpense = yield* seedBankPair.expense(
            { externalId: `mono-uah-repair-${externalIdPrefix}-wrong`, operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccountId, amount: REPAIR_WRONG_AMOUNT }
        );
        const correctExpense = yield* seedBankPair.expense(
            { externalId: `mono-uah-repair-${externalIdPrefix}-correct`, operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccountId, amount: REPAIR_PRIMARY_AMOUNT }
        );
        const income = yield* seedP2pIncome(`binance:c2c:buy-repair-${externalIdPrefix}`, binanceAccountId);

        return { wrongExpense, correctExpense, income };
    });

const consolidateWrongP2pRepairScenario = Effect.fnUntraced(function* (wrongExpenseId: number, incomeTransactionId: number) {
    const transferConsolidationService = yield* TransferConsolidationService;

    expect((yield* transferConsolidationService.consolidate(null)).consolidated).toBe(1);

    const canonicalId = getDefined((yield* fetchTransactionById(incomeTransactionId)).consolidationParentTransactionId, () => {
        throw new Error('Expected heuristic P2P canonical id');
    });

    expect((yield* fetchTransactionById(wrongExpenseId)).consolidationParentTransactionId).toBe(canonicalId);

    return canonicalId;
});

const consolidateP2pRepairWithScope = Effect.fnUntraced(function* (transactionIds: readonly number[]) {
    const transferConsolidationService = yield* TransferConsolidationService;

    return yield* transferConsolidationService.consolidate({
        operatedAtFrom: new Date(P2P_OPERATED_AT.getTime() - REPAIR_SCOPE_WINDOW_MS),
        operatedAtTo: new Date(P2P_OPERATED_AT.getTime() + REPAIR_SCOPE_WINDOW_MS),
        transactionIds
    });
});

const backfillAndConsolidateScopedP2pRepair = Effect.fnUntraced(function* (
    quotedInstrumentId: number,
    incomeTransactionId: number,
    transactionIds: readonly number[]
) {
    yield* backfillP2pQuote(quotedInstrumentId, incomeTransactionId);

    return yield* consolidateP2pRepairWithScope(transactionIds);
});

const expectExpenseRepaired = (correctExpenseId: number, wrongExpenseId: number, incomeId: number) =>
    Effect.gen(function* () {
        expect((yield* fetchTransactionById(correctExpenseId)).consolidationParentTransactionId).toBe(
            (yield* fetchTransactionById(incomeId)).consolidationParentTransactionId
        );
        expect((yield* fetchTransactionById(wrongExpenseId)).consolidationParentTransactionId).toBeNull();
    });

describe('consolidation/binance-p2p-fiat-transfer authoritative repair', () => {
    it.effect('repairs a system-generated group after provider fiat data is backfilled', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { uah, bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const primaryExpense = yield* seedBankPair.expense(
                { externalId: 'mono-uah-repair-primary', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: REPAIR_PRIMARY_AMOUNT }
            );
            const extraExpense = yield* seedBankPair.expense(
                { externalId: 'mono-uah-repair-extra', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: REPAIR_EXTRA_AMOUNT }
            );
            const income = yield* seedP2pIncome('binance:c2c:buy-repair', binanceAccount.id);

            expect((yield* transferConsolidationService.consolidate(null)).consolidated).toBe(1);
            expect((yield* fetchTransactionById(extraExpense.id)).consolidationParentTransactionId).not.toBeNull();

            yield* backfillP2pQuote(uah.id, income.id);

            expect((yield* transferConsolidationService.consolidate(null)).consolidated).toBe(1);
            expect((yield* fetchTransactionById(primaryExpense.id)).consolidationParentTransactionId).toBe(
                (yield* fetchTransactionById(income.id)).consolidationParentTransactionId
            );
            expect((yield* fetchTransactionById(extraExpense.id)).consolidationParentTransactionId).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('repairs a system-generated 1:1 heuristic match after provider fiat data is backfilled', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { uah, bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const { wrongExpense, correctExpense, income } = yield* seedWrongP2pRepairScenario('1-to-1', bankAccount.id, binanceAccount.id);

            yield* consolidateWrongP2pRepairScenario(wrongExpense.id, income.id);
            expect((yield* fetchTransactionById(correctExpense.id)).consolidationParentTransactionId).toBeNull();

            yield* backfillP2pQuote(uah.id, income.id);

            expect((yield* transferConsolidationService.consolidate(null)).consolidated).toBe(1);
            yield* expectExpenseRepaired(correctExpense.id, wrongExpense.id, income.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('preserves a user-edited 1:1 heuristic match after provider fiat data is backfilled', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { uah, bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const { wrongExpense, correctExpense, income } = yield* seedWrongP2pRepairScenario(
                'user-1-to-1',
                bankAccount.id,
                binanceAccount.id
            );
            const canonicalId = yield* consolidateWrongP2pRepairScenario(wrongExpense.id, income.id);

            yield* testDb
                .update(TransactionEntityTable)
                .set({ updatedBy: TransactionUpdatedByEnum.USER })
                .where(eq(TransactionEntityTable.id, canonicalId));
            yield* backfillP2pQuote(uah.id, income.id);

            expect((yield* transferConsolidationService.consolidate(null)).consolidated).toBe(0);
            yield* expectParentedToCanonical(canonicalId, [wrongExpense.id, income.id]);
            expect((yield* fetchTransactionById(correctExpense.id)).consolidationParentTransactionId).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('consolidation/binance-p2p-fiat-transfer existing source scope', () => {
    it.effect('does not repair a same-window canonical whose source ids are out of scoped scan ids', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { uah, bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const historicalPrimaryExpense = yield* seedBankPair.expense(
                { externalId: 'mono-uah-repair-scoped-primary', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: REPAIR_PRIMARY_AMOUNT }
            );
            const historicalExtraExpense = yield* seedBankPair.expense(
                { externalId: 'mono-uah-repair-scoped-extra', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: REPAIR_EXTRA_AMOUNT }
            );
            const historicalIncome = yield* seedP2pIncome('binance:c2c:buy-repair-scoped', binanceAccount.id);

            expect((yield* transferConsolidationService.consolidate(null)).consolidated).toBe(1);
            expect((yield* fetchTransactionById(historicalExtraExpense.id)).consolidationParentTransactionId).not.toBeNull();

            const historicalCanonicalId = getDefined(
                (yield* fetchTransactionById(historicalIncome.id)).consolidationParentTransactionId,
                () => {
                    throw new Error('Expected historical P2P canonical id');
                }
            );

            yield* backfillP2pQuote(uah.id, historicalIncome.id);

            const scopedExpense = yield* seedBankPair.expense(
                { externalId: 'mono-uah-repair-scoped-current-expense', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: P2P_UAH_TOTAL }
            );
            const scopedIncome = yield* seedBankPair.income(
                { externalId: 'binance:c2c:buy-repair-scoped-current-income', operatedAt: P2P_OPERATED_AT },
                { accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
            );

            expect(yield* consolidateP2pRepairWithScope([scopedExpense.id, scopedIncome.id])).toEqual({ found: 1, consolidated: 1 });
            yield* expectParentedToCanonical(historicalCanonicalId, [
                historicalPrimaryExpense.id,
                historicalExtraExpense.id,
                historicalIncome.id
            ]);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('consolidation/binance-p2p-fiat-transfer grouped source scope', () => {
    it.effect('does not repair a grouped canonical when only a separate replacement-like bank source id is scoped', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const { uah, bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const historicalPrimaryExpense = yield* seedBankPair.expense(
                { externalId: 'mono-uah-repair-grouped-source-primary', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: REPAIR_PRIMARY_AMOUNT }
            );
            const historicalExtraExpense = yield* seedBankPair.expense(
                { externalId: 'mono-uah-repair-grouped-source-extra', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: REPAIR_EXTRA_AMOUNT }
            );
            const historicalIncome = yield* seedP2pIncome('binance:c2c:buy-repair-grouped-source', binanceAccount.id);

            expect((yield* transferConsolidationService.consolidate(null)).consolidated).toBe(1);

            const historicalCanonicalId = getDefined(
                (yield* fetchTransactionById(historicalIncome.id)).consolidationParentTransactionId,
                () => {
                    throw new Error('Expected grouped repair canonical id');
                }
            );

            yield* backfillP2pQuote(uah.id, historicalIncome.id);

            const scopedReplacementLikeExpense = yield* seedBankPair.expense(
                { externalId: 'mono-uah-repair-grouped-source-unrelated-replacement', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: REPAIR_PRIMARY_AMOUNT }
            );
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([bankAccount.id]);

            expect(yield* consolidateP2pRepairWithScope([scopedReplacementLikeExpense.id])).toEqual({ found: 0, consolidated: 0 });
            yield* expectParentedToCanonical(historicalCanonicalId, [
                historicalPrimaryExpense.id,
                historicalExtraExpense.id,
                historicalIncome.id
            ]);
            expect((yield* fetchTransactionById(scopedReplacementLikeExpense.id)).consolidationParentTransactionId).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('consolidation/binance-p2p-fiat-transfer replacement source scope', () => {
    it.effect('repairs a system-generated 1:1 heuristic match when only the replacement bank source id is scoped', () =>
        Effect.gen(function* () {
            const { uah, bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const { wrongExpense, correctExpense, income } = yield* seedWrongP2pRepairScenario(
                'replacement-scope',
                bankAccount.id,
                binanceAccount.id
            );

            yield* consolidateWrongP2pRepairScenario(wrongExpense.id, income.id);

            expect(yield* backfillAndConsolidateScopedP2pRepair(uah.id, income.id, [correctExpense.id])).toEqual({
                found: 1,
                consolidated: 1
            });
            yield* expectExpenseRepaired(correctExpense.id, wrongExpense.id, income.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not repair a system-generated 1:1 heuristic match through an inactive replacement bank account', () =>
        Effect.gen(function* () {
            const { uah, bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const inactiveBankAccount = yield* seed.account({
                externalSource: ExternalSourceEnum.MONOBANK,
                instrumentId: uah.id,
                title: 'Inactive Monobank UAH',
                type: AccountTypeEnum.BANK_SYNC
            });
            const wrongExpense = yield* seedBankPair.expense(
                { externalId: 'mono-uah-repair-inactive-wrong', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: REPAIR_WRONG_AMOUNT }
            );
            const inactiveReplacementExpense = yield* seedBankPair.expense(
                { externalId: 'mono-uah-repair-inactive-correct', operatedAt: P2P_OPERATED_AT },
                { accountId: inactiveBankAccount.id, amount: REPAIR_PRIMARY_AMOUNT }
            );
            const income = yield* seedP2pIncome('binance:c2c:buy-repair-inactive', binanceAccount.id);

            yield* testDb.update(AccountEntityTable).set({ isActive: false }).where(eq(AccountEntityTable.id, inactiveBankAccount.id));

            const canonicalId = yield* consolidateWrongP2pRepairScenario(wrongExpense.id, income.id);

            expect(yield* backfillAndConsolidateScopedP2pRepair(uah.id, income.id, [income.id])).toEqual({
                found: 0,
                consolidated: 0
            });
            yield* expectParentedToCanonical(canonicalId, [wrongExpense.id, income.id]);
            expect((yield* fetchTransactionById(inactiveReplacementExpense.id)).consolidationParentTransactionId).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});
