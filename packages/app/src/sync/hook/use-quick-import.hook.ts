import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { QuickImportConfigInterface } from '../interface/quick-import-config.interface';

interface QuickImportResult {
    readonly isLoading: boolean;
    readonly error: string | null;
    readonly handleQuickImport: () => void;
    readonly clearError: () => void;
}

export const useQuickImport = (config: QuickImportConfigInterface | null): QuickImportResult => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleQuickImport = () => {
        if (!isDefined(config)) {
            return;
        }

        const execute = async (): Promise<void> => {
            setIsLoading(true);
            setError(null);

            const result = await DocumentPicker.getDocumentAsync({ type: config.mimeType, copyToCacheDirectory: true });
            const uri = result.assets?.at(0)?.uri;

            if (result.canceled || !isNotEmptyString(uri)) {
                setIsLoading(false);
                
return;
            }

            await config.importHandler(uri);
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
