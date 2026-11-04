import { EnableBankingSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    buildEnableBankingToken,
    enableBankingStub,
    fetchEnableBankingTransactions,
    fetchSyncById,
    seedEnableBankingAccount,
    stubLongestFallbackRows,
    TestLayer
} from '../../harness';

const HASH = 'hash-period';
const UID = 'uid-period';
const SESSION = 'session-period';
const DAY_MS = 24 * 60 * 60 * 1000;

describe('enable-banking/transactions-period', () => {
    it.effect('refetches once with the longest strategy on a stale cursor and keeps rows from date_from onward', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { sync } = yield* seedEnableBankingAccount({
                hash: HASH,
                token: buildEnableBankingToken(SESSION),
                forwardSyncFromAt: new Date(Date.now() - 30 * DAY_MS)
            });
            enableBankingStub.session(SESSION, [{ uid: UID, hash: HASH }]);
            enableBankingStub.balances(UID);
            const queries: URLSearchParams[] = [];
            stubLongestFallbackRows(UID, queries);

            yield* service.sync();

            expect(queries).toHaveLength(2);
            expect((yield* fetchEnableBankingTransactions()).map(transaction => transaction.externalId)).toEqual([`${HASH}:kept`]);
            expect((yield* fetchSyncById(sync.id)).reconciledAt).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});
