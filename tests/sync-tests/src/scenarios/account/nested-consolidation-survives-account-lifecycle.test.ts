import { AccountBalanceRepository, AccountTypeEnum, ExternalSourceEnum, TransactionConsolidationRepository } from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import { ResyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    fetchDefaultStatistics,
    fetchEntriesByTransactionId,
    fetchTransactionById,
    seed,
    seedNestedTransferConsolidation,
    TestLayer
} from '../../harness';

const seedNestedScenario = Effect.fnUntraced(function* () {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const account = yield* seed.account({ title: 'Erste EUR', type: AccountTypeEnum.BANK });
    const bankAccount = yield* seed.account({ title: 'Bank EUR', type: AccountTypeEnum.BANK });
    const cashAccount = yield* seed.account({ title: 'Cash EUR', type: AccountTypeEnum.CASH });
    const nested = yield* seedNestedTransferConsolidation(account.id, bankAccount.id, cashAccount.id);
    const liveAccountIds = [bankAccount.id, cashAccount.id];

    const snapshot = Effect.fnUntraced(function* () {
        return {
            child: yield* fetchTransactionById(nested.child.id),
            grandchild: yield* fetchTransactionById(nested.grandchild.id),
            canonical: yield* fetchTransactionById(nested.canonical.id),
            canonicalEntries: yield* fetchEntriesByTransactionId(nested.canonical.id),
            childEntries: yield* fetchEntriesByTransactionId(nested.child.id),
            ledger: yield* accountBalanceRepository.getLedgerBalances(liveAccountIds),
            statistics: yield* fetchDefaultStatistics()
        };
    });

    return { account, bankAccount, cashAccount, nested, snapshot };
});

describe('account/nested-consolidation-survives-account-lifecycle', () => {
    it.effect('archiving an account keeps a consolidation hidden inside another one nested', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const { account, nested, snapshot } = yield* seedNestedScenario();
            const before = yield* snapshot();

            yield* accountArchiveService.archiveById(account.id);

            const after = yield* snapshot();

            expect(before.child.consolidationParentTransactionId).toBe(nested.canonical.id);
            expect(before.grandchild.consolidationParentTransactionId).toBe(nested.child.id);
            expect(after.child.consolidationParentTransactionId).toBe(nested.canonical.id);
            expect(after.child.deletedAt).not.toBeNull();
            expect({ ...after, child: null, childEntries: [] }).toEqual({ ...before, child: null, childEntries: [] });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a full resync keeps a consolidation hidden inside another one nested', () =>
        Effect.gen(function* () {
            const resyncService = yield* ResyncService;
            const { account, nested, snapshot } = yield* seedNestedScenario();
            yield* seed.sync({ accountId: account.id, provider: ExternalSourceEnum.BINANCE });
            const before = yield* snapshot();

            yield* resyncService.resync({ accountId: account.id, sinceDays: null });

            const after = yield* snapshot();

            expect(after.child.consolidationParentTransactionId).toBe(nested.canonical.id);
            expect(after).toEqual(before);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('the auto-consolidation lookups skip a consolidation hidden inside another one but keep top-level ones', () =>
        Effect.gen(function* () {
            const transactionConsolidationRepository = yield* TransactionConsolidationRepository;
            const { account, cashAccount, nested } = yield* seedNestedScenario();
            const since = new Date(2020, 0, 1);

            const byAccount = yield* transactionConsolidationRepository.findActiveAutoConsolidatedByAccountIds([account.id]);
            const byCashAccount = yield* transactionConsolidationRepository.findActiveAutoConsolidatedByAccountIds([cashAccount.id]);
            const sinceByCashAccount = yield* transactionConsolidationRepository.findActiveAutoConsolidatedByAccountIdsSince(
                [cashAccount.id],
                since
            );

            expect(byAccount).toEqual([]);
            expect(byCashAccount.map(row => row.id)).toEqual([nested.canonical.id]);
            expect(sinceByCashAccount.map(row => row.id)).toEqual([nested.canonical.id]);
        }).pipe(Effect.provide(TestLayer))
    );
});
