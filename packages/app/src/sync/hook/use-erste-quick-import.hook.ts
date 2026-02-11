import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { PDF_MIME_TYPE } from '../constant/pdf-mime-type.constant';
import { ersteSyncService } from '../service/erste-sync.service';

interface ErsteQuickImportResult {
    readonly isLoading: boolean;
    readonly error: string | null;
    readonly handleQuickImport: () => void;
    readonly clearError: () => void;
}

/* jscpd:ignore-start */
export const useErsteQuickImport = (): ErsteQuickImportResult => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleQuickImport = () => {
        const execute = async (): Promise<void> => {
            setIsLoading(true);
            setError(null);

            const result = await DocumentPicker.getDocumentAsync({ type: PDF_MIME_TYPE, copyToCacheDirectory: true });
            const { uri } = result.assets?.at(0) ?? {};

            if (result.canceled || !isNotEmptyString(uri)) {
                setIsLoading(false);

                return;
            }

            await ersteSyncService.quickImport(uri);
        };

        void execute()
            .catch((importError: unknown) => {
                setError(getErrorMessage(importError));
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const clearError = () => {
        setError(null);
    };

    return { isLoading, error, handleQuickImport, clearError };
};
/* jscpd:ignore-end */
