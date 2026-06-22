import type { FileBankSyncImportResultInterface } from './file-bank-sync-import-result.interface';
import type { ExternalSourceEnum } from '@budgie/contracts';

export interface QuickImportConfigInterface {
    readonly mimeType: string;
    readonly source: ExternalSourceEnum;
    readonly importHandler: (uri: string) => Promise<FileBankSyncImportResultInterface>;
}
