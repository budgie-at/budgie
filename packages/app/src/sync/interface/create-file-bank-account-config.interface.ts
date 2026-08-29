import type { SyncAccountPreviewInterface } from './sync-account-preview.interface';
import type { UserIconNameEnum } from '@budgie/contracts';

export interface CreateFileBankAccountConfigInterface {
    readonly mimeType: string;
    readonly title: string;
    readonly description: string;
    readonly steps: readonly string[];
    readonly fileIcon: UserIconNameEnum;
    readonly fileTypeLabel: string;
    readonly selectFileText: string;
    readonly importPreview: (uri: string) => Promise<SyncAccountPreviewInterface[]>;
    readonly executeImportForSelectedAccounts: (uri: string, selectedAccountIds: string[]) => Promise<void>;
}
