import { View } from 'react-native';

import { CollapsibleHeaderBackdrop, useScreenChromeHeaderMetrics } from '@rnw-community/react-native-screen-chrome';

import type { EdgeFadeBandRenderPropsInterface } from '@rnw-community/react-native-screen-chrome';

const SCROLL_ANIMATION = { opacityInputRange: [0, 12] } as const;

export const TransactionFormHeaderBackdrop = () => {
    const titleBandHeight = useScreenChromeHeaderMetrics();
    const titleBandStyle = { height: titleBandHeight };

    const renderBand = ({ defaultBand }: EdgeFadeBandRenderPropsInterface) => (
        <View className="flex-1">
            <View style={titleBandStyle} className="bg-surface" />
            <View className="flex-1">{defaultBand}</View>
        </View>
    );

    return <CollapsibleHeaderBackdrop scrollAnimation={SCROLL_ANIMATION} renderBand={renderBand} />;
};
