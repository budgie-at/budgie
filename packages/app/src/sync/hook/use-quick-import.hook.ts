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
            logger.log('skip:no-config');

            return;
        }

        const execute = async (): Promise<void> => {
            setIsLoading(true);
            setError(null);
            logger.log('picker:open', { source: config.source, mimeType: config.mimeType });

            const result = await DocumentPicker.getDocumentAsync({ type: config.mimeType, copyToCacheDirectory: true });
            const uri = result.assets?.at(0)?.uri;
            logger.log('picker:result', { source: config.source, canceled: result.canceled, assetCount: result.assets?.length ?? 0, uri });

            if (result.canceled || !isNotEmptyString(uri)) {
                logger.log('skip:no-uri', { source: config.source, canceled: result.canceled, uri });
                setIsLoading(false);

                return;
            }

            logger.log('import:begin', { source: config.source, uri });
            const importResult = await config.importHandler(uri);
            logger.log('import:done', { source: config.source, uri, ...importResult });
        };

        void execute()
            .catch((importError: unknown) => {
                logger.error('import:throw', importError);
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
