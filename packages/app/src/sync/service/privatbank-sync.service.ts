import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { PrivatbankFileClient, parsePrivatbankXlsx } from '@budgie/sync';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { readFileAsUint8Array } from '../util/read-file-as-uint8-array.util';

import { AbstractFileSyncService } from './abstract-file-sync.service';
import { privatbankCategoryMatcherService } from './privatbank-category-matcher.service';

import type { FileBasedSyncClientInterface } from '../interface/file-based-sync-client.interface';
import type { SyncAccountInterface } from '@budgie/sync';

class PrivatbankSyncService extends AbstractFileSyncService {
    protected readonly provider = ExternalSourceEnum.PRIVATBANK;
    // eslint-disable-next-line lingui/no-unlocalized-strings -- brand name
    protected readonly providerTitle = 'Privatbank';
    protected readonly accountType = AccountTypeEnum.BANK_SYNC;

    protected readonly resolveMccCategoryIdMap = Effect.fn('PrivatbankSyncService.resolveMccCategoryIdMap')(function* (
        this: PrivatbankSyncService,
        client: FileBasedSyncClientInterface,
        bankAccounts: SyncAccountInterface[]
    ) {
        const accountIds = bankAccounts.map(account => account.id);
        const uniqueCategories = this.collectUniqueCategories(client, accountIds);

        return yield* privatbankCategoryMatcherService.match(uniqueCategories);
    });

    protected readonly parseFile = Effect.fn('PrivatbankSyncService.parseFile')(function* (uri: string) {
        const buffer = yield* Effect.promise(() => readFileAsUint8Array(uri));
        const rows = yield* parsePrivatbankXlsx(buffer);
        const client = new PrivatbankFileClient(rows);

        return { client, bankAccounts: client.getAccounts() };
    });

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

export const privatbankSyncQuickImportFromUri = (uri: string) => privatbankSyncService.quickImport(uri);
