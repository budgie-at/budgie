import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { extractPdfTextItems } from '../util/extract-pdf-text-items.util';

import { AbstractFileSyncService } from './abstract-file-sync.service';

import type { ParsedFileResultInterface } from '../interface/parsed-file-result.interface';
import type { MccCategoryLookupInterface } from '@budgie/contracts';

class ErsteSyncService extends AbstractFileSyncService {
    protected readonly provider = ExternalSourceEnum.ERSTE;
    // eslint-disable-next-line lingui/no-unlocalized-strings -- brand name
    protected readonly providerTitle = 'Erste';
    protected readonly accountType = AccountTypeEnum.BANK_SYNC;

    @Log(
        uri => `enter uri=${uri}`,
        (result, uri) =>
            `done uri=${uri} bankAccountIds=${result.bankAccounts.map(account => account.id).join(',')} bankAccountCount=${result.bankAccounts.length}`,
        (error, uri) => `throw uri=${uri} error=${getErrorMessage(error)}`
    )
    protected async parseFile(uri: string): Promise<ParsedFileResultInterface> {
        const items = await extractPdfTextItems(uri);
        const module = await import('@budgie/sync');
        const ersteClient = new module.ErsteFileClient();
        ersteClient.parse(items);

        return {
            client: {
                getAccounts: () => ersteClient.getAccounts(),
                getTransactions: () => ersteClient.getTransactions()
            },
            bankAccounts: ersteClient.getAccounts()
        };
    }

    protected async resolveMccCategoryIdMap(): Promise<Map<string, MccCategoryLookupInterface | null>> {
        return new Map();
    }
}

export const ersteSyncService = new ErsteSyncService();

export const ersteSyncQuickImportFromUri = ersteSyncService.quickImport.bind(ersteSyncService);
