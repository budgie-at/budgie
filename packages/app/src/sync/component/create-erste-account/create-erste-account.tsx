import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { PDF_MIME_TYPE } from '../../constant/pdf-mime-type.constant';
import { ersteSyncService } from '../../service/erste-sync.service';
import { CreateFileBankAccount } from '../create-file-bank-account/create-file-bank-account';

import type { CreateFileBankAccountConfigInterface } from '../../interface/create-file-bank-account-config.interface';

export const CreateErsteAccount = () => {
    const { t } = useLingui();

    const config: CreateFileBankAccountConfigInterface = {
        mimeType: PDF_MIME_TYPE,
        title: t`Import Erste Bank`,
        description: t`Import accounts and transactions from Erste Bank PDF statement`,
        steps: [t`Open George (Erste Bank online banking)`, t`Navigate to Account → Statements`, t`Download your statement as PDF`],
        fileIcon: UserIconNameEnum.FileText,
        fileTypeLabel: t`PDF statement`,
        selectFileText: t`Select the downloaded PDF file`,
        importPreview: ersteSyncService.importPreview.bind(ersteSyncService),
        executeImportForSelectedAccounts: ersteSyncService.executeImportForSelectedAccounts.bind(ersteSyncService)
    };

    return <CreateFileBankAccount config={config} />;
};
