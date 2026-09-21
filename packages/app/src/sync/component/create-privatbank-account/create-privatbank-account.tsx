import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { XLSX_MIME_TYPE } from '../../constant/xlsx-mime-type.constant';
import { privatbankSyncService } from '../../service/privatbank-sync.service';
import { CreateFileBankAccount } from '../create-file-bank-account/create-file-bank-account';

import type { CreateFileBankAccountConfigInterface } from '../../interface/create-file-bank-account-config.interface';

export const CreatePrivatbankAccount = () => {
    const { t } = useLingui();

    const config: CreateFileBankAccountConfigInterface = {
        mimeType: XLSX_MIME_TYPE,
        title: t`Import Privatbank`,
        description: t`One-time import from a Privat24 statement — this is not a live sync, and each export covers a single card or account`,
        steps: [
            t`Open Privat24 and select the card or account you want to import`,
            t`Open its statement and choose a date range that covers your full history`,
            t`Choose "Excel" as the export format — PDF and CSV files can't be imported`,
            t`If Privat24 emails you the file instead of downloading it, save the attachment from your inbox`,
            t`Return to Budgie and select the saved XLSX file below`
        ],
        fileIcon: UserIconNameEnum.FileSpreadsheet,
        fileTypeLabel: t`XLSX export`,
        selectFileText: t`Select the exported XLSX file`,
        ctaLabel: t`Import`,
        importPreview: privatbankSyncService.importPreview.bind(privatbankSyncService),
        executeImportForSelectedAccounts: privatbankSyncService.executeImportForSelectedAccounts.bind(privatbankSyncService)
    };

    return <CreateFileBankAccount config={config} />;
};
