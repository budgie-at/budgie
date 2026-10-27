import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';

import type { UseExportActionOptionsInterface } from '../interface/use-export-action-options.interface';

export const useExportAction = ({ exportAction, successTitle, successMessage, errorTitle }: UseExportActionOptionsInterface) => {
    const { isLoading, run } = useSingleFlight();

    const handleExport = () =>
        run(
            exportAction.pipe(
                Effect.tap(() => Effect.sync(() => void Toast.show({ type: 'success', text1: successTitle, text2: successMessage }))),
                toastOnFailure(errorTitle)
            )
        );

    return { isLoading, handleExport };
};
