import { SyncStatusEnum } from '@budgie/contracts';
import { EnableBankingSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    buildEnableBankingTransaction,
    enableBankingStub,
    fetchEnableBankingTransactions,
    fetchSortedEnableBankingExternalIds,
    fetchSyncById,
    seedLinkedEnableBankingAccount,
    TestLayer
} from '../../harness';

const HASH = 'hash-pagination';
const UID = 'uid-pagination';
const SESSION = 'session-pagination';

describe('enable-banking/pagination', () => {
    it.effect('stores rows from every continuation page with signed requests', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            yield* seedLinkedEnableBankingAccount(HASH, UID, SESSION);
            enableBankingStub.balances(UID);
            enableBankingStub.transactions(UID, ({ query }) =>
                query.get('continuation_key') === 'page-2'
                    ? { transactions: [buildEnableBankingTransaction({ entry_reference: 'second' })] }
                    : { transactions: [buildEnableBankingTransaction({ entry_reference: 'first' })], nextKey: 'page-2' }
            );

            yield* service.sync();

            expect(yield* fetchSortedEnableBankingExternalIds).toEqual([`${HASH}:first`, `${HASH}:second`]);
            expect(enableBankingStub.expectSignedJwts()).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('commits nothing and keeps the cursor when a later page fails', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { sync } = yield* seedLinkedEnableBankingAccount(HASH, UID, SESSION);
            enableBankingStub.balances(UID);
            enableBankingStub.transactions(UID, ({ query }) =>
                query.get('continuation_key') === 'page-2'
                    ? { status: 500, error: 'ASPSP_ERROR' }
                    : { transactions: [buildEnableBankingTransaction()], nextKey: 'page-2' }
            );

            yield* service.sync();

            expect(yield* fetchEnableBankingTransactions()).toHaveLength(0);
            const stored = yield* fetchSyncById(sync.id);
            expect(stored).toMatchObject({ enabled: true, status: SyncStatusEnum.FAILED, forwardSyncedAt: null });
            expect(stored.forwardSyncFromAt).toEqual(sync.forwardSyncFromAt);
        }).pipe(Effect.provide(TestLayer))
    );
});
