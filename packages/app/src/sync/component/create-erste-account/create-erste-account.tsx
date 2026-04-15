import { useLingui } from '@lingui/react/macro';

import { PDF_MIME_TYPE } from '../../constant/pdf-mime-type.constant';
import { ersteSyncService } from '../../service/erste-sync.service';
import { CreateFileBankAccount } from '../create-file-bank-account/create-file-bank-account';

import type { CreateFileBankAccountConfigInterface } from '../../interface/create-file-bank-account-config-interface.type';

export const CreateErsteAccount = () => {
    const { t } = useLingui();

    const config: CreateFileBankAccountConfigInterface = {
        mimeType: PDF_MIME_TYPE,
        title: t`Import Erste Bank`,
        description: t`Import accounts and transactions from Erste Bank PDF statement`,
        instructionText: t`Download your account statement as PDF from George (Erste Bank online banking): Account → Statements → Download PDF.`,
        selectFileText: t`Select the downloaded PDF file:`,
        importPreview: ersteSyncService.importPreview.bind(ersteSyncService),
        executeImportForSelectedAccounts: ersteSyncService.executeImportForSelectedAccounts.bind(ersteSyncService)
    };

    return <CreateFileBankAccount config={config} />;
};
