import type { AppServices } from '../../@generic/runtime/app.runtime';
import type { UserIconNameEnum } from '@budgie/contracts';
import type { FileBankSyncImportReviewInterface, SyncAccountPreviewInterface } from '@budgie/sync';
import type * as Effect from 'effect/Effect';

export interface CreateFileBankAccountConfigInterface {
    readonly mimeType: string;
    readonly title: string;
    readonly description: string;
    readonly steps: readonly string[];
    readonly fileIcon: UserIconNameEnum;
    readonly fileTypeLabel: string;
    readonly selectFileText: string;
    readonly importPreview: (uri: string) => Effect.Effect<SyncAccountPreviewInterface[], unknown, AppServices>;
    readonly reviewImport: (
        uri: string,
        selectedAccountIds: string[]
    ) => Effect.Effect<FileBankSyncImportReviewInterface, unknown, AppServices>;
    readonly executeImportForSelectedAccounts: (uri: string, selectedAccountIds: string[]) => Effect.Effect<unknown, unknown, AppServices>;
}
