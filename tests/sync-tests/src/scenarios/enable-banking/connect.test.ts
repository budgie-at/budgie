import {
    AccountEntityTable,
    AccountExternalIdEntityTable,
    AccountTypeEnum,
    BankIntegrationEntityTable,
    ExternalSourceEnum,
    PRECISION,
    SyncEntityTable,
    SyncModeEnum,
    TransactionEntityTable
} from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import {
    EnableBankingSyncService,
    ResyncService,
    SyncAccountBalanceStateEnum,
    SyncAccountContinuationRefusalEnum,
    SyncAccountTypeEnum,
    SyncProviderEnum,
    SyncTransactionTypeEnum
} from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import {
    buildEnableBankingToken,
    buildEnableBankingTransaction,
    ENABLE_BANKING_APPLICATION_ID,
    enableBankingDaysAgo,
    enableBankingStub,
    fetchAccountBalance,
    fetchEnableBankingTransactions,
    fetchSortedEnableBankingExternalIds,
    fetchSyncById,
    findOrSeedEur,
    makeEnableBankingSyncStale,
    makeStubFileBankSyncService,
    seed,
    skipRequestedSync,
    testDb,
    testSigner,
    TestLayer
} from '../../harness';

import type { SyncAccountInterface, SyncTransactionInterface } from '@budgie/sync';
import type { JsonBodyType } from 'msw';

const HASH = 'hash-connect';
const UID = 'uid-connect';
const SESSION = 'session-connect';
const IBAN = 'DE89370400440532013000';
const OTHER_IBAN = 'AT611904300234573201';
const ERSTE_ID = 'erste-account';
const DAY_MS = 24 * 60 * 60 * 1000;
const LAST_ROW_DAYS_AGO = 10;
const CALLBACK_URL = 'budgie://enable-banking/callback';
const TOKEN = buildEnableBankingToken(SESSION);
const VALID_UNTIL = '2099-01-01T00:00:00.000Z';

const noonDaysAgo = (days: number) => new Date(`${enableBankingDaysAgo(days)}T12:00:00.000Z`);

const startOfDayAfter = (days: number) => new Date(`${enableBankingDaysAgo(days - 1)}T00:00:00.000Z`);

const buildBankAccount = (overrides: Partial<SyncAccountInterface> = {}): SyncAccountInterface => ({
    id: HASH,
    provider: SyncProviderEnum.ENABLE_BANKING,
    currencyCode: 'EUR',
    currencyCodeNumeric: 978,
    balance: 0,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: 0,
    type: SyncAccountTypeEnum.CHECKING,
    title: 'Synthetic Bank Giro',
    ...overrides
});

const buildPdfRow = (id: string, time: Date): SyncTransactionInterface => ({
    id,
    provider: SyncProviderEnum.ERSTE,
    accountId: ERSTE_ID,
    type: SyncTransactionTypeEnum.EXPENSE,
    time: Math.floor(time.getTime() / 1000),
    description: 'SYNTHETIC CARD PAYMENT',
    mcc: 0,
    originalMcc: 0,
    amount: 5,
    operationAmount: 5,
    currencyCode: 978,
    commissionRate: 0,
    cashbackAmount: 0,
    balance: 0,
    hold: false,
    feeAmount: 0
});

interface SeedAccountOptions {
    readonly provider?: ExternalSourceEnum;
    readonly enabled?: boolean;
    readonly externalSource?: ExternalSourceEnum | null;
    readonly externalId?: string | null;
    readonly iban?: string | null;
    readonly rowDaysAgo?: readonly number[];
    readonly rowSource?: ExternalSourceEnum | null;
    readonly instrumentId?: number;
    readonly setupBalance?: number | null;
    readonly type?: AccountTypeEnum;
}

