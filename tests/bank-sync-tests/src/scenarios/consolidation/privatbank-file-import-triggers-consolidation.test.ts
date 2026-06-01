import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BankAccountTypeEnum, BankProviderEnum, privatbankTransactionMapper } from '@budgie/bank-sync';
import { ExternalSourceEnum } from '@budgie/contracts';

import { seed, StubFileBankSyncService } from '../../harness';

import { TransferConsolidationDrainReasonEnum } from '@app/sync/enum/transfer-consolidation-drain-reason.enum';
import { transferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';

import type { FileBasedBankSyncClientInterface } from '@app/sync/interface/file-based-bank-sync-client.interface';
import type { BankAccountInterface, BankTransactionInterface } from '@budgie/bank-sync';

const PRIVATBANK_CARD_ID = 'privat-card';
const PRIVATBANK_STATEMENT_URI = 'privatbank-statement.xlsx';
const PRIVATBANK_TRANSFER_CATEGORY = 'Зарахування переказу';
const TRANSFER_AMOUNT = 250;

const buildPrivatbankBankAccount = (): BankAccountInterface => ({
    id: PRIVATBANK_CARD_ID,
    provider: BankProviderEnum.PRIVATBANK,
    currencyCode: 'UAH',
    currencyCodeNumeric: 980,
    balance: TRANSFER_AMOUNT,
    creditLimit: 0,
    type: BankAccountTypeEnum.CARD
});

const buildPrivatbankTransaction = (): BankTransactionInterface =>
    privatbankTransactionMapper({
        rawDate: '13.01.2026 11:42:53',
        date: new Date('2026-01-13T09:42:53.000Z'),
        category: PRIVATBANK_TRANSFER_CATEGORY,
        card: PRIVATBANK_CARD_ID,
        description: 'Transfer from Monobank',
        cardAmount: TRANSFER_AMOUNT,
        cardCurrency: 'UAH',
        operationAmount: TRANSFER_AMOUNT,
        operationCurrency: 'UAH',
        endBalance: TRANSFER_AMOUNT,
        balanceCurrency: 'UAH'
    });

class StubPrivatbankFileClient implements FileBasedBankSyncClientInterface {
    constructor(private readonly transactions: BankTransactionInterface[]) {}

    getAccounts(): BankAccountInterface[] {
        return [buildPrivatbankBankAccount()];
    }

    getTransactions(): BankTransactionInterface[] {
        return this.transactions;
    }
}

const buildPrivatbankSyncService = (transactions: BankTransactionInterface[]): StubFileBankSyncService =>
    new StubFileBankSyncService(ExternalSourceEnum.PRIVATBANK, new StubPrivatbankFileClient(transactions));

const seedPrivatbankAccount = (): void => {
    seed.account({
        title: 'Privatbank Card',
        externalId: PRIVATBANK_CARD_ID,
        externalSource: ExternalSourceEnum.PRIVATBANK
    });
};

describe('consolidation/privatbank-file-import-triggers-consolidation', () => {
    beforeEach(() => {
        vi.mocked(transferConsolidationDrainerService.enqueue).mockClear();
    });

    it('enqueues consolidation after a Privatbank file import introduces new transactions', async () => {
        seedPrivatbankAccount();
        const syncService = buildPrivatbankSyncService([buildPrivatbankTransaction()]);

        await syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);

        expect(transferConsolidationDrainerService.enqueue).toHaveBeenCalledTimes(1);
        expect(transferConsolidationDrainerService.enqueue).toHaveBeenCalledWith(TransferConsolidationDrainReasonEnum.FILE_IMPORT);
    });

    it('does not enqueue consolidation when a re-import introduces no new transactions', async () => {
        seedPrivatbankAccount();
        const syncService = buildPrivatbankSyncService([buildPrivatbankTransaction()]);

        await syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);
        vi.mocked(transferConsolidationDrainerService.enqueue).mockClear();

        await syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);

        expect(transferConsolidationDrainerService.enqueue).not.toHaveBeenCalled();
    });
});
