import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { ErsteFileClient } from '@budgie/sync';
import * as Effect from 'effect/Effect';

import { extractPdfTextItems } from '../util/extract-pdf-text-items.util';
import { loadMccCategoryLookupMap } from '../util/load-mcc-category-lookup-map.util';

import { AbstractFileSyncService } from './abstract-file-sync.service';

import type { SyncTransactionInterface } from '@budgie/sync';

class ErsteSyncService extends AbstractFileSyncService {
    protected readonly provider = ExternalSourceEnum.ERSTE;
    // eslint-disable-next-line lingui/no-unlocalized-strings -- brand name
    protected readonly providerTitle = 'Erste';
    protected readonly accountType = AccountTypeEnum.BANK_SYNC;

    protected readonly parseFile = Effect.fn('ErsteSyncService.parseFile')(function* (uri: string) {
        const items = yield* Effect.promise(() => extractPdfTextItems(uri));
        const ersteClient = new ErsteFileClient();
        yield* ersteClient.parse(items);

        return {
            client: {
                getAccounts: () => ersteClient.getAccounts(),
                getTransactions: () => ersteClient.getTransactions()
            },
            bankAccounts: ersteClient.getAccounts()
        };
    });

    protected readonly resolveMccCategoryIdMap = loadMccCategoryLookupMap;

    protected override resolveMccCategoryLookupKey(transaction: SyncTransactionInterface): string {
        return String(transaction.mcc);
    }
}

export const ersteSyncService = new ErsteSyncService();

export const ersteSyncQuickImportFromUri = (uri: string) => ersteSyncService.quickImport(uri);
