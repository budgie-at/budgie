import { SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { EnableBankingSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    buildEnableBankingToken,
    buildEnableBankingTransaction,
    enableBankingStub,
    fetchEnableBankingTransactions,
    fetchSyncById,
    seedEnableBankingAccount,
    TestLayer
} from '../../harness';

const LIMITED = { status: 429, error: 'ASPSP_RATE_LIMIT_EXCEEDED' };

describe('enable-banking/rate-limit', () => {
    it.effect('rate limiting on one bank leaves the cursor unchanged and another bank unaffected', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const limited = yield* seedEnableBankingAccount({ hash: 'hash-limited', token: buildEnableBankingToken('session-limited') });
            const healthy = yield* seedEnableBankingAccount({ hash: 'hash-healthy', token: buildEnableBankingToken('session-healthy') });
            enableBankingStub.session('session-limited', [{ uid: 'uid-limited', hash: 'hash-limited' }]);
            enableBankingStub.session('session-healthy', [{ uid: 'uid-healthy', hash: 'hash-healthy' }]);
            enableBankingStub.balancesError('uid-limited', LIMITED);
            enableBankingStub.balances('uid-healthy');
            enableBankingStub.transactions('uid-healthy', () => ({ transactions: [buildEnableBankingTransaction()] }));

            yield* service.sync();

            const limitedSync = yield* fetchSyncById(limited.sync.id);
            expect(limitedSync.forwardSyncFromAt).toEqual(limited.sync.forwardSyncFromAt);
            expect(limitedSync).toMatchObject({ status: SyncStatusEnum.IDLE, errorCount: 0, reconciledAt: null });
            expect(limitedSync.forwardSyncedAt).not.toBeNull();
            expect(yield* fetchEnableBankingTransactions()).toHaveLength(1);
            expect((yield* fetchSyncById(healthy.sync.id)).reconciledAt).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rate limiting during the backward batch keeps history pending for the next foreground run', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { sync } = yield* seedEnableBankingAccount({
                hash: 'hash-history',
                token: buildEnableBankingToken('session-history'),
                mode: SyncModeEnum.BACKWARD
            });
            enableBankingStub.session('session-history', [{ uid: 'uid-history', hash: 'hash-history' }]);
            enableBankingStub.balances('uid-history');
            enableBankingStub.transactions('uid-history', () => LIMITED);

            yield* service.sync();

            expect(yield* fetchSyncById(sync.id)).toMatchObject({
                mode: SyncModeEnum.BACKWARD,
                status: SyncStatusEnum.FAILED,
                errorCount: 0,
                enabled: true,
                lastErrorCode: null
            });

            enableBankingStub.transactions('uid-history', () => ({ transactions: [buildEnableBankingTransaction()] }));
            yield* service.sync();

            expect((yield* fetchSyncById(sync.id)).mode).toBe(SyncModeEnum.FORWARD);
            expect(yield* fetchEnableBankingTransactions()).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ends the run on the service-wide 429 instead of looping', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            yield* seedEnableBankingAccount({ hash: 'hash-service', token: buildEnableBankingToken('session-service') });
            enableBankingStub.sessionError('session-service', { status: 429, error: 'TOO_MANY_REQUESTS' });

            yield* service.sync(Date.now() + 20_000);

            expect(enableBankingStub.requests).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
