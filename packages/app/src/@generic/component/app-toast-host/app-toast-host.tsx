import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { APP_TOAST_CONFIG } from '../../constant/app-toast-config.constant';

const APP_TOAST_MIN_TOP_OFFSET = 40;
const APP_TOAST_TOP_SAFE_AREA_SPACING = 12;

export const AppToastHost = () => {
    const { top } = useSafeAreaInsets();

    const topOffset = Math.max(top + APP_TOAST_TOP_SAFE_AREA_SPACING, APP_TOAST_MIN_TOP_OFFSET);

    return <Toast config={APP_TOAST_CONFIG} topOffset={topOffset} />;
};
