import { View } from 'react-native';

import { CollapsibleHeaderBackdrop } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../../@generic/constant/screen-chrome-content-inset.constant';
import { SCREEN_CHROME_HEADER_BAND_HEIGHT } from '../../../@generic/constant/screen-chrome-header-band-height.constant';

const SCROLL_ANIMATION = { opacityInputRange: [0, SCREEN_CHROME_CONTENT_INSET_TOP - SCREEN_CHROME_HEADER_BAND_HEIGHT] } as const;

const renderSolidBand = () => (
    <View className="flex-1">
        <View className="flex-1 bg-surface" />
        <View className="h-[12px] bg-linear-to-b from-surface via-surface/25 to-transparent" />
    </View>
);

export const AccountDetailsHeaderBackdrop = () => (
    <CollapsibleHeaderBackdrop height={SCREEN_CHROME_HEADER_BAND_HEIGHT} scrollAnimation={SCROLL_ANIMATION} renderBand={renderSolidBand} />
);
