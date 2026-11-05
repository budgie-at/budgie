import { AccountEntityTable, BankIntegrationEntityTable, SyncErrorCodeEnum, SyncStatusEnum } from '@budgie/contracts';
import { EnableBankingSyncService, SyncHistoryDepthEnum } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    buildEnableBankingToken,
    buildEnableBankingTransaction,
    ENABLE_BANKING_APPLICATION_ID,
    enableBankingStub,
    fetchAccountIntegrationToken,
    fetchEnableBankingTransactions,
    fetchSyncById,
    makeEnableBankingSyncStale,
    seedEnableBankingAccount,
    skipRequestedSync,
    testDb,
    TestLayer
} from '../../harness';

const CALLBACK_URL = 'budgie://enable-banking/callback';
const VALID_UNTIL = '2099-06-01T00:00:00.000Z';
const PAST = '2020-01-01T00:00:00.000Z';

const pendingFor = (integrationId: number | null, state: string) => ({
    state,
    applicationId: ENABLE_BANKING_APPLICATION_ID,
    aspspName: 'Synthetic Bank',
    aspspCountry: 'DE',
    integrationId,
    connectAccountId: null,
    callbackUrl: CALLBACK_URL,
    expiresAtMs: Date.now() + 60_000
});

const accountResource = (hash: string) => ({
    uid: `new-uid-${hash}`,
    identification_hash: hash,
    identification_hashes: [hash],
    cash_account_type: 'CACC',
    currency: 'EUR'
});

const stubHealthyBank = (): void => {
    enableBankingStub.session('session-healthy', [{ uid: 'uid-healthy', hash: 'hash-healthy' }]);
    enableBankingStub.balances('uid-healthy');
    enableBankingStub.transactions('uid-healthy', () => ({ transactions: [buildEnableBankingTransaction()] }));
};

const stubSessionError = (error: string) => () => {
    enableBankingStub.sessionError('session-api', { status: 400, error });
};

