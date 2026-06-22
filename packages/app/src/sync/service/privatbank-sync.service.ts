import { PrivatbankFileClient } from '@budgie/bank-sync';
import { ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { readFileAsUint8Array } from '../util/read-file-as-uint8-array.util';

import { BaseFileBankSyncService } from './base-file-bank-sync.service';
import { privatbankCategoryMatcherService } from './privatbank-category-matcher.service';

import type { BankAccountInterface, FileBasedBankSyncClientInterface, ParsedFileResultInterface } from '@budgie/bank-sync';
import type { MccCategoryLookupInterface } from '@budgie/contracts';

class PrivatbankSyncService extends BaseFileBankSyncService {
    constructor() {
        super(ExternalSourceEnum.PRIVATBANK);
    }

    @Log(
        (client, bankAccounts) => `enter client="${client.constructor.name}" accountCount=${bankAccounts.length}`,
        (result, client, bankAccounts) =>
            `done client="${client.constructor.name}" accountCount=${bankAccounts.length} categoryCount=${result.size} matchedCount=${[...result.values()].filter(isDefined).length}`,
        (error, client, bankAccounts) =>
            `throw client="${client.constructor.name}" accountCount=${bankAccounts.length} error=${getErrorMessage(error)}`
    )
    protected async resolveMccCategoryIdMap(
        client: FileBasedBankSyncClientInterface,
        bankAccounts: BankAccountInterface[]
    ): Promise<Map<string, MccCategoryLookupInterface | null>> {
        const accountIds = bankAccounts.map(account => account.id);
        const uniqueCategories = this.collectUniqueCategories(client, accountIds);

        return privatbankCategoryMatcherService.match(uniqueCategories);
    }

    protected async parseFileContent(uri: string): Promise<ParsedFileResultInterface> {
        const buffer = await readFileAsUint8Array(uri);
        const client = new PrivatbankFileClient(buffer);

        return { client, bankAccounts: client.getAccounts() };
    }

    private collectUniqueCategories(client: FileBasedBankSyncClientInterface, accountIds: string[]): string[] {
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
    }
}

export const privatbankSyncService = new PrivatbankSyncService();

export const privatbankSyncQuickImportFromUri = privatbankSyncService.quickImport.bind(privatbankSyncService);
