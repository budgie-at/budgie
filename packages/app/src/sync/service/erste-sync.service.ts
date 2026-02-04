/* eslint-disable no-await-in-loop */
import { BankAccountInterface, ErsteFileClient } from '@budgie/bank-sync';
import { BankSyncModeEnum, ExternalSourceEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { bankSyncRepository } from '../../@generic/drizzle/db/db';
import { transactionService } from '../../transaction/service/transaction.service';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';
import { getOrCreateBankAccount } from '../util/get-or-create-bank-account.util';
import { mapBankAccountsToPreview } from '../util/map-bank-accounts-to-preview.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

const PROVIDER = ExternalSourceEnum.ERSTE;

/* jscpd:ignore-start */
const createBankSyncRecord = async (accountId: number): Promise<void> => {
    const existingSync = await bankSyncRepository.getByAccountId(accountId);
    if (isDefined(existingSync)) {
        return;
    }

    await bankSyncRepository.create({
        token: '',
        accountId,
        provider: PROVIDER,
        enabled: true,
        mode: BankSyncModeEnum.FORWARD
    });
};
/* jscpd:ignore-end */

const importAccountTransactions = async (
    client: ErsteFileClient,
    bankAccount: BankAccountInterface,
    existingExternalIds: Set<string>
): Promise<void> => {
    const account = await getOrCreateBankAccount(bankAccount, PROVIDER);
    await createBankSyncRecord(account.id);

    const transactions = client.getTransactions();
    const newTransactions = transactions.filter(transaction => !existingExternalIds.has(transaction.id));

    if (!isNotEmptyArray(newTransactions)) {
        return;
    }

    const transactionInputs = newTransactions.map(transaction => mapBankTransactionToCreateInput(transaction, account.id, null, PROVIDER));

    await transactionService.bulkCreate(transactionInputs);
};

export const ersteSyncImportPreview = async (fileBuffer: Uint8Array): Promise<BankAccountPreviewInterface[]> => {
    const client = new ErsteFileClient();
    await client.parse(fileBuffer);
    const bankAccounts = client.getAccounts();

    if (!isNotEmptyArray(bankAccounts)) {
        return [];
    }

    return mapBankAccountsToPreview(bankAccounts, PROVIDER);
};

const executeImport = async (client: ErsteFileClient, bankAccounts: BankAccountInterface[]): Promise<void> => {
    const existingExternalIds = await transactionService.findByExternalSource(PROVIDER);

    for (const bankAccount of bankAccounts) {
        await importAccountTransactions(client, bankAccount, existingExternalIds);
    }
};

/* jscpd:ignore-start */
export const ersteSyncExecuteImport = async (fileBuffer: Uint8Array, selectedAccountIds: string[]): Promise<void> => {
    const client = new ErsteFileClient();
    await client.parse(fileBuffer);
    const bankAccounts = client.getAccounts();
    const selectedBankAccounts = bankAccounts.filter(account => selectedAccountIds.includes(account.id));

    if (!isNotEmptyArray(selectedBankAccounts)) {
        return;
    }

    await executeImport(client, selectedBankAccounts);
};
/* jscpd:ignore-end */
