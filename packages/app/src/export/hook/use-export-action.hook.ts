import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';

import type { UseExportActionOptionsInterface } from '../interface/use-export-action-options.interface';

export const useExportAction = ({ exportAction, successTitle, successMessage, errorTitle }: UseExportActionOptionsInterface) => {
    const { isLoading, run } = useSingleFlight();

    const handleExport = () =>
        run(async () => {
            try {
                await exportAction();
                Toast.show({ type: 'success', text1: successTitle, text2: successMessage });
            } catch (error) {
                Toast.show({ type: 'error', text1: errorTitle, text2: getErrorMessage(error) });
            }
        });

    return { isLoading, handleExport };
};
