import { AccountEntityTable, AccountTypeEnum, ExternalSourceEnum, PRECISION, SyncModeEnum } from '@budgie/contracts';
import { EnableBankingSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    buildEnableBankingToken,
    buildEnableBankingTransaction,
    ENABLE_BANKING_APPLICATION_ID,
    enableBankingStub,
    fetchAccountBalance,
    fetchSyncById,
    seed,
    seedEnableBankingAccount,
    seedLinkedEnableBankingAccount,
    skipRequestedSync,
    testDb,
    TestLayer
} from '../../harness';

const HASH = 'hash-reconcile';
const UID = 'uid-reconcile';
const SESSION = 'session-reconcile';
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const IBAN = 'DE89370400440532013000';
const CALLBACK_URL = 'budgie://enable-banking/callback';

describe('enable-banking/reconciliation', () => {
    it.effect('reconciles with the lookback because the stored cursor is fetchStartedAt, not the overlap', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { account, sync } = yield* seedLinkedEnableBankingAccount(HASH, UID, SESSION);
            enableBankingStub.balances(UID, '250.50');
            const queries: URLSearchParams[] = [];
            enableBankingStub.transactions(UID, ({ query }) => {
                queries.push(query);

                return { transactions: [buildEnableBankingTransaction()] };
            });
            const startedAtMs = Date.now();

            yield* service.sync();

            const stored = yield* fetchSyncById(sync.id);
            expect(queries[0].get('date_from')).toBe(
                new Date((sync.forwardSyncFromAt?.getTime() ?? 0) - 7 * MILLISECONDS_PER_DAY).toISOString().slice(0, 10)
            );
            expect(stored.forwardSyncFromAt?.getTime()).toBeGreaterThanOrEqual(Math.floor(startedAtMs / 1000) * 1000);
            expect(stored.reconciledBalance).toBe(250.5 * PRECISION);
            expect(yield* fetchAccountBalance(account.id)).toBe(250.5 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('fails the batch for a bank exposing no booked balance and never uses an available balance', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { sync } = yield* seedLinkedEnableBankingAccount(HASH, UID, SESSION);
            enableBankingStub.balances(UID, '999.00', 'ITAV');

            yield* service.sync();

            expect(yield* fetchSyncById(sync.id)).toMatchObject({ reconciledAt: null, forwardSyncedAt: null, mode: SyncModeEnum.FORWARD });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('shows an account whose IBAN belongs to another provider as not connectable and never relinks it', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const eur = yield* seedEnableBankingAccount({ hash: 'hash-seed', token: buildEnableBankingToken('session-seed') });
            const monobankAccount = yield* seed.account({
                externalId: 'mono-account',
                externalSource: ExternalSourceEnum.MONOBANK,
                type: AccountTypeEnum.BANK_SYNC,
                instrumentId: eur.account.instrumentId,
                iban: IBAN
            });
            yield* seed.sync({ accountId: monobankAccount.id, provider: ExternalSourceEnum.MONOBANK });
            enableBankingStub.authorizeSession(
                'session-iban',
                'Synthetic Bank',
                [
                    {
                        uid: 'uid-iban',
                        identification_hash: 'hash-iban',
                        identification_hashes: ['hash-iban'],
                        account_id: { iban: IBAN },
                        cash_account_type: 'CACC',
                        currency: 'EUR'
                    }
                ],
                '2099-06-01T00:00:00.000Z'
            );

            const result = yield* service.completeAuthorization(
                {
                    state: 'state-iban',
                    applicationId: ENABLE_BANKING_APPLICATION_ID,
                    aspspName: 'Synthetic Bank',
                    aspspCountry: 'DE',
                    integrationId: null,
                    callbackUrl: CALLBACK_URL,
                    expiresAtMs: Date.now() + 60_000
                },
                `${CALLBACK_URL}?code=code-iban&state=state-iban`
            );

            expect(result.integrationId).toBeNull();
            expect(result.previews[0]).toMatchObject({ externalId: 'hash-iban', isParked: true, existingAccountId: monobankAccount.id });

            const connected = yield* skipRequestedSync(service.setupAccountSyncBatch(result.token, result.accounts, ['hash-iban']));

            expect(connected).toBe(0);
            const [stored] = yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.id, monobankAccount.id));
            expect(stored).toMatchObject({ externalId: 'mono-account', externalSource: ExternalSourceEnum.MONOBANK });
        }).pipe(Effect.provide(TestLayer))
    );
});
