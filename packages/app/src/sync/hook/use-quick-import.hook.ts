import { getLogger } from '@budgie/logger';
import { useLingui } from '@lingui/react/macro';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { QuickImportConfigInterface } from '../interface/quick-import-config.interface';

import type { FileBankSyncImportResultInterface } from '../interface/file-bank-sync-import-result.interface';

const logger = getLogger('useQuickImport');

interface QuickImportResult {
    readonly isLoading: boolean;
    readonly handleQuickImport: () => void;
}

export const useQuickImport = (config: QuickImportConfigInterface | null, triggerAccountExternalId: string | null): QuickImportResult => {
    const { t } = useLingui();

    const [isLoading, setIsLoading] = useState(false);

    const showImportDoneToast = (importResult: FileBankSyncImportResultInterface) => {
        const hasAccounts = isPositiveNumber(importResult.accountCount);
        const hasNewTransactions = isPositiveNumber(importResult.newTransactionCount);

        if (!hasAccounts) {
            Toast.show({
                type: 'success',
                text1: t`No matching accounts`,
                text2: t`No enabled accounts were found in this file`
            });

            return;
        }

        const title = hasNewTransactions ? t`Transactions imported` : t`No new transactions`;
        const { newTransactionCount } = importResult;
        const { existingTransactionCount } = importResult;
        const { parsedTransactionCount } = importResult;
        const message = t`${newTransactionCount} new, ${existingTransactionCount} already imported, ${parsedTransactionCount} checked`;

        Toast.show({ type: 'success', text1: title, text2: message });
    };

    const handleQuickImport = () => {
        if (!isDefined(config)) {
            logger.log('skip:no-config');

            return;
        }

        if (isLoading) {
            logger.log('skip:loading', { source: config.source, triggerAccountExternalId });

            return;
        }

        const execute = async (): Promise<void> => {
            setIsLoading(true);
            logger.log('picker:open', { source: config.source, mimeType: config.mimeType, triggerAccountExternalId });

            const result = await DocumentPicker.getDocumentAsync({ type: config.mimeType, copyToCacheDirectory: true });
            const uri = result.assets?.at(0)?.uri;
            logger.log('picker:result', {
                source: config.source,
                canceled: result.canceled,
                assetCount: result.assets?.length ?? 0,
                triggerAccountExternalId,
                uri
            });

            if (result.canceled || !isNotEmptyString(uri)) {
                logger.log('skip:no-uri', { source: config.source, canceled: result.canceled, triggerAccountExternalId, uri });

                return;
            }

            Toast.show({ type: 'info', text1: t`Import started`, text2: t`Budgie will notify you when it finishes` });
            const importResult = await config.importHandler(uri);
            showImportDoneToast(importResult);
        };

        void execute()
            .catch((importError: unknown) => {
                const errorMessage = getErrorMessage(importError);
                logger.error('import:throw', importError);
                Toast.show({ type: 'error', text1: t`Import failed`, text2: errorMessage });
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return { isLoading, handleQuickImport };
};
