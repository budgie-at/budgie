import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

export const useExportAction = (exportFn: () => Promise<void>) => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async () => {
        setIsLoading(true);
        try {
            await exportFn();
            Toast.show({ type: 'success', text1: t`Done`, text2: t`Export CSV` });
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Export Failed`, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, handleExport };
};
