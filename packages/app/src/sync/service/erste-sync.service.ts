import { ExternalSourceEnum } from '@budgie/contracts';
import { extractText } from 'expo-pdf-text-extract';

import { BaseFileBankSyncService } from './base-file-bank-sync.service';

import type { ParsedFileResultInterface } from '../interface/parsed-file-result.interface';

class ErsteSyncService extends BaseFileBankSyncService {
    constructor() {
        super(ExternalSourceEnum.ERSTE);
    }

    protected async parseFile(uri: string): Promise<ParsedFileResultInterface> {
        const text = await extractText(uri);
        const module = await import('@budgie/bank-sync');
        const ersteClient = new module.ErsteFileClient();
        ersteClient.parse(text);

        const client = {
            getAccounts: () => ersteClient.getAccounts(),
            getTransactions: () => ersteClient.getTransactions()
        };

        return { client, bankAccounts: client.getAccounts() };
    }

    protected async resolveMccCategoryIdMap(): Promise<Map<string, number | null>> {
        return new Map();
    }
}

export const ersteSyncService = new ErsteSyncService();

export const ersteSyncQuickImportFromUri = ersteSyncService.quickImport.bind(ersteSyncService);
