import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { APP_TOAST_CONFIG } from '../../constant/app-toast-config.constant';

const TOAST_TOP_GAP = 8;

export const AppToastHost = () => {
    const insets = useSafeAreaInsets();

    const topOffset = insets.top + TOAST_TOP_GAP;

    return <Toast config={APP_TOAST_CONFIG} topOffset={topOffset} />;
};
