import { StickySectionHeaderBackdrop } from '../component/sticky-section-header-backdrop/sticky-section-header-backdrop';

import type { StickyHeaderConfig } from '@legendapp/list/react-native';
import type { ScreenChromeConfigInterface } from '@rnw-community/react-native-screen-chrome';

export const getScreenChromeStickyHeaderConfig = (
    config: Pick<ScreenChromeConfigInterface, 'headerBackdropHeight'>,
    listHeaderHeight: number
): StickyHeaderConfig => ({
    offset: Math.max(config.headerBackdropHeight - listHeaderHeight, 0),
    backdropComponent: StickySectionHeaderBackdrop
});
