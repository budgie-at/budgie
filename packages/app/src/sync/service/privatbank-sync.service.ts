import { BankAccountInterface, BankTransactionInterface, PrivatbankFileClient } from '@budgie/bank-sync';
import { BankSyncModeEnum, ExternalSourceEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository } from '../../@generic/drizzle/db/db';
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
    categoryToMccCategoryIdMap: Map<string, number | null>,
    existingExternalIds: Set<string>
): Promise<void> => {
    const account = await getOrCreateBankAccount(bankAccount, PROVIDER);
    await createBankSyncRecord(account.id);

    const transactions = client.getTransactions(bankAccount.id);
    const newTransactions = transactions.filter(transaction => !existingExternalIds.has(transaction.id));

    if (!isNotEmptyArray(newTransactions)) {
        return;
    }

    const transactionInputs = newTransactions.map((transaction: BankTransactionInterface) => {
        const mccCategoryId = isNotEmptyString(transaction.category)
            ? (categoryToMccCategoryIdMap.get(transaction.category) ?? null)
            : null;

        return mapBankTransactionToCreateInput(transaction, account.id, mccCategoryId, PROVIDER);
    });

    await transactionService.bulkCreate(transactionInputs);
};

export const privatbankSyncImportPreview = async (fileBuffer: Uint8Array): Promise<BankAccountPreviewInterface[]> => {
    const client = new PrivatbankFileClient(fileBuffer);
    const bankAccounts = client.getAccounts();

    if (!isNotEmptyArray(bankAccounts)) {
        return [];
    }

    return mapBankAccountsToPreview(bankAccounts, PROVIDER);
};

const executeImport = async (client: PrivatbankFileClient, bankAccounts: BankAccountInterface[]): Promise<void> => {
    const accountIds = bankAccounts.map(account => account.id);
    const uniqueCategories = collectUniqueCategories(client, accountIds);
    const [categoryToMccCategoryIdMap, existingExternalIds] = await Promise.all([
        privatbankCategoryMatcherMatch(uniqueCategories),
        transactionService.findByExternalSource(PROVIDER)
    ]);

    for (const bankAccount of bankAccounts) {
        await importAccountTransactions(client, bankAccount, categoryToMccCategoryIdMap, existingExternalIds);
    }
};

export const privatbankSyncExecuteImport = async (fileBuffer: Uint8Array, selectedAccountIds: string[]): Promise<void> => {
    const client = new PrivatbankFileClient(fileBuffer);
    const bankAccounts = client.getAccounts();
    const selectedBankAccounts = bankAccounts.filter(account => selectedAccountIds.includes(account.id));

    if (!isNotEmptyArray(selectedBankAccounts)) {
        return;
    }

    await executeImport(client, selectedBankAccounts);
};

const getEnabledExternalIds = async (): Promise<Set<string>> => {
    const enabledSyncs = await bankSyncRepository.getEnabledByProvider(PROVIDER);
    if (!isNotEmptyArray(enabledSyncs)) {
        return new Set();
    }

    const accountIds = enabledSyncs.map(sync => sync.accountId);
    const accounts = await accountRepository.findByIds(accountIds);

    return new Set(accounts.map(account => account.externalId).filter(isDefined));
};

export const privatbankSyncQuickImport = async (fileBuffer: Uint8Array): Promise<void> => {
    const client = new PrivatbankFileClient(fileBuffer);
    const bankAccounts = client.getAccounts();

    if (!isNotEmptyArray(bankAccounts)) {
        return;
    }

    const enabledExternalIds = await getEnabledExternalIds();
    if (enabledExternalIds.size === 0) {
        return;
    }

    const enabledBankAccounts = bankAccounts.filter(account => enabledExternalIds.has(account.id));
    if (!isNotEmptyArray(enabledBankAccounts)) {
        return;
    }

    await executeImport(client, enabledBankAccounts);
};
