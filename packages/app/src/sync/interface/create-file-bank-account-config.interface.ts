import type { UserIconNameEnum } from '@budgie/contracts';
import type { SyncAccountPreviewInterface } from '@budgie/sync';

export interface CreateFileBankAccountConfigInterface {
    readonly mimeType: string;
    readonly title: string;
    readonly description: string;
    readonly steps: readonly string[];
    readonly fileIcon: UserIconNameEnum;
    readonly fileTypeLabel: string;
    readonly selectFileText: string;
    readonly ctaLabel?: string;
    readonly importPreview: (uri: string) => Promise<SyncAccountPreviewInterface[]>;
    readonly executeImportForSelectedAccounts: (uri: string, selectedAccountIds: string[]) => Promise<void>;
}
