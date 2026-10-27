import { View } from 'react-native';

import { CollapsibleHeaderBackdrop, SCREEN_CHROME_HEADER_LAYOUT_METRICS } from '@rnw-community/react-native-screen-chrome';

const BAND_HEIGHT = SCREEN_CHROME_HEADER_LAYOUT_METRICS.slotSize + 12;
const SCROLL_ANIMATION = { opacityInputRange: [0, SCREEN_CHROME_HEADER_LAYOUT_METRICS.slotSize] } as const;

const renderSolidBand = () => (
    <View className="flex-1">
        <View className="flex-1 bg-primary-reverse" />
        <View className="h-[12px] bg-linear-to-b from-primary-reverse via-primary-reverse/25 to-transparent" />
    </View>
);

export const AccountDetailsHeaderBackdrop = () => (
    <CollapsibleHeaderBackdrop height={BAND_HEIGHT} scrollAnimation={SCROLL_ANIMATION} renderBand={renderSolidBand} />
);
