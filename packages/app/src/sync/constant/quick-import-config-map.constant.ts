import { ExternalSourceEnum } from '@budgie/contracts';

import { QuickImportConfigInterface } from '../interface/quick-import-config.interface';
import { ersteSyncQuickImportFromUri } from '../service/erste-sync.service';
import { privatbankSyncQuickImportFromUri } from '../service/privatbank-sync.service';

import { PDF_MIME_TYPE } from './pdf-mime-type.constant';
import { XLSX_MIME_TYPE } from './xlsx-mime-type.constant';

export const quickImportConfigMap: Partial<Record<ExternalSourceEnum, QuickImportConfigInterface>> = {
    [ExternalSourceEnum.PRIVATBANK]: { mimeType: XLSX_MIME_TYPE, importHandler: privatbankSyncQuickImportFromUri },
    [ExternalSourceEnum.ERSTE]: { mimeType: PDF_MIME_TYPE, importHandler: ersteSyncQuickImportFromUri }
};
