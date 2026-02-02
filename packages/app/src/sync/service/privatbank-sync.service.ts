/* eslint-disable no-await-in-loop */
import { BankAccountInterface, BankTransactionInterface, PrivatbankFileClient } from '@budgie/bank-sync';
import { BankSyncModeEnum, ExternalSourceEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { bankSyncRepository } from '../../@generic/drizzle/db/db';
import { LlmInterface } from '../../ai/context/llm.context';
import { transactionService } from '../../transaction/service/transaction.service';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';
import { getOrCreateBankAccount } from '../util/get-or-create-bank-account.util';
import { mapBankAccountsToPreview } from '../util/map-bank-accounts-to-preview.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import { privatbankCategoryMatcherMatch } from './privatbank-category-matcher.service';

const PROVIDER = ExternalSourceEnum.PRIVATBANK;

const collectUniqueCategories = (client: PrivatbankFileClient, accountIds: string[]): string[] => {
    const categorySet = new Set<string>();

    for (const accountId of accountIds) {
        const transactions = client.getTransactions(accountId);
        for (const transaction of transactions) {
            if (isDefined(transaction.category) && isNotEmptyString(transaction.category)) {
                categorySet.add(transaction.category);
            }
        }
    }

    return [...categorySet];
};

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

const importAccountTransactions = async (
    client: PrivatbankFileClient,
    bankAccount: BankAccountInterface,
    categoryToMccCategoryIdMap: Map<string, number | null>
): Promise<void> => {
    const account = await getOrCreateBankAccount(bankAccount, PROVIDER);
    await createBankSyncRecord(account.id);

    const existingExternalIds = await transactionService.findByExternalSource(PROVIDER);
    const transactions = client.getTransactions(bankAccount.id);
    const newTransactions = transactions.filter(transaction => !existingExternalIds.has(transaction.id));

    if (!isNotEmptyArray(newTransactions)) {
        return;
    }

    const transactionInputs = newTransactions.map((transaction: BankTransactionInterface) => {
        const mccCategoryId = isDefined(transaction.category) ? (categoryToMccCategoryIdMap.get(transaction.category) ?? null) : null;

        return mapBankTransactionToCreateInput(transaction, account.id, mccCategoryId, PROVIDER);
    });

    await transactionService.bulkCreate(transactionInputs);
};

export const privatbankSyncImportPreview = async (fileBuffer: ArrayBuffer): Promise<BankAccountPreviewInterface[]> => {
    const client = new PrivatbankFileClient(fileBuffer);
    const bankAccounts = client.getAccounts();

    if (!isNotEmptyArray(bankAccounts)) {
        return [];
    }

    return mapBankAccountsToPreview(bankAccounts, PROVIDER);
};

export const privatbankSyncExecuteImport = async (
    fileBuffer: ArrayBuffer,
    selectedAccountIds: string[],
    llm: LlmInterface
): Promise<void> => {
    const client = new PrivatbankFileClient(fileBuffer);
    const bankAccounts = client.getAccounts();
    const selectedBankAccounts = bankAccounts.filter(account => selectedAccountIds.includes(account.id));

    if (!isNotEmptyArray(selectedBankAccounts)) {
        return;
    }

    const uniqueCategories = collectUniqueCategories(client, selectedAccountIds);
    const categoryToMccCategoryIdMap = await privatbankCategoryMatcherMatch(llm, uniqueCategories);

    for (const bankAccount of selectedBankAccounts) {
        await importAccountTransactions(client, bankAccount, categoryToMccCategoryIdMap);
    }
};