const seedConnectableAccount = (options: SeedAccountOptions = {}) =>
    Effect.gen(function* () {
        const instrumentId = options.instrumentId ?? (yield* findOrSeedEur()).id;
        const provider = options.provider ?? ExternalSourceEnum.ERSTE;
        const externalSource = options.externalSource === undefined ? provider : options.externalSource;
        const account = yield* seed.account({
            instrumentId,
            type: options.type ?? AccountTypeEnum.BANK_SYNC,
            externalId: options.externalId === undefined ? ERSTE_ID : options.externalId,
            externalSource,
            iban: options.iban ?? null
        });
        const sync = yield* seed.sync({
            accountId: account.id,
            provider,
            enabled: options.enabled ?? true,
            token: `integration-${provider}`,
            setupBalance: options.setupBalance ?? null
        });
        const rowSource = options.rowSource === undefined ? provider : options.rowSource;
        for (const [index, days] of (options.rowDaysAgo ?? [LAST_ROW_DAYS_AGO, LAST_ROW_DAYS_AGO + 5]).entries()) {
            yield* seed.manualExpense({
                accountId: account.id,
                amount: 5 * PRECISION,
                operatedAt: noonDaysAgo(days),
                title: `Row ${index}`,
                ...(isDefined(rowSource) && { externalSource: rowSource, externalId: `erste-row-${index}` })
            });
        }
        const balances = yield* AccountBalanceIncrementalService;
        yield* balances.updateBalancesByAccountIds([account.id]);

        return { account, sync };
    });

const stubBank = (balance = '100.00', rows: JsonBodyType[] = []) => {
    enableBankingStub.session(SESSION, [{ uid: UID, hash: HASH }]);
    enableBankingStub.balances(UID, balance);
    enableBankingStub.transactions(UID, () => ({ transactions: rows }));
};

const connect = (accountId: number, bankAccount: SyncAccountInterface = buildBankAccount()) =>
    Effect.flatMap(EnableBankingSyncService, service => skipRequestedSync(service.connectAccount(accountId, TOKEN, bankAccount)));

const fetchAccount = (accountId: number) =>
    Effect.map(testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.id, accountId)), ([account]) => account);

const fetchAccountRows = (accountId: number) =>
    Effect.map(testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.fromAccountId, accountId)), rows =>
        rows.filter(row => !isDefined(row.deletedAt))
    );

const findIntegrationId = (token: string) =>
    Effect.map(
        testDb.select().from(BankIntegrationEntityTable).where(eq(BankIntegrationEntityTable.token, token)),
        integrations => integrations.at(0)?.id ?? null
    );

const requireIntegrationId = (token: string) => Effect.map(findIntegrationId(token), id => id ?? 0);

const importPdf = (rows: readonly SyncTransactionInterface[], bankAccountId = ERSTE_ID, iban?: string) =>
    Effect.gen(function* () {
        const service = yield* makeStubFileBankSyncService(ExternalSourceEnum.ERSTE, {
            getAccounts: () => [
                buildBankAccount({ id: bankAccountId, provider: SyncProviderEnum.ERSTE, ...(isDefined(iban) && { iban }) })
            ],
            getTransactions: () => [...rows]
        });

        yield* service.executeImportForSelectedAccounts('statement.pdf', [bankAccountId]);
    });

const refusalOf = (accountId: number, bankAccount: SyncAccountInterface = buildBankAccount()) =>
    Effect.map(Effect.flip(connect(accountId, bankAccount)), error => ('reason' in error ? error.reason : error._tag));