describe('enable-banking/consent', () => {
    it.effect('a past validUntil marks only that authorization and needs no API call for it', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const expired = yield* seedEnableBankingAccount({
                hash: 'hash-expired',
                token: buildEnableBankingToken('session-expired', PAST)
            });
            const healthy = yield* seedEnableBankingAccount({ hash: 'hash-healthy', token: buildEnableBankingToken('session-healthy') });
            stubHealthyBank();

            yield* service.sync();

            expect(yield* fetchSyncById(expired.sync.id)).toMatchObject({
                enabled: true,
                status: SyncStatusEnum.FAILED,
                lastErrorCode: SyncErrorCodeEnum.CONSENT_EXPIRED
            });
            expect((yield* fetchSyncById(healthy.sync.id)).status).toBe(SyncStatusEnum.IDLE);
            expect(enableBankingStub.requests.some(request => request.includes('session-expired'))).toBe(false);
            expect(yield* fetchEnableBankingTransactions()).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { name: 'EXPIRED_SESSION', stub: stubSessionError('EXPIRED_SESSION') },
        { name: 'REVOKED_SESSION', stub: stubSessionError('REVOKED_SESSION') },
        { name: 'CLOSED_SESSION', stub: stubSessionError('CLOSED_SESSION') },
        { name: 'SESSION_DOES_NOT_EXIST', stub: stubSessionError('SESSION_DOES_NOT_EXIST') },
        { name: 'WRONG_SESSION_STATUS', stub: stubSessionError('WRONG_SESSION_STATUS') },
        {
            name: 'a non-AUTHORIZED status',
            stub: () => {
                enableBankingStub.session('session-api', [{ uid: 'uid-api', hash: 'hash-api' }], 'EXPIRED');
            }
        }
    ])('maps $name to consent expiry', ({ stub }) =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { sync } = yield* seedEnableBankingAccount({ hash: 'hash-api', token: buildEnableBankingToken('session-api') });
            stub();

            yield* service.sync();

            expect((yield* fetchSyncById(sync.id)).lastErrorCode).toBe(SyncErrorCodeEnum.CONSENT_EXPIRED);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('re-consent with a new uid keeps transaction identity and clears the pacing state', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const hash = 'hash-reconsent';
            const { account, sync } = yield* seedEnableBankingAccount({ hash, token: buildEnableBankingToken('session-old') });
            enableBankingStub.session('session-old', [{ uid: 'uid-old', hash }]);
            enableBankingStub.balances('uid-old');
            enableBankingStub.transactions('uid-old', () => ({ transactions: [buildEnableBankingTransaction()] }));
            yield* service.sync();
            yield* makeEnableBankingSyncStale(sync.id);

            enableBankingStub.authorizeSession('session-new', 'Synthetic Bank', [accountResource(hash)], VALID_UNTIL);
            const result = yield* skipRequestedSync(
                service.completeAuthorization(pendingFor(null, 'state-1'), `${CALLBACK_URL}?code=code-1&state=state-1`)
            );

            expect(result.integrationId).not.toBeNull();
            expect(yield* fetchAccountIntegrationToken(account.id)).toBe(buildEnableBankingToken('session-new', VALID_UNTIL));
            expect((yield* fetchSyncById(sync.id)).forwardSyncedAt).toBeNull();

            enableBankingStub.session('session-new', [{ uid: 'uid-new', hash }]);
            enableBankingStub.balances('uid-new');
            enableBankingStub.transactions('uid-new', () => ({ transactions: [buildEnableBankingTransaction()] }));
            yield* service.sync();

            expect(yield* fetchEnableBankingTransactions()).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('an account absent after re-consent fails as not linked and never completes', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { sync } = yield* seedEnableBankingAccount({ hash: 'hash-gone', token: buildEnableBankingToken('session-gone') });
            enableBankingStub.session('session-gone', [{ uid: 'uid-other', hash: 'hash-other' }]);

            yield* service.sync();

            expect(yield* fetchSyncById(sync.id)).toMatchObject({
                enabled: true,
                status: SyncStatusEnum.FAILED,
                forwardSyncedAt: null,
                lastErrorCode: SyncErrorCodeEnum.ACCOUNT_NOT_LINKED
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('refuses a re-consent covering none of the connected accounts', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const token = buildEnableBankingToken('session-keep');
            const { account } = yield* seedEnableBankingAccount({ hash: 'hash-keep', token });
            enableBankingStub.authorizeSession('session-foreign', 'Synthetic Bank', [accountResource('hash-foreign')], VALID_UNTIL);
            const [integration] = yield* testDb.select().from(BankIntegrationEntityTable);

            const error = yield* Effect.flip(
                service.completeAuthorization(pendingFor(integration.id, 'state-2'), `${CALLBACK_URL}?code=code-2&state=state-2`)
            );

            expect(error._tag).toBe('SyncTokenClientMismatchError');
            expect(yield* fetchAccountIntegrationToken(account.id)).toBe(token);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a re-consent that adds an unconnected account updates the token and connects it to the same integration', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { account } = yield* seedEnableBankingAccount({ hash: 'hash-known', token: buildEnableBankingToken('session-old') });
            enableBankingStub.authorizeSession(
                'session-new',
                'Synthetic Bank',
                [accountResource('hash-known'), accountResource('hash-added')],
                VALID_UNTIL
            );

            const result = yield* skipRequestedSync(
                service.completeAuthorization(pendingFor(null, 'state-3'), `${CALLBACK_URL}?code=code-3&state=state-3`)
            );

            expect(result.integrationId).not.toBeNull();
            expect(result.previews.map(preview => [preview.externalId, preview.hasSync])).toEqual([
                ['hash-known', true],
                ['hash-added', false]
            ]);
            expect(yield* fetchAccountIntegrationToken(account.id)).toBe(buildEnableBankingToken('session-new', VALID_UNTIL));

            expect(
                yield* skipRequestedSync(
                    service.setupAccountSyncBatch(result.token, result.accounts, ['hash-added'], SyncHistoryDepthEnum.FULL)
                )
            ).toBe(1);
            const [added] = yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, 'hash-added'));
            expect(added.integrationId).toBe(result.integrationId);
            expect(yield* testDb.select().from(BankIntegrationEntityTable)).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
