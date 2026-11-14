import { use } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isPositiveNumber } from '@rnw-community/shared';

import { FLOATING_TAB_BAR_MARGIN, FLOATING_TAB_BAR_MIN_BOTTOM_INSET } from '../constant/floating-tab-bar.constant';
import { TabBarClearanceContext } from '../context/tab-bar-clearance.context';

export const useSearchInputBottom = (): number => {
    const { bottom } = useSafeAreaInsets();
    const tabBarClearance = use(TabBarClearanceContext);

    return isPositiveNumber(tabBarClearance)
        ? Math.max(bottom, FLOATING_TAB_BAR_MIN_BOTTOM_INSET) + tabBarClearance
        : Math.max(bottom, FLOATING_TAB_BAR_MARGIN);
};
