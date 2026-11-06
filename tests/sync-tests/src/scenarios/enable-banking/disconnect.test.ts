import { BankIntegrationEntityTable } from '@budgie/contracts';
import { EnableBankingSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    buildEnableBankingToken,
    buildEnableBankingTransaction,
    ENABLE_BANKING_APPLICATION_ID,
    enableBankingStub,
    fetchSortedEnableBankingExternalIds,
    fetchSyncById,
    seedEnableBankingAccount,
    testDb,
    testSigner,
    TestLayer
} from '../../harness';

const findIntegrationId = (token: string) =>
    Effect.map(
        testDb.select().from(BankIntegrationEntityTable).where(eq(BankIntegrationEntityTable.token, token)),
        ([integration]) => integration.id
    );

describe('enable-banking/disconnect', () => {
    it.effect('keeps the shared key until the last integration of the application is disconnected', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const firstToken = buildEnableBankingToken('session-first');
            const secondToken = buildEnableBankingToken('session-second');
            yield* seedEnableBankingAccount({ hash: 'hash-first', token: firstToken });
            yield* seedEnableBankingAccount({ hash: 'hash-second', token: secondToken });
            enableBankingStub.deleteSession('session-first');
            enableBankingStub.deleteSession('session-second');

            expect(yield* service.disconnect(yield* findIntegrationId(firstToken))).toBe(true);
            expect(testSigner.deletedKeyIds).toEqual([]);

            expect(yield* service.disconnect(yield* findIntegrationId(secondToken))).toBe(true);
            expect(testSigner.deletedKeyIds).toEqual([ENABLE_BANKING_APPLICATION_ID]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('two banks sharing one application sync independently', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            yield* seedEnableBankingAccount({ hash: 'hash-first', token: buildEnableBankingToken('session-first') });
            yield* seedEnableBankingAccount({ hash: 'hash-second', token: buildEnableBankingToken('session-second') });
            enableBankingStub.session('session-first', [{ uid: 'uid-first', hash: 'hash-first' }]);
            enableBankingStub.session('session-second', [{ uid: 'uid-second', hash: 'hash-second' }]);
            enableBankingStub.balances('uid-first');
            enableBankingStub.balances('uid-second');
            enableBankingStub.transactions('uid-first', () => ({ transactions: [buildEnableBankingTransaction()] }));
            enableBankingStub.transactions('uid-second', () => ({ transactions: [buildEnableBankingTransaction()] }));

            yield* service.sync();

            expect(yield* fetchSortedEnableBankingExternalIds).toEqual(['hash-first:reference-1', 'hash-second:reference-1']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a failed session deletion never blocks local removal and reports the consent as still valid', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const token = buildEnableBankingToken('session-stuck');
            const { sync } = yield* seedEnableBankingAccount({ hash: 'hash-stuck', token });
            enableBankingStub.deleteSession('session-stuck', { status: 500, error: 'ASPSP_ERROR' });

            const integrationId = yield* findIntegrationId(token);

            expect(yield* service.disconnect(integrationId)).toBe(false);
            expect(yield* testDb.select().from(BankIntegrationEntityTable).where(eq(BankIntegrationEntityTable.id, integrationId))).toEqual(
                []
            );
            expect((yield* fetchSyncById(sync.id)).enabled).toBe(false);

            yield* service.sync();
            expect(enableBankingStub.requests).toEqual(['DELETE /sessions/session-stuck']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a failed key deletion removes nothing and a retry succeeds after the session is already revoked', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const token = buildEnableBankingToken('session-retry');
            yield* seedEnableBankingAccount({ hash: 'hash-retry', token });
            const integrationId = yield* findIntegrationId(token);
            enableBankingStub.deleteSession('session-retry');
            testSigner.markUndeletable(ENABLE_BANKING_APPLICATION_ID);

            const error = yield* Effect.flip(service.disconnect(integrationId));

            expect(error._tag).toBe('SyncDeferredError');
            expect(
                yield* testDb.select().from(BankIntegrationEntityTable).where(eq(BankIntegrationEntityTable.id, integrationId))
            ).toHaveLength(1);

            testSigner.clearUndeletable(ENABLE_BANKING_APPLICATION_ID);
            enableBankingStub.deleteSession('session-retry', { status: 400, error: 'SESSION_DOES_NOT_EXIST' });

            yield* service.disconnect(integrationId);

            expect(yield* testDb.select().from(BankIntegrationEntityTable).where(eq(BankIntegrationEntityTable.id, integrationId))).toEqual(
                []
            );
            expect(testSigner.deletedKeyIds).toEqual([ENABLE_BANKING_APPLICATION_ID]);
        }).pipe(Effect.provide(TestLayer))
    );
});
