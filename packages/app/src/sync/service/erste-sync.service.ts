import { ExternalSourceEnum } from '@budgie/contracts';

import { extractPdfTextItems } from '../util/extract-pdf-text-items.util';

import { BaseFileBankSyncService } from './base-file-bank-sync.service';

import type { ParsedFileResultInterface } from '@budgie/bank-sync';
import type { MccCategoryLookupInterface } from '@budgie/contracts';

class ErsteSyncService extends BaseFileBankSyncService {
    constructor() {
        super(ExternalSourceEnum.ERSTE);
    }

    protected async parseFileContent(uri: string): Promise<ParsedFileResultInterface> {
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

    protected async resolveMccCategoryIdMap(): Promise<Map<string, MccCategoryLookupInterface | null>> {
        return new Map();
    }
}

export const ersteSyncService = new ErsteSyncService();

export const ersteSyncQuickImportFromUri = ersteSyncService.quickImport.bind(ersteSyncService);
