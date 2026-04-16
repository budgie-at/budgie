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
        description: t`Import accounts and transactions from Privatbank XLSX export`,
        steps: [t`Open the Privatbank24 app`, t`Navigate to Menu → Statements`, t`Export your transactions to Excel`],
        fileIcon: UserIconNameEnum.FileSpreadsheet,
        fileTypeLabel: t`XLSX export`,
        selectFileText: t`Select the exported XLSX file`,
        importPreview: privatbankSyncService.importPreview.bind(privatbankSyncService),
        executeImportForSelectedAccounts: privatbankSyncService.executeImportForSelectedAccounts.bind(privatbankSyncService)
    };

    return <CreateFileBankAccount config={config} />;
};
