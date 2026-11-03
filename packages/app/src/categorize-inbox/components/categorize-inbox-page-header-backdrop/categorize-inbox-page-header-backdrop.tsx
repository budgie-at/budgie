import { View, useWindowDimensions } from 'react-native';

import { CollapsibleHeaderBackdrop, useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../../@generic/constant/screen-chrome-content-inset.constant';
import { SCREEN_CHROME_HEADER_BAND_HEIGHT } from '../../../@generic/constant/screen-chrome-header-band-height.constant';
import { ACCOUNT_DETAILS_NAV_BALANCE_OFFSET } from '../../../account/constant/account-details-nav-balance-offset.constant';

const SCROLL_ANIMATION = { opacityInputRange: [0, SCREEN_CHROME_CONTENT_INSET_TOP - SCREEN_CHROME_HEADER_BAND_HEIGHT] } as const;
const SUBTITLE_LINE_HEIGHT = 18;
const SUBTITLE_BOTTOM_CLEARANCE = 8;

const renderOpaqueBand = () => <View className="flex-1 border-b-hairline border-surface-separator bg-surface" />;

export const CategorizeInboxPageHeaderBackdrop = () => {
    const { config } = useScreenChrome();
    const { fontScale } = useWindowDimensions();

    const subtitleBottom =
        (config.collapsedHeaderHeight ?? config.headerHeight) / 2 + (ACCOUNT_DETAILS_NAV_BALANCE_OFFSET + SUBTITLE_LINE_HEIGHT) * fontScale;
    const height = Math.max(SCREEN_CHROME_HEADER_BAND_HEIGHT, subtitleBottom + SUBTITLE_BOTTOM_CLEARANCE);

    return <CollapsibleHeaderBackdrop height={height} scrollAnimation={SCROLL_ANIMATION} renderBand={renderOpaqueBand} />;
};
