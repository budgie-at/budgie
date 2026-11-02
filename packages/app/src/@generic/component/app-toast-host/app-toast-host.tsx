import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { APP_TOAST_CONFIG } from '../../constant/app-toast-config.constant';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../constant/floating-tab-bar.constant';
import { SEARCH_LIST_BOTTOM_CLEARANCE } from '../searchable-page/searchable-page.constant';

const TOAST_TOP_GAP = 8;

export const AppToastHost = () => {
    const insets = useSafeAreaInsets();

    const topOffset = insets.top + TOAST_TOP_GAP;
    const bottomOffset = insets.bottom + FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + SEARCH_LIST_BOTTOM_CLEARANCE;

    return <Toast config={APP_TOAST_CONFIG} topOffset={topOffset} bottomOffset={bottomOffset} />;
};
