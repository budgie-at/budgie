import type { AppServices } from '../../@generic/runtime/app.runtime';
import type { FileBankSyncImportResultInterface } from './file-bank-sync-import-result.interface';
import type { ExternalSourceEnum } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export interface QuickImportConfigInterface {
    readonly mimeType: string;
    readonly source: ExternalSourceEnum;
    readonly importHandler: (uri: string) => Effect.Effect<FileBankSyncImportResultInterface, unknown, AppServices>;
}
