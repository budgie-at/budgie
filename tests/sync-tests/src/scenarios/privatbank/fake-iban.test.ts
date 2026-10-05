import { AccountEntityTable, ExternalSourceEnum, normalizeAccountIban } from '@budgie/contracts';
import { privatbankAccountMapper, SyncAccountBalanceStateEnum, SyncAccountTypeEnum, SyncProviderEnum } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { makeStubFileBankSyncService, seed, testDb, TestLayer } from '../../harness';

import type { FileBasedSyncClientInterface, SyncAccountInterface, SyncTransactionInterface } from '@budgie/sync';

const buildPrivatbankRow = (card: string) => ({
    rawDate: '13.01.2026 11:42:53',
    date: new Date('2026-01-13T09:42:53.000Z'),
    deviceLocalDate: new Date('2026-01-13T09:42:53.000Z'),
    category: 'Зарахування переказу',
    card,
    description: 'З гривневого рахунку ФОП',
    cardAmount: 40_000,
    cardCurrency: 'UAH',
    operationAmount: 40_000,
    operationCurrency: 'UAH',
    endBalance: 12_345.67,
    balanceCurrency: 'UAH'
});

const EXISTING_CARD = '5168 **** **** 0356';
const IMPORTED_CARD = '5523 **** **** 0356';
const STATEMENT_URI = 'privatbank-fake-iban.xlsx';
const REAL_IBAN = 'UA393220010000026000340124555';

class AccountOnlyClient implements FileBasedSyncClientInterface {
    constructor(private readonly account: SyncAccountInterface) {}

    getAccounts(): SyncAccountInterface[] {
        return [this.account];
    }

    getTransactions(): SyncTransactionInterface[] {
        return [];
    }
}

const buildRealIbanAccount = (): SyncAccountInterface => ({
    id: 'monobank-new-external-id',
    provider: SyncProviderEnum.MONOBANK,
    currencyCode: 'UAH',
    currencyCodeNumeric: 980,
    balance: 0,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: 0,
    type: SyncAccountTypeEnum.CARD,
    iban: REAL_IBAN
});

const fetchActiveAccounts = () => testDb.select().from(AccountEntityTable).where(isNull(AccountEntityTable.deletedAt));

describe('privatbank/fake-iban', () => {
    it.effect('never binds a new card to an existing account through a placeholder IBAN with the same card ending', () =>
        Effect.gen(function* () {
            const existingAccount = yield* seed.account({
                externalId: EXISTING_CARD,
                externalSource: ExternalSourceEnum.PRIVATBANK,
                iban: 'UA00PRIVATBANK0356'
            });
            const [importedAccount] = privatbankAccountMapper([buildPrivatbankRow(IMPORTED_CARD)]);
            const syncService = yield* makeStubFileBankSyncService(ExternalSourceEnum.PRIVATBANK, new AccountOnlyClient(importedAccount));

            const [preview] = yield* syncService.importPreview(STATEMENT_URI);
            yield* syncService.executeImportForSelectedAccounts(STATEMENT_URI, [IMPORTED_CARD]);

            expect(preview).toMatchObject({ existingAccountId: null, iban: null });
            expect((yield* fetchActiveAccounts()).map(account => account.externalId).toSorted()).toEqual([EXISTING_CARD, IMPORTED_CARD]);
            expect(existingAccount.externalId).toBe(EXISTING_CARD);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('still binds an account through a real IBAN when the external id changed', () =>
        Effect.gen(function* () {
            const existingAccount = yield* seed.account({
                externalId: 'monobank-old-external-id',
                externalSource: ExternalSourceEnum.MONOBANK,
                iban: REAL_IBAN
            });
            const syncService = yield* makeStubFileBankSyncService(
                ExternalSourceEnum.MONOBANK,
                new AccountOnlyClient(buildRealIbanAccount())
            );

            const [preview] = yield* syncService.importPreview(STATEMENT_URI);

            expect(preview).toMatchObject({ existingAccountId: existingAccount.id, iban: REAL_IBAN });
        }).pipe(Effect.provide(TestLayer))
    );

    it('generates an IBAN the account schema accepts', () => {
        const [account] = privatbankAccountMapper([buildPrivatbankRow('5168 **** **** 3126')]);

        expect(account.iban).toBeDefined();
        expect(normalizeAccountIban(account.iban)).toBe(account.iban);
    });

    it('stays deterministic for the same card', () => {
        const [first] = privatbankAccountMapper([buildPrivatbankRow('5168 **** **** 3126')]);
        const [second] = privatbankAccountMapper([buildPrivatbankRow('5168 **** **** 3126')]);

        expect(first.iban).toBe(second.iban);
    });

    it('differs across cards and preserves the card ending', () => {
        const [first] = privatbankAccountMapper([buildPrivatbankRow('5168 **** **** 3126')]);
        const [second] = privatbankAccountMapper([buildPrivatbankRow('5168 **** **** 9911')]);

        expect(first.iban).not.toBe(second.iban);
        expect(first.iban?.endsWith('3126')).toBe(true);
        expect(second.iban?.endsWith('9911')).toBe(true);
    });
});
