import { SyncErrorCodeEnum, SyncStatusEnum } from '@budgie/contracts';
import { EnableBankingSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    buildEnableBankingToken,
    buildEnableBankingTransaction,
    ENABLE_BANKING_APPLICATION_ID,
    enableBankingStub,
    fetchEnableBankingTransactions,
    fetchSyncById,
    seedEnableBankingAccount,
    testSigner,
    TestLayer
} from '../../harness';

const HASH = 'hash-key';
const UID = 'uid-key';
const SESSION = 'session-key';

const syncWithMissingKey = () =>
    Effect.gen(function* () {
        const service = yield* EnableBankingSyncService;
        const seeded = yield* seedEnableBankingAccount({ hash: HASH, token: buildEnableBankingToken(SESSION) });
        testSigner.markMissing(ENABLE_BANKING_APPLICATION_ID);
        yield* service.sync();

        return seeded;
    });

describe('enable-banking/key', () => {
    it.effect('a missing key marks the credential unauthorized, keeps sync enabled and never touches the network', () =>
        Effect.gen(function* () {
            const { sync } = yield* syncWithMissingKey();

            expect(enableBankingStub.requests).toHaveLength(0);
            expect(yield* fetchSyncById(sync.id)).toMatchObject({
                enabled: true,
                status: SyncStatusEnum.FAILED,
                lastErrorCode: SyncErrorCodeEnum.UNAUTHORIZED
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('re-picking the key restores sync without re-consent', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { sync } = yield* syncWithMissingKey();

            testSigner.reset();
            enableBankingStub.session(SESSION, [{ uid: UID, hash: HASH }]);
            enableBankingStub.balances(UID);
            enableBankingStub.transactions(UID, () => ({ transactions: [buildEnableBankingTransaction()] }));
            yield* service.sync();

            expect(yield* fetchEnableBankingTransactions()).toHaveLength(1);
            expect((yield* fetchSyncById(sync.id)).status).toBe(SyncStatusEnum.IDLE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a temporarily unavailable key defers without counting a failure', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { sync } = yield* seedEnableBankingAccount({ hash: HASH, token: buildEnableBankingToken(SESSION) });
            testSigner.markUnavailable(ENABLE_BANKING_APPLICATION_ID);

            yield* service.sync();

            expect(yield* fetchSyncById(sync.id)).toMatchObject({
                enabled: true,
                errorCount: 0,
                status: SyncStatusEnum.FAILED,
                lastErrorCode: null
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('an API key rejection is credential-wide inside one integration only', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const rejected = yield* seedEnableBankingAccount({ hash: HASH, token: buildEnableBankingToken(SESSION) });
            const healthy = yield* seedEnableBankingAccount({ hash: 'hash-other', token: buildEnableBankingToken('session-other') });
            enableBankingStub.sessionError(SESSION, { status: 401, error: 'UNAUTHORIZED_ACCESS' });
            enableBankingStub.session('session-other', [{ uid: 'uid-other', hash: 'hash-other' }]);
            enableBankingStub.balances('uid-other');
            enableBankingStub.transactions('uid-other', () => ({ transactions: [] }));

            yield* service.sync();

            expect((yield* fetchSyncById(rejected.sync.id)).lastErrorCode).toBe(SyncErrorCodeEnum.UNAUTHORIZED);
            expect((yield* fetchSyncById(healthy.sync.id)).status).toBe(SyncStatusEnum.IDLE);
        }).pipe(Effect.provide(TestLayer))
    );
});
