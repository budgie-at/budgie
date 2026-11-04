import { SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { EnableBankingSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    buildEnableBankingToken,
    buildEnableBankingTransaction,
    enableBankingDaysAgo,
    enableBankingStub,
    fetchEnableBankingTransactions,
    fetchSyncById,
    seedEnableBankingAccount,
    stubLongestFallbackRows,
    TestLayer
} from '../../harness';

const HASH = 'hash-history';
const UID = 'uid-history';
const SESSION = 'session-history';

const stubAccount = (): void => {
    enableBankingStub.session(SESSION, [{ uid: UID, hash: HASH }]);
    enableBankingStub.balances(UID);
};

describe('enable-banking/history', () => {
    it.effect('fetches full history in one batch, then waits for the forward threshold', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { sync } = yield* seedEnableBankingAccount({
                hash: HASH,
                token: buildEnableBankingToken(SESSION),
                mode: SyncModeEnum.BACKWARD
            });
            stubAccount();
            const queries: URLSearchParams[] = [];
            enableBankingStub.transactions(UID, ({ query }) => {
                queries.push(query);

                return query.get('continuation_key') === 'old'
                    ? {
                          transactions: [
                              buildEnableBankingTransaction({ entry_reference: 'older', booking_date: enableBankingDaysAgo(400) })
                          ]
                      }
                    : { transactions: [buildEnableBankingTransaction()], nextKey: 'old' };
            });

            yield* service.sync();

            expect(queries).toHaveLength(2);
            expect(queries[0].get('strategy')).toBe('longest');
            expect(queries[0].has('date_from')).toBe(false);
            expect(queries[0].get('transaction_status')).toBe('BOOK');
            expect(yield* fetchEnableBankingTransactions()).toHaveLength(2);
            const stored = yield* fetchSyncById(sync.id);
            expect(stored).toMatchObject({ mode: SyncModeEnum.FORWARD, status: SyncStatusEnum.IDLE, setupBalance: null });
            expect(stored.forwardSyncedAt).not.toBeNull();
            expect(stored.reconciledAt).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a history limit requests only date_from and drops older rows when the bank falls back to longest', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const limitAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            yield* seedEnableBankingAccount({
                hash: HASH,
                token: buildEnableBankingToken(SESSION),
                mode: SyncModeEnum.BACKWARD,
                backwardSyncLimitAt: limitAt
            });
            stubAccount();
            const queries: URLSearchParams[] = [];
            stubLongestFallbackRows(UID, queries);

            yield* service.sync();

            expect(queries[0].get('date_from')).toBe(limitAt.toISOString().slice(0, 10));
            expect(queries[0].has('strategy')).toBe(false);
            expect(queries[1].has('date_from')).toBe(false);
            expect((yield* fetchEnableBankingTransactions()).map(row => row.externalId)).toEqual([`${HASH}:kept`]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('new-only history fetches nothing old and the forward run still reconciles today', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const now = new Date();
            const { sync } = yield* seedEnableBankingAccount({
                hash: HASH,
                token: buildEnableBankingToken(SESSION),
                mode: SyncModeEnum.BACKWARD,
                backwardSyncFromAt: now,
                forwardSyncFromAt: now,
                backwardSyncLimitAt: now
            });
            stubAccount();
            const queries: URLSearchParams[] = [];
            enableBankingStub.transactions(UID, ({ query }) => {
                queries.push(query);

                return { transactions: [buildEnableBankingTransaction({ booking_date: enableBankingDaysAgo(2) })] };
            });

            yield* service.sync();

            expect(queries.every(query => !query.has('strategy'))).toBe(true);
            expect(yield* fetchEnableBankingTransactions()).toEqual([]);
            expect((yield* fetchSyncById(sync.id)).reconciledAt).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('the forward lookback never crosses a history limit', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const limitAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
            yield* seedEnableBankingAccount({ hash: HASH, token: buildEnableBankingToken(SESSION), backwardSyncLimitAt: limitAt });
            stubAccount();
            enableBankingStub.transactions(UID, () => ({
                transactions: [
                    buildEnableBankingTransaction({ entry_reference: 'kept' }),
                    buildEnableBankingTransaction({ entry_reference: 'older', booking_date: enableBankingDaysAgo(5) })
                ]
            }));

            yield* service.sync();

            expect((yield* fetchEnableBankingTransactions()).map(row => row.externalId)).toEqual([`${HASH}:kept`]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does no backward work in a background run and still syncs forward accounts', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const backward = yield* seedEnableBankingAccount({
                hash: 'hash-backward',
                token: buildEnableBankingToken('session-backward'),
                mode: SyncModeEnum.BACKWARD
            });
            yield* seedEnableBankingAccount({ hash: HASH, token: buildEnableBankingToken(SESSION) });
            stubAccount();
            enableBankingStub.transactions(UID, () => ({ transactions: [buildEnableBankingTransaction()] }));

            yield* service.sync(Date.now() + 25_000);

            expect(enableBankingStub.requests.some(request => request.includes('session-backward'))).toBe(false);
            expect((yield* fetchSyncById(backward.sync.id)).mode).toBe(SyncModeEnum.BACKWARD);
            expect(yield* fetchEnableBankingTransactions()).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('waits the eight-hour threshold between forward fetches', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            yield* seedEnableBankingAccount({ hash: HASH, token: buildEnableBankingToken(SESSION) });
            stubAccount();
            enableBankingStub.transactions(UID, () => ({ transactions: [] }));

            yield* service.sync();
            const requestCount = enableBankingStub.requests.length;
            yield* service.sync();

            expect(enableBankingStub.requests).toHaveLength(requestCount);
        }).pipe(Effect.provide(TestLayer))
    );
});
