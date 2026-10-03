import type { AppServices } from '../../@generic/runtime/app.runtime';
import type { ExternalSourceEnum } from '@budgie/contracts';
import type { FileBankSyncImportResultInterface } from '@budgie/sync';
import type * as Effect from 'effect/Effect';

export interface QuickImportConfigInterface {
    readonly mimeType: string;
    readonly source: ExternalSourceEnum;
    readonly importHandler: (uri: string) => Effect.Effect<FileBankSyncImportResultInterface, unknown, AppServices>;
}
