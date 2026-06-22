import { describe, expect, it } from 'vitest';
import { and, eq, isNull } from 'drizzle-orm';

import { BankAccountTypeEnum, BankProviderEnum, privatbankTransactionMapper } from '@budgie/bank-sync';
import { ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';

import { seed, StubFileBankSyncService, testDb } from '../../harness';

import type { FileBasedBankSyncClientInterface } from '@app/sync/interface/file-based-bank-sync-client.interface';
import type { BankAccountInterface, BankTransactionInterface, PrivatbankRowInterface } from '@budgie/bank-sync';

const PRIVATBANK_CARD_ID = '4731 **** **** 5524';
const PRIVATBANK_STATEMENT_URI = 'privatbank-statement.xlsx';
const PRIVATBANK_PARSED_DATE_EXTERNAL_ID = '0a0ff77d892d63b61bc65af4412c1f00';
const PRIVATBANK_TRANSACTION_AMOUNT = 732_440_000;

const buildPrivatbankBankAccount = (): BankAccountInterface => ({
    id: PRIVATBANK_CARD_ID,
    provider: BankProviderEnum.PRIVATBANK,
    currencyCode: 'UAH',
    currencyCodeNumeric: 980,
    balance: 0,
    creditLimit: 0,
    type: BankAccountTypeEnum.CARD
});

const buildPrivatbankRow = (): PrivatbankRowInterface => ({
    rawDate: '19.05.2026 08:40:18',
    date: new Date('2026-05-19T06:40:18.000Z'),
    category: 'Комуналка та Інтернет',
    card: PRIVATBANK_CARD_ID,
    description: 'TRANZZO*NICUA*AGPAY, DNIPRO',
    cardAmount: -732.44,
    cardCurrency: 'UAH',
    operationAmount: 732.44,
    operationCurrency: 'UAH',
    endBalance: 12_345.67,
    balanceCurrency: 'UAH'
});

class StubPrivatbankFileClient implements FileBasedBankSyncClientInterface {
    private readonly transaction = privatbankTransactionMapper(buildPrivatbankRow());

    getAccounts(): BankAccountInterface[] {
        return [buildPrivatbankBankAccount()];
    }

    getTransactions(accountId: string): BankTransactionInterface[] {
        return accountId === PRIVATBANK_CARD_ID ? [this.transaction] : [];
    }
}

const seedPrivatbankAccount = (): number => {
    const account = seed.account({
        title: 'Privatbank Card',
        externalId: PRIVATBANK_CARD_ID,
        externalSource: ExternalSourceEnum.PRIVATBANK
    });

    return account.id;
};

const seedPrivatbankParsedDateTransaction = (accountId: number): void => {
    const row = buildPrivatbankRow();

    const transaction = seed.bankPairExpense(
        { externalId: PRIVATBANK_PARSED_DATE_EXTERNAL_ID, operatedAt: row.date },
        {
            amount: PRIVATBANK_TRANSACTION_AMOUNT,
            accountId
        }
    );

    seed.updateTransaction(transaction.id, {
        externalSource: ExternalSourceEnum.PRIVATBANK,
        title: row.description
    });
};
const fetchPrivatbankTransactions = () =>
    testDb
        .select()
        .from(TransactionEntityTable)
        .where(and(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.PRIVATBANK), isNull(TransactionEntityTable.deletedAt)))
        .all();

describe('privatbank/import-dedupe', () => {
    it('reuses transactions imported with the old parsed-date external id', async () => {
        const accountId = seedPrivatbankAccount();
        const client = new StubPrivatbankFileClient();
        const syncService = new StubFileBankSyncService(ExternalSourceEnum.PRIVATBANK, client);
        const [importedTransaction] = client.getTransactions(PRIVATBANK_CARD_ID);

        seedPrivatbankParsedDateTransaction(accountId);

        await syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);

        const transactions = fetchPrivatbankTransactions();

        expect(transactions).toHaveLength(1);
        expect(transactions[0]).toEqual(expect.objectContaining({ externalId: importedTransaction?.id }));
    });

    it('skips import when the selected card is missing from the file', async () => {
        const client = new StubPrivatbankFileClient();
        const syncService = new StubFileBankSyncService(ExternalSourceEnum.PRIVATBANK, client);

        await syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, ['4731 **** **** 0000']);

        expect(fetchPrivatbankTransactions()).toHaveLength(0);
    });
});
