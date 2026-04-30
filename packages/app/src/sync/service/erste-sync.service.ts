import { ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { extractPdfTextItems } from '../util/extract-pdf-text-items.util';

import { BaseFileBankSyncService } from './base-file-bank-sync.service';

import type { ParsedFileResultInterface } from '../interface/parsed-file-result.interface';

class ErsteSyncService extends BaseFileBankSyncService {
    constructor() {
        super(ExternalSourceEnum.ERSTE);
    }

    @Log(
        uri => `enter uri=${uri}`,
        (result, uri) =>
            `done uri=${uri} bankAccountIds=${result.bankAccounts.map(account => account.id).join(',')} bankAccountCount=${result.bankAccounts.length}`,
        (error, uri) => `throw uri=${uri} error=${getErrorMessage(error)}`
    )
    protected async parseFile(uri: string): Promise<ParsedFileResultInterface> {
        const items = await extractPdfTextItems(uri);
        const module = await import('@budgie/bank-sync');
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

    protected async resolveMccCategoryIdMap(): Promise<Map<string, number | null>> {
        return new Map();
    }
}

export const ersteSyncService = new ErsteSyncService();

export const ersteSyncQuickImportFromUri = ersteSyncService.quickImport.bind(ersteSyncService);
