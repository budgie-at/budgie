import { StickySectionHeaderBackdrop } from '../component/sticky-section-header-backdrop/sticky-section-header-backdrop';
import { SCREEN_CHROME_TITLE_CLEARANCE } from '../constant/screen-chrome-config.constant';

import type { StickyHeaderConfig } from '@legendapp/list/react-native';
import type { ScreenChromeConfigInterface } from '@rnw-community/react-native-screen-chrome';

export const getScreenChromeStickyHeaderConfig = (
    config: Pick<ScreenChromeConfigInterface, 'headerHeight' | 'collapsedHeaderHeight'>,
    listHeaderHeight: number
): StickyHeaderConfig => ({
    offset: Math.max((config.collapsedHeaderHeight ?? config.headerHeight) + SCREEN_CHROME_TITLE_CLEARANCE - listHeaderHeight, 0),
    backdropComponent: StickySectionHeaderBackdrop
});
