import { AccountTypeEnum, CategorySourceEnum, ExternalSourceEnum, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { expectConsolidationParent, fetchLedgerBalances, fetchOwnLedgerEntries } from '../harness/consolidation-revert-audit';
import {
    MANUAL_EXPENSE_DUPLICATE_TIME_WINDOW_SECONDS,
    buildManualExpenseDuplicateAmount,
    seedManualExpenseDuplicateAccounts,
    seedManualExpenseDuplicatePair,
    seedManualExpenseDuplicatePairs
} from '../harness/manual-expense-duplicate-fixture';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

import type { ManualExpenseDuplicateAccountsInterface } from '../harness/interface/manual-expense-duplicate-accounts.interface';

const SUPPORTING_PAIR_INDEXES = [0, 1, 2] as const;

const expectManualExpenseDuplicateConsolidated = (syncedTransactionId: number, manualTransactionId: number) =>
    Effect.gen(function* () {
        expect((yield* testQueryService.fetchTransactionById(syncedTransactionId)).consolidationType).toBe(
            TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE
        );
        yield* expectConsolidationParent(manualTransactionId, syncedTransactionId);
    });

const expectUntouched = (transactionIds: readonly number[]) =>
    Effect.forEach(transactionIds, transactionId =>
        Effect.gen(function* () {
            const transaction = yield* testQueryService.fetchTransactionById(transactionId);

            expect(transaction.consolidationType).toBeNull();
            expect(transaction.consolidationParentTransactionId).toBeNull();
        })
    );

const expectPairsSkipped = (accounts: ManualExpenseDuplicateAccountsInterface, indexes: readonly number[]) =>
    Effect.gen(function* () {
        const pairs = yield* seedManualExpenseDuplicatePairs(accounts, indexes);

        expect(yield* runConsolidation()).toEqual({ found: 0, consolidated: 0 });
        yield* expectUntouched(pairs.flatMap(({ synced, manual }) => [synced.id, manual.id]));
    });

const fetchSyncedEntry = (transactionId: number) =>
    Effect.gen(function* () {
        const [entry] = yield* fetchOwnLedgerEntries(transactionId);

        if (!isDefined(entry)) {
            throw new Error(`Ledger entry for transaction ${transactionId} not found`);
        }

        return entry;
    });

layer(TestLayer)('consolidation/manual-expense-duplicate', it => {
    it.effect('hides manual expenses under their synced duplicates and carries the manual category, tags and comment', () =>
        Effect.gen(function* () {
            const accounts = yield* seedManualExpenseDuplicateAccounts();
            const category = yield* testSeedService.category('Groceries');
            const tag = yield* testSeedService.tag('Family');
            const pairs = yield* Effect.forEach(SUPPORTING_PAIR_INDEXES, index =>
                seedManualExpenseDuplicatePair({ accounts, index, manualCategoryId: category.id, manualComment: `Manual note ${index}` })
            );
            yield* Effect.forEach(pairs, ({ manual }) => testSeedService.transactionTag(manual.id, tag.id));
            const balancesBefore = yield* fetchLedgerBalances([accounts.syncedAccount.id, accounts.manualAccount.id]);

            expect(yield* runConsolidation()).toEqual({ found: 3, consolidated: 3 });

            for (const [index, { synced, manual }] of pairs.entries()) {
                yield* expectManualExpenseDuplicateConsolidated(synced.id, manual.id);

                const syncedEntry = yield* fetchSyncedEntry(synced.id);

                expect(syncedEntry.categoryId).toBe(category.id);
                expect(syncedEntry.categorySource).toBe(CategorySourceEnum.MANUAL_EXPENSE_DUPLICATE);
                expect(yield* testQueryService.fetchTransactionTagIds(synced.id)).toEqual([tag.id]);
                expect((yield* testQueryService.fetchTransactionById(synced.id)).comment).toBe(`Manual note ${index}`);
            }

            expect(yield* fetchLedgerBalances([accounts.syncedAccount.id, accounts.manualAccount.id])).toEqual([
                balancesBefore[0],
                [accounts.manualAccount.id, 0]
            ]);
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('keeps the category of an already categorized synced expense and copies nothing onto it', () =>
        Effect.gen(function* () {
            const accounts = yield* seedManualExpenseDuplicateAccounts();
            const manualCategory = yield* testSeedService.category('Groceries');
            const syncedCategory = yield* testSeedService.category('Restaurants');
            const tag = yield* testSeedService.tag('Family');
            const pairs = yield* Effect.forEach(SUPPORTING_PAIR_INDEXES, index =>
                seedManualExpenseDuplicatePair({ accounts, index, manualCategoryId: manualCategory.id, manualComment: 'Manual note' })
            );
            const [{ synced, manual }] = pairs;
            const syncedEntry = yield* fetchSyncedEntry(synced.id);

            yield* testSeedService.transactionTag(manual.id, tag.id);
            yield* testSeedService.entryCategory(syncedEntry.id, syncedCategory.id, CategorySourceEnum.AI);

            expect((yield* runConsolidation()).consolidated).toBe(3);

            yield* expectManualExpenseDuplicateConsolidated(synced.id, manual.id);
            expect(yield* fetchSyncedEntry(synced.id)).toMatchObject({
                categoryId: syncedCategory.id,
                categorySource: CategorySourceEnum.AI
            });
            expect(yield* testQueryService.fetchTransactionTagIds(synced.id)).toEqual([]);
            expect((yield* testQueryService.fetchTransactionById(synced.id)).comment).toBe('');
        })
    );

    it.effect('skips a synced expense matching two manual expenses and a manual expense matching two synced expenses', () =>
        Effect.gen(function* () {
            const accounts = yield* seedManualExpenseDuplicateAccounts();
            yield* seedManualExpenseDuplicatePairs(accounts, SUPPORTING_PAIR_INDEXES);
            const syncedAmbiguous = yield* seedManualExpenseDuplicatePair({ accounts, index: 3 });
            const secondManual = yield* testSeedService.manualExpense({
                accountId: accounts.manualAccount.id,
                amount: buildManualExpenseDuplicateAmount(3),
                operatedAt: new Date(
                    (yield* testQueryService.fetchTransactionById(syncedAmbiguous.manual.id)).operatedAt.getTime() + 60_000
                )
            });
            const manualAmbiguous = yield* seedManualExpenseDuplicatePair({ accounts, index: 4 });
            const secondSynced = yield* testSeedService.bankPairExpense(
                { externalId: 'manual-duplicate-second-synced', operatedAt: manualAmbiguous.manual.operatedAt },
                { accountId: accounts.syncedAccount.id, amount: buildManualExpenseDuplicateAmount(4) }
            );

            expect(yield* runConsolidation()).toEqual({ found: 3, consolidated: 3 });

            yield* expectUntouched([
                syncedAmbiguous.synced.id,
                syncedAmbiguous.manual.id,
                secondManual.id,
                manualAmbiguous.synced.id,
                manualAmbiguous.manual.id,
                secondSynced.id
            ]);
        })
    );

    it.effect('requires at least three unambiguous pairs between the manual account and the synced bank', () =>
        Effect.gen(function* () {
            yield* expectPairsSkipped(yield* seedManualExpenseDuplicateAccounts(), [0, 1]);
        })
    );

    it.effect('counts support per synced bank so a pair from another bank does not borrow it', () =>
        Effect.gen(function* () {
            const accounts = yield* seedManualExpenseDuplicateAccounts();
            yield* seedManualExpenseDuplicatePairs(accounts, SUPPORTING_PAIR_INDEXES);
            const otherBankPair = yield* seedManualExpenseDuplicatePair({ accounts, index: 3 });

            yield* testSeedService.updateTransaction(otherBankPair.synced.id, { externalSource: ExternalSourceEnum.PRIVATBANK });

            expect((yield* runConsolidation()).consolidated).toBe(3);
            yield* expectUntouched([otherBankPair.synced.id, otherBankPair.manual.id]);
        })
    );

    it.effect('ignores manual expenses on cash accounts', () =>
        Effect.gen(function* () {
            yield* expectPairsSkipped(yield* seedManualExpenseDuplicateAccounts(AccountTypeEnum.CASH), SUPPORTING_PAIR_INDEXES);
        })
    );

    it.effect('ignores imported expenses on a manual BANK account', () =>
        Effect.gen(function* () {
            const accounts = yield* seedManualExpenseDuplicateAccounts();
            const pairs = yield* Effect.forEach(SUPPORTING_PAIR_INDEXES, index =>
                seedManualExpenseDuplicatePair({ accounts, index, manualExternalSource: ExternalSourceEnum.MONOBANK })
            );

            expect(yield* runConsolidation()).toEqual({ found: 0, consolidated: 0 });
            yield* expectUntouched(pairs.flatMap(({ synced, manual }) => [synced.id, manual.id]));
        })
    );

    it.effect('ignores manual expenses in a different instrument', () =>
        Effect.gen(function* () {
            const usd = yield* testSeedService.instrument({ code: 'USD', name: 'US Dollar', symbol: '$' });
            yield* expectPairsSkipped(yield* seedManualExpenseDuplicateAccounts(AccountTypeEnum.BANK, usd.id), SUPPORTING_PAIR_INDEXES);
        })
    );

    it.effect('requires exactly equal amounts', () =>
        Effect.gen(function* () {
            const accounts = yield* seedManualExpenseDuplicateAccounts();
            yield* seedManualExpenseDuplicatePairs(accounts, SUPPORTING_PAIR_INDEXES);
            const offByOne = yield* seedManualExpenseDuplicatePair({ accounts, index: 3, manualAmountDelta: 1 });

            expect((yield* runConsolidation()).consolidated).toBe(3);
            yield* expectUntouched([offByOne.synced.id, offByOne.manual.id]);
        })
    );

    it.effect('matches manual expenses exactly two days apart and skips them one second later', () =>
        Effect.gen(function* () {
            const accounts = yield* seedManualExpenseDuplicateAccounts();
            yield* seedManualExpenseDuplicatePairs(accounts, SUPPORTING_PAIR_INDEXES);
            const atBoundary = yield* seedManualExpenseDuplicatePair({
                accounts,
                index: 3,
                manualOperatedAtOffsetSeconds: -MANUAL_EXPENSE_DUPLICATE_TIME_WINDOW_SECONDS
            });
            const beyondBoundary = yield* seedManualExpenseDuplicatePair({
                accounts,
                index: 4,
                manualOperatedAtOffsetSeconds: MANUAL_EXPENSE_DUPLICATE_TIME_WINDOW_SECONDS + 1
            });

            expect((yield* runConsolidation()).consolidated).toBe(4);
            yield* expectManualExpenseDuplicateConsolidated(atBoundary.synced.id, atBoundary.manual.id);
            yield* expectUntouched([beyondBoundary.synced.id, beyondBoundary.manual.id]);
        })
    );

    it.effect('leaves pairs linked to a debt to the user', () =>
        Effect.gen(function* () {
            const accounts = yield* seedManualExpenseDuplicateAccounts();
            const debtAccount = yield* testSeedService.account({ title: 'Debt', type: AccountTypeEnum.DEBT });
            yield* seedManualExpenseDuplicatePairs(accounts, SUPPORTING_PAIR_INDEXES);
            const syncedDebtPair = yield* seedManualExpenseDuplicatePair({ accounts, index: 3 });
            const manualDebtPair = yield* seedManualExpenseDuplicatePair({ accounts, index: 4 });

            yield* testSeedService.debtEvent(syncedDebtPair.synced.id, debtAccount.id, buildManualExpenseDuplicateAmount(3));
            yield* testSeedService.debtEvent(manualDebtPair.manual.id, debtAccount.id, buildManualExpenseDuplicateAmount(4));

            expect((yield* runConsolidation()).consolidated).toBe(3);
            yield* expectUntouched([
                syncedDebtPair.synced.id,
                syncedDebtPair.manual.id,
                manualDebtPair.synced.id,
                manualDebtPair.manual.id
            ]);
        })
    );

    it.effect('limits a scoped run to scoped pairs while counting account support over the full history', () =>
        Effect.gen(function* () {
            const accounts = yield* seedManualExpenseDuplicateAccounts();
            const pairs = yield* seedManualExpenseDuplicatePairs(accounts, SUPPORTING_PAIR_INDEXES);
            const [scopedPair, ...unscopedPairs] = pairs;

            const result = yield* runConsolidation({
                operatedAtFrom: new Date(scopedPair.synced.operatedAt.getTime() - 60_000),
                operatedAtTo: new Date(scopedPair.synced.operatedAt.getTime() + 60_000),
                transactionIds: [scopedPair.synced.id]
            });

            expect(result).toEqual({ found: 1, consolidated: 1 });
            yield* expectManualExpenseDuplicateConsolidated(scopedPair.synced.id, scopedPair.manual.id);
            yield* expectUntouched(unscopedPairs.flatMap(({ synced, manual }) => [synced.id, manual.id]));
        })
    );
});
