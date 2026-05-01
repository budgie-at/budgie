import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

export const useShowError = () => {
    const { t } = useLingui();

    return (error: unknown) =>
        void Toast.show({
            type: 'error',
            text1: t`Something went wrong`,
            text2: getErrorMessage(error)
        });
};