describe('enable-banking/connect refusals', () => {
    it.effect('refuses an IBAN mismatch when both are known', () =>
        Effect.gen(function* () {
            const { account } = yield* seedConnectableAccount({ iban: IBAN });

            expect(yield* refusalOf(account.id, buildBankAccount({ iban: OTHER_IBAN }))).toBe(
                SyncAccountContinuationRefusalEnum.IBAN_MISMATCH
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('accepts when the account or the bank has no IBAN', () =>
        Effect.gen(function* () {
            const { account } = yield* seedConnectableAccount({ iban: IBAN });
            const service = yield* EnableBankingSyncService;
            stubBank();

            expect(yield* skipRequestedSync(service.connectAccount(account.id, TOKEN, buildBankAccount()))).toEqual(
                startOfDayAfter(LAST_ROW_DAYS_AGO)
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('refuses a different currency', () =>
        Effect.gen(function* () {
            const { account } = yield* seedConnectableAccount();

            expect(yield* refusalOf(account.id, buildBankAccount({ currencyCode: 'USD' }))).toBe(
                SyncAccountContinuationRefusalEnum.CURRENCY_MISMATCH
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('refuses a bank account linked to another account by id, alias or IBAN', () =>
        Effect.gen(function* () {
            const eur = yield* findOrSeedEur();
            const { account } = yield* seedConnectableAccount({ instrumentId: eur.id });
            yield* seed.account({ instrumentId: eur.id, externalId: 'hash-by-id' });
            const byAlias = yield* seed.account({ instrumentId: eur.id, externalId: 'current' });
            yield* testDb.insert(AccountExternalIdEntityTable).values({ externalId: 'hash-by-alias', accountId: byAlias.id });
            yield* seed.account({ instrumentId: eur.id, externalId: 'other', iban: IBAN });

            for (const bankAccount of [
                buildBankAccount({ id: 'hash-by-id' }),
                buildBankAccount({ id: 'hash-by-alias' }),
                buildBankAccount({ id: 'hash-free', iban: IBAN })
            ]) {
                expect(yield* refusalOf(account.id, bankAccount)).toBe(SyncAccountContinuationRefusalEnum.LINKED_ELSEWHERE);
            }
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reads the live check from bank_syncs, so a Monobank sync with an empty external source is refused', () =>
        Effect.gen(function* () {
            const { account } = yield* seedConnectableAccount({ provider: ExternalSourceEnum.MONOBANK, externalSource: null });

            expect(account.externalSource).toBeNull();
            expect(yield* refusalOf(account.id)).toBe(SyncAccountContinuationRefusalEnum.LIVE_SYNC);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('accepts a target whose live provider sync is disabled and deletes its integration once unreferenced', () =>
        Effect.gen(function* () {
            const { account, sync } = yield* seedConnectableAccount({
                provider: ExternalSourceEnum.MONOBANK,
                enabled: false,
                setupBalance: 7
            });
            stubBank();

            yield* connect(account.id);

            expect(yield* findIntegrationId('integration-MONOBANK')).toBeNull();
            expect((yield* fetchSyncById(sync.id)).setupBalance).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the old integration while another account still references it', () =>
        Effect.gen(function* () {
            const eur = yield* findOrSeedEur();
            const { account } = yield* seedConnectableAccount({ instrumentId: eur.id });
            yield* seedConnectableAccount({ instrumentId: eur.id, externalId: 'second-erste', rowDaysAgo: [] });
            stubBank();

            yield* connect(account.id);

            expect(yield* findIntegrationId('integration-ERSTE')).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('shows choices for a Connect return: a refusal per row and the IBAN match suggested', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { account } = yield* seedConnectableAccount({ iban: IBAN });
            enableBankingStub.authorizeSession(
                'session-choices',
                'Synthetic Bank',
                [
                    { account_id: { iban: OTHER_IBAN }, currency: 'EUR', cash_account_type: 'CACC', identification_hash: 'hash-other' },
                    { account_id: { iban: IBAN }, currency: 'EUR', cash_account_type: 'CACC', identification_hash: 'hash-match' },
                    { currency: 'USD', cash_account_type: 'CACC', identification_hash: 'hash-usd' },
                    { currency: 'EUR', cash_account_type: 'CACC', identification_hash: 'hash-plain' }
                ],
                VALID_UNTIL
            );

            const result = yield* service.completeAuthorization(
                {
                    state: 'state-choices',
                    applicationId: ENABLE_BANKING_APPLICATION_ID,
                    aspspName: 'Synthetic Bank',
                    aspspCountry: 'DE',
                    integrationId: null,
                    connectAccountId: account.id,
                    callbackUrl: CALLBACK_URL,
                    expiresAtMs: Date.now() + 60_000
                },
                `${CALLBACK_URL}?code=c&state=state-choices`
            );

            expect(result.connectChoices?.accountId).toBe(account.id);
            expect(result.connectChoices?.suggestedExternalId).toBe('hash-match');
            expect(Object.fromEntries(result.connectChoices?.refusals ?? [])).toEqual({
                'hash-other': SyncAccountContinuationRefusalEnum.IBAN_MISMATCH,
                'hash-usd': SyncAccountContinuationRefusalEnum.CURRENCY_MISMATCH
            });
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('enable-banking/connect switch', () => {
    const switchCases = [
        { name: 'an IBAN account', options: { iban: IBAN }, bankAccount: buildBankAccount({ iban: IBAN }) },
        { name: 'a no-IBAN account', options: {}, bankAccount: buildBankAccount() },
        { name: 'a non-Erste account', options: { provider: ExternalSourceEnum.PRIVATBANK }, bankAccount: buildBankAccount() }
    ];

    for (const { name, options, bankAccount } of switchCases) {
        it.effect(`continues ${name} on the same sync row, forward from the day after its last row`, () =>
            Effect.gen(function* () {
                const service = yield* EnableBankingSyncService;
                const { account, sync } = yield* seedConnectableAccount(options);
                const rowsBefore = yield* fetchAccountRows(account.id);
                stubBank('90.00', [
                    buildEnableBankingTransaction({
                        entry_reference: 'before-start',
                        booking_date: enableBankingDaysAgo(LAST_ROW_DAYS_AGO)
                    }),
                    buildEnableBankingTransaction({
                        entry_reference: 'after-start',
                        booking_date: enableBankingDaysAgo(LAST_ROW_DAYS_AGO - 1)
                    }),
                    buildEnableBankingTransaction({ entry_reference: 'recent', booking_date: enableBankingDaysAgo(2) })
                ]);

                const startAt = yield* connect(account.id, bankAccount);

                expect(startAt).toEqual(startOfDayAfter(LAST_ROW_DAYS_AGO));
                const stored = yield* fetchSyncById(sync.id);
                expect(stored).toMatchObject({
                    id: sync.id,
                    provider: ExternalSourceEnum.ENABLE_BANKING,
                    mode: SyncModeEnum.FORWARD,
                    backwardSyncLimitAt: startAt,
                    forwardSyncFromAt: startAt,
                    forwardSyncedAt: null
                });
                expect(yield* fetchAccount(account.id)).toMatchObject({
                    externalId: HASH,
                    externalSource: ExternalSourceEnum.ENABLE_BANKING
                });
                expect(
                    yield* testDb.select().from(AccountExternalIdEntityTable).where(eq(AccountExternalIdEntityTable.accountId, account.id))
                ).toEqual([{ externalId: ERSTE_ID, accountId: account.id }]);

                yield* service.sync();

                expect(enableBankingStub.requests.some(request => request.includes('strategy=longest'))).toBe(false);
                expect(yield* fetchSortedEnableBankingExternalIds()).toEqual([`${HASH}:after-start`, `${HASH}:recent`]);
                const rowsAfter = yield* fetchAccountRows(account.id);
                expect(rowsAfter.filter(row => rowsBefore.some(before => before.id === row.id))).toEqual(rowsBefore);
                expect(yield* fetchAccountBalance(account.id)).toBe(90 * PRECISION);
            }).pipe(Effect.provide(TestLayer))
        );
    }

    it.effect('reactivates a hidden account', () =>
        Effect.gen(function* () {
            const { account } = yield* seedConnectableAccount();
            yield* testDb.update(AccountEntityTable).set({ isActive: false }).where(eq(AccountEntityTable.id, account.id));
            stubBank();

            yield* connect(account.id);

            expect((yield* fetchAccount(account.id)).isActive).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('starts from the last live row, ignoring deleted rows', () =>
        Effect.gen(function* () {
            const { account } = yield* seedConnectableAccount();
            const deleted = yield* seed.manualExpense({ accountId: account.id, amount: PRECISION, operatedAt: noonDaysAgo(3) });
            yield* testDb.update(TransactionEntityTable).set({ deletedAt: new Date() }).where(eq(TransactionEntityTable.id, deleted.id));
            stubBank();

            expect(yield* connect(account.id)).toEqual(startOfDayAfter(LAST_ROW_DAYS_AGO));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('sends an empty account through normal history import', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { account, sync } = yield* seedConnectableAccount({ rowDaysAgo: [] });
            const queries: URLSearchParams[] = [];
            enableBankingStub.session(SESSION, [{ uid: UID, hash: HASH }]);
            enableBankingStub.balances(UID, '50.00');
            enableBankingStub.transactions(UID, ({ query }) => {
                queries.push(query);

                return { transactions: [buildEnableBankingTransaction({ booking_date: enableBankingDaysAgo(400) })] };
            });

            expect(yield* connect(account.id)).toBeNull();
            expect((yield* fetchSyncById(sync.id)).mode).toBe(SyncModeEnum.BACKWARD);

            yield* service.sync();

            expect(queries[0].get('strategy')).toBe('longest');
            expect(yield* fetchEnableBankingTransactions()).toHaveLength(1);
            expect(yield* fetchAccountBalance(account.id)).toBe(50 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a re-fetch, a re-consent and a full re-sync create no rows and never cross the start date', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const resync = yield* ResyncService;
            const { account, sync } = yield* seedConnectableAccount();
            const lateRow = buildEnableBankingTransaction({
                entry_reference: 'before-start',
                booking_date: enableBankingDaysAgo(LAST_ROW_DAYS_AGO)
            });
            const newRow = buildEnableBankingTransaction({ entry_reference: 'new', booking_date: enableBankingDaysAgo(1) });
            stubBank('80.00', [lateRow, newRow]);
            const startAt = yield* connect(account.id);

            yield* service.sync();
            const countAfterFirstSync = (yield* fetchAccountRows(account.id)).length;

            yield* makeEnableBankingSyncStale(sync.id);
            yield* service.sync();
            expect((yield* fetchAccountRows(account.id)).length).toBe(countAfterFirstSync);

            enableBankingStub.authorizeSession(
                'session-reconsent',
                'Synthetic Bank',
                [{ currency: 'EUR', cash_account_type: 'CACC', identification_hash: HASH }],
                VALID_UNTIL
            );
            enableBankingStub.session('session-reconsent', [{ uid: UID, hash: HASH }]);
            yield* skipRequestedSync(
                service.completeAuthorization(
                    {
                        state: 'state-reconsent',
                        applicationId: ENABLE_BANKING_APPLICATION_ID,
                        aspspName: 'Synthetic Bank',
                        aspspCountry: 'DE',
                        integrationId: (yield* fetchAccount(account.id)).integrationId,
                        connectAccountId: null,
                        callbackUrl: CALLBACK_URL,
                        expiresAtMs: Date.now() + 60_000
                    },
                    `${CALLBACK_URL}?code=c&state=state-reconsent`
                )
            );
            yield* service.sync();
            expect((yield* fetchAccountRows(account.id)).length).toBe(countAfterFirstSync);

            yield* skipRequestedSync(resync.resync({ accountId: account.id, sinceDays: null }));
            expect((yield* fetchSyncById(sync.id)).backwardSyncLimitAt).toEqual(startAt);
            yield* service.sync();

            expect((yield* fetchAccountRows(account.id)).length).toBe(countAfterFirstSync);
            expect((yield* fetchEnableBankingTransactions()).map(row => row.externalId)).toEqual([`${HASH}:new`]);
            expect(yield* fetchAccountBalance(account.id)).toBe(80 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('enable-banking/connect known boundary', () => {
    it.effect('a row on the last day, absent from the PDF, is lost and adjusted', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { account } = yield* seedConnectableAccount();
            const rowsBefore = (yield* fetchAccountRows(account.id)).length;
            stubBank('77.00', [
                buildEnableBankingTransaction({ entry_reference: 'missing', booking_date: enableBankingDaysAgo(LAST_ROW_DAYS_AGO) })
            ]);

            yield* connect(account.id);
            yield* service.sync();

            expect(yield* fetchEnableBankingTransactions()).toEqual([]);
            expect((yield* fetchAccountRows(account.id)).length).toBe(rowsBefore);
            expect(yield* fetchAccountBalance(account.id)).toBe(77 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a row in the PDF booked the next day double-counts and is adjusted', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { account } = yield* seedConnectableAccount();
            stubBank('77.00', [
                buildEnableBankingTransaction({
                    entry_reference: 'same-payment',
                    booking_date: enableBankingDaysAgo(LAST_ROW_DAYS_AGO - 1),
                    transaction_amount: { amount: '5.00', currency: 'EUR' }
                })
            ]);

            yield* connect(account.id);
            yield* service.sync();

            expect(yield* fetchEnableBankingTransactions()).toHaveLength(1);
            expect(yield* fetchAccountBalance(account.id)).toBe(77 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a late-booked row before the start date is lost and adjusted', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { account, sync } = yield* seedConnectableAccount();
            stubBank('77.00');
            yield* connect(account.id);
            yield* service.sync();

            yield* makeEnableBankingSyncStale(sync.id);
            stubBank('65.00', [
                buildEnableBankingTransaction({ entry_reference: 'late', booking_date: enableBankingDaysAgo(LAST_ROW_DAYS_AGO) })
            ]);
            yield* service.sync();

            expect(yield* fetchEnableBankingTransactions()).toEqual([]);
            expect(yield* fetchAccountBalance(account.id)).toBe(65 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('enable-banking/connect later PDF import', () => {
    it.effect('finds a no-IBAN account through the alias, imports older rows and drops rows from the start date on', () =>
        Effect.gen(function* () {
            const { account } = yield* seedConnectableAccount();
            stubBank();
            yield* connect(account.id);
            const rowsBefore = (yield* fetchAccountRows(account.id)).length;
            const balanceBefore = yield* fetchAccountBalance(account.id);

            yield* importPdf([
                buildPdfRow('erste-row-0', noonDaysAgo(LAST_ROW_DAYS_AGO)),
                buildPdfRow('older-unknown', noonDaysAgo(LAST_ROW_DAYS_AGO + 1)),
                buildPdfRow('from-start', startOfDayAfter(LAST_ROW_DAYS_AGO)),
                buildPdfRow('recent', noonDaysAgo(1))
            ]);

            const rows = yield* fetchAccountRows(account.id);
            expect(rows.length).toBe(rowsBefore + 1);
            expect(rows.map(row => row.externalId)).toContain('older-unknown');
            expect(rows.map(row => row.externalId)).not.toContain('from-start');
            expect(yield* testDb.select().from(AccountEntityTable)).toHaveLength(1);
            expect(yield* fetchAccountBalance(account.id)).toBe((balanceBefore ?? 0) - 5 * PRECISION);
            expect((yield* testDb.select().from(SyncEntityTable))[0].provider).toBe(ExternalSourceEnum.ENABLE_BANKING);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('finds an IBAN account by IBAN and drops rows from the start date on', () =>
        Effect.gen(function* () {
            const { account } = yield* seedConnectableAccount({ iban: IBAN, externalId: null });
            stubBank();
            yield* connect(account.id, buildBankAccount({ iban: IBAN }));
            const rowsBefore = (yield* fetchAccountRows(account.id)).length;

            yield* importPdf([buildPdfRow('recent', noonDaysAgo(1))], 'pdf-account', IBAN);

            expect((yield* fetchAccountRows(account.id)).length).toBe(rowsBefore);
            expect(yield* testDb.select().from(AccountEntityTable)).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('after a disconnect drops only the rows the connection delivered', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { account } = yield* seedConnectableAccount();
            stubBank('90.00', [buildEnableBankingTransaction({ entry_reference: 'live', booking_date: enableBankingDaysAgo(3) })]);
            yield* connect(account.id);
            yield* service.sync();
            enableBankingStub.deleteSession(SESSION);
            yield* service.disconnect(yield* requireIntegrationId(TOKEN));
            const rowsBefore = (yield* fetchAccountRows(account.id)).length;

            yield* importPdf([
                buildPdfRow('delivered-by-connection', noonDaysAgo(3)),
                buildPdfRow('after-disconnect', new Date(Date.now() + DAY_MS))
            ]);

            const rows = (yield* fetchAccountRows(account.id)).map(row => row.externalId);
            expect(rows).toHaveLength(rowsBefore + 1);
            expect(rows).toContain('after-disconnect');
            expect(rows).not.toContain('delivered-by-connection');
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('enable-banking/connect disconnect', () => {
    it.effect('returns an account with PDF rows to its provider with rows and balance unchanged', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { account, sync } = yield* seedConnectableAccount();
            stubBank('90.00', [buildEnableBankingTransaction({ entry_reference: 'live', booking_date: enableBankingDaysAgo(3) })]);
            yield* connect(account.id);
            yield* service.sync();
            enableBankingStub.deleteSession(SESSION);
            const rowsBefore = yield* fetchAccountRows(account.id);

            yield* service.disconnect(yield* requireIntegrationId(TOKEN));

            expect(yield* fetchAccountRows(account.id)).toEqual(rowsBefore);
            expect(yield* fetchAccountBalance(account.id)).toBe(90 * PRECISION);
            expect(yield* fetchAccount(account.id)).toMatchObject({
                deletedAt: null,
                type: AccountTypeEnum.BANK_SYNC,
                externalId: ERSTE_ID,
                externalSource: ExternalSourceEnum.ERSTE,
                integrationId: null
            });
            expect(yield* fetchSyncById(sync.id)).toMatchObject({ provider: ExternalSourceEnum.ERSTE, enabled: true, reconciledAt: null });
            expect(testSigner.deletedKeyIds).toEqual([ENABLE_BANKING_APPLICATION_ID]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns a manual account to its type and removes the sync row', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const eur = yield* findOrSeedEur();
            const account = yield* seed.account({ instrumentId: eur.id, type: AccountTypeEnum.BANK });
            const manual = yield* seed.manualExpense({ accountId: account.id, amount: 5 * PRECISION, operatedAt: noonDaysAgo(9) });
            const balances = yield* AccountBalanceIncrementalService;
            yield* balances.updateBalancesByAccountIds([account.id]);
            stubBank('90.00');
            expect(yield* connect(account.id)).toEqual(startOfDayAfter(9));
            expect((yield* fetchAccount(account.id)).type).toBe(AccountTypeEnum.BANK_SYNC);
            yield* service.sync();
            enableBankingStub.deleteSession(SESSION);

            yield* service.disconnect(yield* requireIntegrationId(TOKEN));

            expect(yield* fetchAccount(account.id)).toMatchObject({
                deletedAt: null,
                type: AccountTypeEnum.BANK,
                externalId: null,
                externalSource: null,
                integrationId: null
            });
            expect(yield* testDb.select().from(SyncEntityTable)).toEqual([]);
            expect((yield* fetchAccountRows(account.id)).map(row => row.id)).toContain(manual.id);
            expect(yield* fetchAccountBalance(account.id)).toBe(90 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('returns a Monobank account disabled, because its token is gone', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { account, sync } = yield* seedConnectableAccount({ provider: ExternalSourceEnum.MONOBANK, enabled: false });
            stubBank('90.00');
            yield* connect(account.id);
            enableBankingStub.deleteSession(SESSION);

            yield* service.disconnect(yield* requireIntegrationId(TOKEN));

            expect(yield* fetchSyncById(sync.id)).toMatchObject({ provider: ExternalSourceEnum.MONOBANK, enabled: false });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('still archives an account holding only rows from this connection and its balance adjustment', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { account } = yield* seedConnectableAccount({ rowDaysAgo: [] });
            stubBank('90.00', [buildEnableBankingTransaction()]);
            yield* connect(account.id);
            yield* service.sync();
            enableBankingStub.deleteSession(SESSION);

            yield* service.disconnect(yield* requireIntegrationId(TOKEN));

            expect((yield* fetchAccount(account.id)).deletedAt).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a failed key deletion keeps a continued account connected', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { account } = yield* seedConnectableAccount();
            stubBank();
            yield* connect(account.id);
            enableBankingStub.deleteSession(SESSION);
            testSigner.markUndeletable(ENABLE_BANKING_APPLICATION_ID);

            const error = yield* Effect.flip(service.disconnect(yield* requireIntegrationId(TOKEN)));

            expect(error._tag).toBe('SyncDeferredError');
            expect((yield* fetchAccount(account.id)).externalSource).toBe(ExternalSourceEnum.ENABLE_BANKING);
            testSigner.clearUndeletable(ENABLE_BANKING_APPLICATION_ID);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('parks the released bank account in the create flow and lets it reconnect through Connect', () =>
        Effect.gen(function* () {
            const service = yield* EnableBankingSyncService;
            const { account } = yield* seedConnectableAccount();
            stubBank();
            yield* connect(account.id);
            enableBankingStub.deleteSession(SESSION);
            yield* service.disconnect(yield* requireIntegrationId(TOKEN));
            enableBankingStub.authorizeSession(
                'session-again',
                'Synthetic Bank',
                [{ currency: 'EUR', cash_account_type: 'CACC', identification_hash: HASH }],
                VALID_UNTIL
            );

            const result = yield* service.completeAuthorization(
                {
                    state: 'state-again',
                    applicationId: ENABLE_BANKING_APPLICATION_ID,
                    aspspName: 'Synthetic Bank',
                    aspspCountry: 'DE',
                    integrationId: null,
                    connectAccountId: null,
                    callbackUrl: CALLBACK_URL,
                    expiresAtMs: Date.now() + 60_000
                },
                `${CALLBACK_URL}?code=c&state=state-again`
            );

            expect(result.previews[0]).toMatchObject({ externalId: HASH, isParked: true, existingAccountId: account.id });
            stubBank();
            expect(yield* connect(account.id)).toEqual(startOfDayAfter(LAST_ROW_DAYS_AGO));
        }).pipe(Effect.provide(TestLayer))
    );
});
