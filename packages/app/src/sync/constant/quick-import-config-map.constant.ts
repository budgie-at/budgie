import { ExternalSourceEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { QuickImportConfigInterface } from '../interface/quick-import-config.interface';
import { ErsteSyncService } from '../service/erste-sync.service';
import { PrivatbankSyncService } from '../service/privatbank-sync.service';

import { PDF_MIME_TYPE } from './pdf-mime-type.constant';
import { XLSX_MIME_TYPE } from './xlsx-mime-type.constant';

export const quickImportConfigMap: Partial<Record<ExternalSourceEnum, QuickImportConfigInterface>> = {
    [ExternalSourceEnum.PRIVATBANK]: {
        source: ExternalSourceEnum.PRIVATBANK,
        mimeType: XLSX_MIME_TYPE,
        importHandler: uri => Effect.flatMap(PrivatbankSyncService, privatbankSyncService => privatbankSyncService.quickImport(uri))
    },
    [ExternalSourceEnum.ERSTE]: {
        source: ExternalSourceEnum.ERSTE,
        mimeType: PDF_MIME_TYPE,
        importHandler: uri => Effect.flatMap(ErsteSyncService, ersteSyncService => ersteSyncService.quickImport(uri))
    }
};
