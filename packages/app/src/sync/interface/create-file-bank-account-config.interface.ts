import type { AppServices } from '../../@generic/runtime/app.runtime';
import type { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import type { FileBankSyncImportReviewInterface, SyncAccountPreviewInterface } from '@budgie/sync';
import type * as Cause from 'effect/Cause';
import type * as Effect from 'effect/Effect';

export interface CreateFileBankAccountConfigInterface {
    readonly provider: ExternalSourceEnum;
    readonly mimeType: string;
    readonly title: string;
    readonly description: string;
    readonly steps: readonly string[];
    readonly fileIcon: UserIconNameEnum;
    readonly fileTypeLabel: string;
    readonly selectFileText: string;
    readonly importPreview: (uri: string) => Effect.Effect<SyncAccountPreviewInterface[], Cause.YieldableError, AppServices>;
    readonly reviewImport: (
        uri: string,
        selectedAccountIds: string[]
    ) => Effect.Effect<FileBankSyncImportReviewInterface, Cause.YieldableError, AppServices>;
    readonly executeImportForSelectedAccounts: (
        uri: string,
        selectedAccountIds: string[]
    ) => Effect.Effect<unknown, Cause.YieldableError, AppServices>;
}
