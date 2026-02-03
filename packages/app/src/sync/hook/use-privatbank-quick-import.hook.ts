import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { XLSX_MIME_TYPE } from '../constant/xlsx-mime-type.constant';
import { privatbankSyncQuickImport } from '../service/privatbank-sync.service';
import { readFileAsUint8Array } from '../util/read-file-as-uint8-array.util';

interface PrivatbankQuickImportResult {
    readonly isLoading: boolean;
    readonly error: string | null;
    readonly handleQuickImport: () => void;
    readonly clearError: () => void;
}

export const usePrivatbankQuickImport = (): PrivatbankQuickImportResult => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleQuickImport = () => {
        const execute = async (): Promise<void> => {
            setIsLoading(true);
            setError(null);

            const result = await DocumentPicker.getDocumentAsync({ type: XLSX_MIME_TYPE, copyToCacheDirectory: true });
            const { uri } = result.assets?.at(0) ?? {};

            if (result.canceled || !isNotEmptyString(uri)) {
                setIsLoading(false);

                return;
            }

            const buffer = await readFileAsUint8Array(uri);
            await privatbankSyncQuickImport(buffer);
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
