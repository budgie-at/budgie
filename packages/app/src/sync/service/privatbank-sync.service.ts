import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { PrivatbankFileClient } from '@budgie/sync';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { readFileAsUint8Array } from '../util/read-file-as-uint8-array.util';

import { AbstractFileSyncService } from './abstract-file-sync.service';
import { privatbankCategoryMatcherMatch } from './privatbank-category-matcher.service';

import type { FileBasedSyncClientInterface } from '../interface/file-based-sync-client.interface';
import type { ParsedFileResultInterface } from '../interface/parsed-file-result.interface';
import type { MccCategoryLookupInterface } from '@budgie/contracts';
import type { SyncAccountInterface } from '@budgie/sync';

const collectUniqueCategories = (client: FileBasedSyncClientInterface, accountIds: string[]): string[] => {
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

class PrivatbankSyncService extends AbstractFileSyncService {
    protected readonly provider = ExternalSourceEnum.PRIVATBANK;
    // eslint-disable-next-line lingui/no-unlocalized-strings -- brand name
    protected readonly providerTitle = 'Privatbank';
    protected readonly accountType = AccountTypeEnum.BANK_SYNC;

    protected async parseFile(uri: string): Promise<ParsedFileResultInterface> {
        const buffer = await readFileAsUint8Array(uri);
        const client = new PrivatbankFileClient(buffer);

        return { client, bankAccounts: client.getAccounts() };
    }

    protected async resolveMccCategoryIdMap(
        client: FileBasedSyncClientInterface,
        bankAccounts: SyncAccountInterface[]
    ): Promise<Map<string, MccCategoryLookupInterface | null>> {
        const accountIds = bankAccounts.map(account => account.id);
        const uniqueCategories = collectUniqueCategories(client, accountIds);

        return privatbankCategoryMatcherMatch(uniqueCategories);
    }
}

export const privatbankSyncService = new PrivatbankSyncService();

export const privatbankSyncQuickImportFromUri = privatbankSyncService.quickImport.bind(privatbankSyncService);
