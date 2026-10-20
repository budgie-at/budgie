import type { UserIconNameEnum } from '@budgie/contracts';
import type { FileBankSyncImportReviewInterface, SyncAccountPreviewInterface } from '@budgie/sync';

export interface CreateFileBankAccountConfigInterface {
    readonly mimeType: string;
    readonly title: string;
    readonly description: string;
    readonly steps: readonly string[];
    readonly fileIcon: UserIconNameEnum;
    readonly fileTypeLabel: string;
    readonly selectFileText: string;
    readonly importPreview: (uri: string) => Promise<SyncAccountPreviewInterface[]>;
    readonly reviewImport: (uri: string, selectedAccountIds: string[]) => Promise<FileBankSyncImportReviewInterface>;
    readonly executeImportForSelectedAccounts: (uri: string, selectedAccountIds: string[]) => Promise<void>;
}
