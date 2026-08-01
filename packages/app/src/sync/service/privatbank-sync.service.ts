import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { PrivatbankFileClient } from '@budgie/sync';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { readFileAsUint8Array } from '../util/read-file-as-uint8-array.util';

import { AbstractFileSyncService } from './abstract-file-sync.service';
import { privatbankCategoryMatcherService } from './privatbank-category-matcher.service';

import type { FileBasedSyncClientInterface } from '../interface/file-based-sync-client.interface';
import type { ParsedFileResultInterface } from '../interface/parsed-file-result.interface';
import type { MccCategoryLookupInterface } from '@budgie/contracts';
import type { SyncAccountInterface } from '@budgie/sync';

class PrivatbankSyncService extends AbstractFileSyncService {
    protected readonly provider = ExternalSourceEnum.PRIVATBANK;
    // eslint-disable-next-line lingui/no-unlocalized-strings -- brand name
    protected readonly providerTitle = 'Privatbank';
    protected readonly accountType = AccountTypeEnum.BANK_SYNC;

    @Log(
        (client, bankAccounts) => `enter client="${client.constructor.name}" accountCount=${bankAccounts.length}`,
        (result, client, bankAccounts) =>
            `done client="${client.constructor.name}" accountCount=${bankAccounts.length} categoryCount=${result.size} matchedCount=${[...result.values()].filter(isDefined).length}`,
        (error, client, bankAccounts) =>
            `throw client="${client.constructor.name}" accountCount=${bankAccounts.length} error=${getErrorMessage(error)}`
    )
    protected override async resolveMccCategoryIdMap(
        client: FileBasedSyncClientInterface,
        bankAccounts: SyncAccountInterface[]
    ): Promise<Map<string, MccCategoryLookupInterface | null>> {
        const accountIds = bankAccounts.map(account => account.id);
        const uniqueCategories = this.collectUniqueCategories(client, accountIds);

        return privatbankCategoryMatcherService.match(uniqueCategories);
    }

    protected override async parseFile(uri: string): Promise<ParsedFileResultInterface> {
        const buffer = await readFileAsUint8Array(uri);
        const client = new PrivatbankFileClient(buffer);

        return { client, bankAccounts: client.getAccounts() };
    }

    private collectUniqueCategories(client: FileBasedSyncClientInterface, accountIds: string[]): string[] {
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
