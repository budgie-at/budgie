import {
    AccountTypeEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    PRECISION,
    StatisticsRepository,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { and, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { expectConsolidationParent, fetchLedgerBalances } from '../harness/consolidation-revert-audit';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const LEGACY_AMOUNT = 5943 * PRECISION;
const SYNCED_AMOUNT = Math.round(5870.2 * PRECISION);
const ATM_AMOUNT = Math.round(LEGACY_AMOUNT * 1.02);
const LEGACY_EUR_AMOUNT = 616 * PRECISION;
const OPERATED_AT = new Date('2025-10-21T10:00:00');

const seedLegacyCsvTransfer = (
    sourceInstrumentId: number,
    sourceAmount: number,
    isTargetActive: boolean,
    targetType = AccountTypeEnum.BANK
) =>
    Effect.gen(function* () {
        const legacySourceAccount = yield* testSeedService.account({
            title: 'monobank',
            type: AccountTypeEnum.BANK,
            instrumentId: sourceInstrumentId
        });
        const legacyTargetAccount = yield* testSeedService.account({ title: 'приватбанк UAH', type: targetType, isActive: isTargetActive });
        const syncedCardAccount = yield* testSeedService.bankSyncAccount('Monobank Black •3126', ExternalSourceEnum.MONOBANK, null);
        const legacyTransfer = yield* testSeedService.directTransfer({
            exchangeRate: sourceAmount / LEGACY_AMOUNT,
            operatedAt: OPERATED_AT,
            sourceAccountId: legacySourceAccount.id,
            sourceAmount,
            sourceEntryExchangeRate: 1,
            targetAccountId: legacyTargetAccount.id,
            targetAmount: LEGACY_AMOUNT,
            title: '',
            toIban: null
        });

        yield* testSeedService.updateTransaction(legacyTransfer.id, { externalSource: ExternalSourceEnum.CSV });
        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ deletedAt: new Date('2026-01-01') })
            .where(
                and(
                    eq(TransactionEntryEntityTable.transactionId, legacyTransfer.id),
                    eq(TransactionEntryEntityTable.accountId, legacySourceAccount.id)
                )
            );

        return { legacySourceAccount, legacyTargetAccount, legacyTransfer, syncedCardAccount };
    });

const fetchTotalExpense = Effect.fnUntraced(function* () {
    const statisticsRepository = yield* StatisticsRepository;

    return (yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, 1)).at(0)?.expense ?? 0;
});

const seedSyncedExpense = (accountId: number, amount: number, title: string, mcc = '4829') =>
    Effect.gen(function* () {
        const expense = yield* testSeedService.bankPairExpense(
            { externalId: `synced-${title}`, operatedAt: new Date(OPERATED_AT.getTime() + 14_000) },
            { accountId, amount, mccCategoryId: (yield* testQueryService.findMccByCode(mcc)).id }
        );

        return yield* testSeedService.updateTransaction(expense.id, { title });
    });

const expectExpenseLeftUnconsolidated = (expenseId: number) =>
    Effect.gen(function* () {
        expect(yield* runConsolidation()).toEqual({ consolidated: 0, found: 0 });
        expect((yield* testQueryService.fetchTransactionById(expenseId)).consolidationParentTransactionId).toBeNull();
    });

