import { PrivatbankFileClient } from '@budgie/bank-sync';
import { ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { readFileAsUint8Array } from '../util/read-file-as-uint8-array.util';

import { BaseFileBankSyncService } from './base-file-bank-sync.service';
import { privatbankCategoryMatcherMatch } from './privatbank-category-matcher.service';

import type { FileBasedBankSyncClientInterface } from '../interface/file-based-bank-sync-client.interface';
import type { ParsedFileResultInterface } from '../interface/parsed-file-result.interface';
import type { BankAccountInterface } from '@budgie/bank-sync';
import type { MccCategoryLookupInterface } from '@budgie/contracts';

const collectUniqueCategories = (client: FileBasedBankSyncClientInterface, accountIds: string[]): string[] => {
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

class PrivatbankSyncService extends BaseFileBankSyncService {
    constructor() {
        super(ExternalSourceEnum.PRIVATBANK);
    }

    @Log(
        uri => `enter uri=${uri}`,
        (result, uri) =>
            `done uri=${uri} bankAccountCount=${result.bankAccounts.length} bankAccountIds=${result.bankAccounts
                .map(account => account.id)
                .join(',')}`,
        (error, uri) => `throw uri=${uri} error=${getErrorMessage(error)}`
    )
    protected async parseFile(uri: string): Promise<ParsedFileResultInterface> {
        const buffer = await readFileAsUint8Array(uri);
        const client = new PrivatbankFileClient(buffer);

        return { client, bankAccounts: client.getAccounts() };
    }

    @Log(
        (client, bankAccounts) =>
            `enter clientAccountIds=${client
                .getAccounts()
                .map(account => account.id)
                .join(',')} bankAccountIds=${bankAccounts.map(account => account.id).join(',')}`,
        (result, client, bankAccounts) =>
            `done clientAccountIds=${client
                .getAccounts()
                .map(account => account.id)
                .join(',')} bankAccountIds=${bankAccounts
                .map(account => account.id)
                .join(',')} categoryKeys=${[...result.keys()].join(',')} matchedCount=${[...result.values()].filter(isDefined).length}`,
        (error, client, bankAccounts) =>
            `throw clientAccountIds=${client
                .getAccounts()
                .map(account => account.id)
                .join(',')} bankAccountIds=${bankAccounts.map(account => account.id).join(',')} error=${getErrorMessage(error)}`
    )
    protected async resolveMccCategoryIdMap(
        client: FileBasedBankSyncClientInterface,
        bankAccounts: BankAccountInterface[]
    ): Promise<Map<string, MccCategoryLookupInterface | null>> {
        const accountIds = bankAccounts.map(account => account.id);
        const uniqueCategories = collectUniqueCategories(client, accountIds);

        return privatbankCategoryMatcherMatch(uniqueCategories);
    }
}

export const privatbankSyncService = new PrivatbankSyncService();

export const privatbankSyncQuickImportFromUri = privatbankSyncService.quickImport.bind(privatbankSyncService);
