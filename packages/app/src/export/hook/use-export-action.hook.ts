import { useLingui } from '@lingui/react/macro';
import { useCallback, useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

export const useExportAction = (exportFn: () => Promise<void>) => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = useCallback(async () => {
        setIsLoading(true);
        try {
            await exportFn();
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Export Failed`, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    }, [exportFn, t]);

    return { isLoading, handleExport };
};