layer(TestLayer)('consolidation/existing-transfer-csv-expense-duplicate', it => {
    it.effect('pairs a synced expense with the rounded source leg of a legacy CSV transfer to an inactive account', () =>
        Effect.gen(function* () {
            const { legacyTargetAccount, legacyTransfer, syncedCardAccount } = yield* seedLegacyCsvTransfer(1, LEGACY_AMOUNT, false);
            const expense = yield* seedSyncedExpense(syncedCardAccount.id, SYNCED_AMOUNT, 'приват сина 3');

            const result = yield* runConsolidation();
            const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

            expect(result.consolidated).toBe(1);
            expect(canonical.title).toBe('приват сина 3');
            expect(canonical.fromAccountId).toBe(syncedCardAccount.id);
            expect(canonical.toAccountId).toBe(legacyTargetAccount.id);
            yield* expectConsolidationParent(legacyTransfer.id, canonical.id);
            yield* expectConsolidationParent(expense.id, canonical.id);
            expect(yield* fetchLedgerBalances([syncedCardAccount.id, legacyTargetAccount.id])).toEqual([
                [syncedCardAccount.id, -SYNCED_AMOUNT],
                [legacyTargetAccount.id, LEGACY_AMOUNT]
            ]);
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('merges a historical ATM withdrawal into the legacy cash transfer it duplicates without moving money', () =>
        Effect.gen(function* () {
            const {
                legacyTargetAccount: cashAccount,
                legacyTransfer,
                syncedCardAccount
            } = yield* seedLegacyCsvTransfer(1, LEGACY_AMOUNT, true, AccountTypeEnum.CASH);
            const atmExpense = yield* seedSyncedExpense(syncedCardAccount.id, ATM_AMOUNT, 'Банкомат MONO', '6011');
            const ledgerBalances = yield* fetchLedgerBalances([syncedCardAccount.id, cashAccount.id]);
            const totalExpense = yield* fetchTotalExpense();

            expect(yield* runConsolidation()).toEqual({ consolidated: 1, found: 1 });
            const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toEqual([]);
            yield* expectConsolidationParent(legacyTransfer.id, canonical.id);
            yield* expectConsolidationParent(atmExpense.id, canonical.id);
            expect(yield* fetchLedgerBalances([syncedCardAccount.id, cashAccount.id])).toEqual(ledgerBalances);
            expect(totalExpense - (yield* fetchTotalExpense())).toBe(ATM_AMOUNT);
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('matches the target leg when the legacy source account holds another currency', () =>
        Effect.gen(function* () {
            const eur = yield* testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
            const { legacyTargetAccount, legacyTransfer, syncedCardAccount } = yield* seedLegacyCsvTransfer(
                eur.id,
                LEGACY_EUR_AMOUNT,
                true
            );
            const expense = yield* seedSyncedExpense(syncedCardAccount.id, LEGACY_AMOUNT, '552324****0356');

            expect((yield* runConsolidation()).consolidated).toBe(1);
            const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(canonical.toAccountId).toBe(legacyTargetAccount.id);
            yield* expectConsolidationParent(legacyTransfer.id, canonical.id);
            yield* expectConsolidationParent(expense.id, canonical.id);
        })
    );

    it.effect('keeps the expense when the legacy source leg is still live on an active account', () =>
        Effect.gen(function* () {
            const { legacySourceAccount, legacyTransfer, syncedCardAccount } = yield* seedLegacyCsvTransfer(1, LEGACY_AMOUNT, false);
            const expense = yield* seedSyncedExpense(syncedCardAccount.id, LEGACY_AMOUNT, 'приват сина 3');

            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ deletedAt: null })
                .where(
                    and(
                        eq(TransactionEntryEntityTable.transactionId, legacyTransfer.id),
                        eq(TransactionEntryEntityTable.accountId, legacySourceAccount.id)
                    )
                );

            yield* expectExpenseLeftUnconsolidated(expense.id);
        })
    );

    it.effect.each([
        ['На картку', Math.round(LEGACY_AMOUNT * 1.03), '4829'],
        ['Олексій Т.', Math.round(LEGACY_AMOUNT * 0.9), '4829'],
        ['Платіж COMFY', Math.round(LEGACY_AMOUNT * 1.1), '4829'],
        ['Переказ на картку', LEGACY_AMOUNT, '5411']
    ] as const)('keeps "%s" as an expense when it does not duplicate the legacy leg', ([title, amount, mcc]) =>
        Effect.gen(function* () {
            const { syncedCardAccount } = yield* seedLegacyCsvTransfer(1, LEGACY_AMOUNT, false);
            const expense = yield* seedSyncedExpense(syncedCardAccount.id, amount, title, mcc);

            yield* expectExpenseLeftUnconsolidated(expense.id);
        })
    );
});
