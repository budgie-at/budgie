import { AccountEntityTable, BankIntegrationEntityTable, SyncEntityTable, SyncModeEnum } from '@budgie/contracts';
import { EnableBankingCallbackFailureEnum, EnableBankingErrorCodeEnum, EnableBankingSyncService, SyncHistoryDepthEnum } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';

import {
    buildEnableBankingToken,
    ENABLE_BANKING_APPLICATION_ID,
    enableBankingStub,
    fetchSyncById,
    seedEnableBankingAccount,
    skipRequestedSync,
    testDb,
    TestLayer
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const CALLBACK_URL = 'budgie://enable-banking/callback';
const SYNTHETIC_SECRET = 'SYNTHETIC-SECRET-DETAIL';

const pending = (overrides: { readonly state?: string; readonly expiresAtMs?: number } = {}) => ({
    state: overrides.state ?? 'state-a',
    applicationId: ENABLE_BANKING_APPLICATION_ID,
    aspspName: 'Synthetic Bank',
    aspspCountry: 'DE',
    integrationId: null,
    connectAccountId: null,
    callbackUrl: CALLBACK_URL,
    expiresAtMs: overrides.expiresAtMs ?? Date.now() + 60_000
});

const callbackFailureCases = [
    {
        name: 'a foreign host',
        callbackUrl: 'https://evil.example/callback?code=c&state=state-a',
        failure: EnableBankingCallbackFailureEnum.MALFORMED
    },
    { name: 'no query', callbackUrl: CALLBACK_URL, failure: EnableBankingCallbackFailureEnum.MALFORMED },
    { name: 'a fragment', callbackUrl: `${CALLBACK_URL}?code=c&state=state-a#x`, failure: EnableBankingCallbackFailureEnum.MALFORMED },
    {
        name: 'a bad escape',
        callbackUrl: `${CALLBACK_URL}?code=%E0%A4%A&state=state-a`,
        failure: EnableBankingCallbackFailureEnum.MALFORMED
    },
    {
        name: 'a duplicate code',
        callbackUrl: `${CALLBACK_URL}?code=c&code=d&state=state-a`,
        failure: EnableBankingCallbackFailureEnum.MALFORMED
    },
    { name: 'a wrong state', callbackUrl: `${CALLBACK_URL}?code=c&state=other`, failure: EnableBankingCallbackFailureEnum.STATE_MISMATCH },
    {
        name: 'a duplicate state',
        callbackUrl: `${CALLBACK_URL}?code=c&state=state-a&state=state-a`,
        failure: EnableBankingCallbackFailureEnum.STATE_MISMATCH
    },
    { name: 'a missing state', callbackUrl: `${CALLBACK_URL}?code=c`, failure: EnableBankingCallbackFailureEnum.STATE_MISMATCH },
    {
        name: 'a user cancellation',
        callbackUrl: `${CALLBACK_URL}?error=access_denied&state=state-a`,
        failure: EnableBankingCallbackFailureEnum.CANCELLED
    }
];

describe('enable-banking/authorization', () => {
    it.effect('starts an authorization with a verified state and a personal PSU, sending no PSU headers', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const bodies: unknown[] = [];
            mockServer.use(
                http.post('https://api.enablebanking.com/auth', async ({ request }) => {
                    bodies.push(await request.json());

                    return HttpResponse.json({ url: 'https://bank.example/login', authorization_id: 'a', psu_id_hash: 'p' });
                })
            );

            const result = yield* service.startAuthorization({
                applicationId: ENABLE_BANKING_APPLICATION_ID,
                aspspName: 'Synthetic Bank',
                aspspCountry: 'DE',
                integrationId: null,
                connectAccountId: null,
                callbackUrl: CALLBACK_URL,
                redirectUrl: 'https://budgie.at/enable-banking/callback',
                maximumConsentValiditySeconds: 7_776_000
            });

            expect(result.url).toBe('https://bank.example/login');
            expect(bodies[0]).toMatchObject({
                aspsp: { name: 'Synthetic Bank', country: 'DE' },
                state: result.pending.state,
                psu_type: 'personal',
                redirect_url: 'https://budgie.at/enable-banking/callback'
            });
            expect(result.pending.expiresAtMs).toBeGreaterThan(Date.now());
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('surfaces REDIRECT_URI_NOT_ALLOWED as an api code the setup screen can branch on', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            mockServer.use(
                http.post('https://api.enablebanking.com/auth', () =>
                    HttpResponse.json({ code: 400, error: 'REDIRECT_URI_NOT_ALLOWED', message: 'no' }, { status: 400 })
                )
            );

            const error = yield* Effect.flip(
                service.startAuthorization({
                    applicationId: ENABLE_BANKING_APPLICATION_ID,
                    aspspName: 'Synthetic Bank',
                    aspspCountry: 'DE',
                    integrationId: null,
                    connectAccountId: null,
                    callbackUrl: CALLBACK_URL,
                    redirectUrl: 'https://budgie.at/wrong',
                    maximumConsentValiditySeconds: 86_400
                })
            );

            expect(error).toMatchObject({ _tag: 'SyncInvalidResponseError', apiCode: EnableBankingErrorCodeEnum.REDIRECT_URI_NOT_ALLOWED });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each(callbackFailureCases)('rejects $name without exchanging the code', ({ callbackUrl, failure }) =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;

            const error = yield* Effect.flip(service.completeAuthorization(pending(), callbackUrl));

            expect(error).toMatchObject({ _tag: 'EnableBankingCallbackError', failure });
            expect(enableBankingStub.requests).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects an expired authorization', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;

            const error = yield* Effect.flip(
                service.completeAuthorization(pending({ expiresAtMs: Date.now() - 1 }), `${CALLBACK_URL}?code=c&state=state-a`)
            );

            expect(error).toMatchObject({ failure: EnableBankingCallbackFailureEnum.EXPIRED });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('persists the session whole and connects the selected account only once chosen', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const hash = 'hash-new';
            yield* seedEnableBankingAccount({ hash: 'hash-instrument', token: buildEnableBankingToken('session-instrument') });
            enableBankingStub.authorizeSession(
                'session-new',
                'Synthetic Bank',
                [
                    {
                        uid: 'uid-new',
                        identification_hash: hash,
                        identification_hashes: [hash],
                        name: 'Giro',
                        cash_account_type: 'CACC',
                        currency: 'EUR'
                    }
                ],
                '2099-06-01T00:00:00.000Z'
            );
            const callbackUrl = `${CALLBACK_URL}?code=code%2Fa&state=state-a`;

            const result = yield* service.completeAuthorization(pending(), callbackUrl);

            expect(result.integrationId).toBeNull();
            expect(result.previews).toMatchObject([{ externalId: hash, title: 'Synthetic Bank Giro', isParked: false }]);
            expect(yield* testDb.select().from(BankIntegrationEntityTable)).toHaveLength(1);

            expect(
                yield* skipRequestedSync(service.setupAccountSyncBatch(result.token, result.accounts, [hash], SyncHistoryDepthEnum.FULL))
            ).toBe(1);
            expect(yield* testDb.select().from(BankIntegrationEntityTable)).toHaveLength(2);
            const [account] = yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, hash));
            const [sync] = yield* testDb.select().from(SyncEntityTable).where(eq(SyncEntityTable.accountId, account.id));
            expect(sync).toMatchObject({ mode: SyncModeEnum.BACKWARD, setupBalance: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('lists banks and flags those requiring PSU headers as unsupported', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            mockServer.use(
                http.get('https://api.enablebanking.com/aspsps', () =>
                    HttpResponse.json({
                        aspsps: [
                            {
                                name: 'Open Bank',
                                country: 'DE',
                                logo: 'https://logo.example/a.png',
                                maximum_consent_validity: 7_776_000,
                                beta: false
                            },
                            {
                                name: 'Header Bank',
                                country: 'DE',
                                maximum_consent_validity: 86_400,
                                beta: true,
                                required_psu_headers: ['Psu-Ip-Address']
                            }
                        ]
                    })
                )
            );

            expect(yield* service.listBanks(ENABLE_BANKING_APPLICATION_ID, 'DE')).toMatchObject([
                { name: 'Open Bank', isSupported: true, isBeta: false, maximumConsentValiditySeconds: 7_776_000 },
                { name: 'Header Bank', isSupported: false, isBeta: true }
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('validates credentials with a fresh signature and returns the registered redirect URLs', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            mockServer.use(
                http.get('https://api.enablebanking.com/application', () =>
                    HttpResponse.json({ name: 'App', active: true, environment: 'PRODUCTION', redirect_urls: ['https://budgie.at/cb'] })
                )
            );

            expect(yield* service.validateCredentials(ENABLE_BANKING_APPLICATION_ID)).toEqual({
                isActive: true,
                redirectUrls: ['https://budgie.at/cb']
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('never persists API detail, session ids or schema input in lastError', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const failing = yield* seedEnableBankingAccount({ hash: 'hash-secret', token: buildEnableBankingToken('session-secret-id') });
            const malformed = yield* seedEnableBankingAccount({ hash: 'hash-schema', token: buildEnableBankingToken('session-schema-id') });
            enableBankingStub.session('session-secret-id', [{ uid: 'uid-secret', hash: 'hash-secret' }]);
            enableBankingStub.balancesError('uid-secret', { status: 500, error: 'ASPSP_ERROR' });
            mockServer.use(
                http.get('https://api.enablebanking.com/sessions/session-schema-id', () => HttpResponse.json({ status: SYNTHETIC_SECRET }))
            );

            yield* service.sync();

            for (const syncId of [failing.sync.id, malformed.sync.id]) {
                const lastError = (yield* fetchSyncById(syncId)).lastError ?? '';
                expect(lastError).not.toBe('');
                expect(lastError).not.toContain(SYNTHETIC_SECRET);
                expect(lastError).not.toContain('session-');
            }
        }).pipe(Effect.provide(TestLayer))
    );
});
