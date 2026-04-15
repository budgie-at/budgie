import { useLingui } from '@lingui/react/macro';

import { XLSX_MIME_TYPE } from '../../constant/xlsx-mime-type.constant';
import { privatbankSyncService } from '../../service/privatbank-sync.service';
import { CreateFileBankAccount } from '../create-file-bank-account/create-file-bank-account';

import type { CreateFileBankAccountConfigInterface } from '../../interface/create-file-bank-account-config-interface.type';

export const CreatePrivatbankAccount = () => {
    const { t } = useLingui();

    const config: CreateFileBankAccountConfigInterface = {
        mimeType: XLSX_MIME_TYPE,
        title: t`Import Privatbank`,
        description: t`Import accounts and transactions from Privatbank XLSX export`,
        instructionText: t`Export your transactions as XLSX from the Privatbank24 app: Menu → Statements → Export to Excel.`,
        selectFileText: t`Select the exported XLSX file:`,
        importPreview: privatbankSyncService.importPreview.bind(privatbankSyncService),
        executeImportForSelectedAccounts: privatbankSyncService.executeImportForSelectedAccounts.bind(privatbankSyncService)
    };

    return <CreateFileBankAccount config={config} />;
};
