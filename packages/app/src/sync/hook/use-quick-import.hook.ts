import { getLogger } from '@budgie/logger';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { QuickImportConfigInterface } from '../interface/quick-import-config.interface';

const logger = getLogger('useQuickImport');

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
            logger.log('handleQuickImport:skipped:no-config');

            return;
        }

        const execute = async (): Promise<void> => {
            logger.log('picker:start', { mimeType: config.mimeType });
            setIsLoading(true);
            setError(null);

            const result = await DocumentPicker.getDocumentAsync({ type: config.mimeType, copyToCacheDirectory: true });
            const { uri, name, size } = result.assets?.at(0) ?? {};
            logger.log('picker:done', { canceled: result.canceled, hasUri: isNotEmptyString(uri), name: name ?? '', sizeBytes: size ?? 0 });

            if (result.canceled || !isNotEmptyString(uri)) {
                setIsLoading(false);
                logger.log('picker:cancelled-or-empty');

                return;
            }

            logger.log('importHandler:start', { uri });
            await config.importHandler(uri);
            logger.log('importHandler:done', { uri });
        };

        void execute()
            .catch((importError: unknown) => {
                logger.error('execute:failed', { errorMessage: getErrorMessage(importError) });
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
