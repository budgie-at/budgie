import {
    AccountEntityTable,
    AccountTypeEnum,
    BankIntegrationEntityTable,
    ExternalSourceEnum,
    PRECISION,
    TransactionEntityTable
} from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import {
    EnableBankingSyncService,
    SyncAccountBalanceStateEnum,
    SyncAccountTypeEnum,
    SyncProviderEnum,
    SyncTransactionTypeEnum
} from '@budgie/sync';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { makeStubFileBankSyncService } from '../file-sync/make-stub-file-bank-sync-service';
import { testDb } from '../scenario/setup';
import { seed } from '../seed/seed';
import { skipRequestedSync } from '../sync-workload/skip-requested-sync';

import { buildEnableBankingToken, findOrSeedEur } from './enable-banking-scenario';
import {
    buildEnableBankingTransaction,
    ENABLE_BANKING_APPLICATION_ID,
    enableBankingDaysAgo,
    enableBankingStub
} from './enable-banking-stub';

import type { SyncAccountInterface, SyncTransactionInterface } from '@budgie/sync';
import type { JsonBodyType } from 'msw';

export const HASH = 'hash-connect';
export const UID = 'uid-connect';
export const SESSION = 'session-connect';
export const IBAN = 'DE89370400440532013000';
export const OTHER_IBAN = 'AT611904300234573201';
export const ERSTE_ID = 'erste-account';
export const DAY_MS = 24 * 60 * 60 * 1000;
export const LAST_ROW_DAYS_AGO = 10;
export const CALLBACK_URL = 'budgie://enable-banking/callback';
export const TOKEN = buildEnableBankingToken(SESSION);
export const VALID_UNTIL = '2099-01-01T00:00:00.000Z';

export const buildPending = (state: string, connectAccountId: number | null = null, integrationId: number | null = null) => ({
    state,
    applicationId: ENABLE_BANKING_APPLICATION_ID,
    aspspName: 'Synthetic Bank',
    aspspCountry: 'DE',
    integrationId,
    connectAccountId,
    callbackUrl: CALLBACK_URL,
    expiresAtMs: Date.now() + 60_000
});

export const noonDaysAgo = (days: number) => new Date(`${enableBankingDaysAgo(days)}T12:00:00.000Z`);

export const startOfDayAfter = (days: number) => new Date(`${enableBankingDaysAgo(days - 1)}T00:00:00.000Z`);

export const buildBankAccount = (overrides: Partial<SyncAccountInterface> = {}): SyncAccountInterface => ({
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

export const buildPdfRow = (id: string, time: Date): SyncTransactionInterface => ({
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

export const seedConnectableAccount = (options: SeedAccountOptions = {}) =>
    Effect.gen(function* () {
        const instrumentId = options.instrumentId ?? (yield* findOrSeedEur).id;
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

export const stubBank = (balance = '100.00', rows: JsonBodyType[] = []) => {
    enableBankingStub.session(SESSION, [{ uid: UID, hash: HASH }]);
    enableBankingStub.balances(UID, balance);
    enableBankingStub.transactions(UID, () => ({ transactions: rows }));
};

export const connect = (accountId: number, bankAccount: SyncAccountInterface = buildBankAccount()) =>
    Effect.flatMap(EnableBankingSyncService, service => skipRequestedSync(service.connectAccount(accountId, TOKEN, bankAccount)));

export const fetchAccount = (accountId: number) =>
    Effect.map(testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.id, accountId)), ([account]) => account);

export const fetchAccountRows = (accountId: number) =>
    Effect.map(testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.fromAccountId, accountId)), rows =>
        rows.filter(row => !isDefined(row.deletedAt))
    );

export const findIntegrationId = (token: string) =>
    Effect.map(
        testDb.select().from(BankIntegrationEntityTable).where(eq(BankIntegrationEntityTable.token, token)),
        integrations => integrations.at(0)?.id ?? null
    );

export const requireIntegrationId = (token: string) => Effect.map(findIntegrationId(token), id => id ?? 0);

export const importPdf = (rows: readonly SyncTransactionInterface[], bankAccountId = ERSTE_ID, iban?: string) =>
    Effect.gen(function* () {
        const service = yield* makeStubFileBankSyncService(ExternalSourceEnum.ERSTE, {
            getAccounts: () => [
                buildBankAccount({ id: bankAccountId, provider: SyncProviderEnum.ERSTE, ...(isDefined(iban) && { iban }) })
            ],
            getTransactions: () => [...rows]
        });

        yield* service.executeImportForSelectedAccounts('statement.pdf', [bankAccountId]);
    });

export const refusalOf = (accountId: number, bankAccount: SyncAccountInterface = buildBankAccount()) =>
    Effect.map(Effect.flip(connect(accountId, bankAccount)), error => ('reason' in error ? error.reason : error._tag));

export const connectSyncedReadyToDisconnect = (accountId: number) =>
    Effect.gen(function* () {
        const service = yield* EnableBankingSyncService;
        stubBank('90.00', [buildEnableBankingTransaction({ entry_reference: 'live', booking_date: enableBankingDaysAgo(3) })]);
        yield* connect(accountId);
        yield* service.sync();
        enableBankingStub.deleteSession(SESSION);
    });

export const seedConnectedReadyToDisconnect = Effect.gen(function* () {
    const { account } = yield* seedConnectableAccount();
    stubBank();
    yield* connect(account.id);
    enableBankingStub.deleteSession(SESSION);

    return account;
});
