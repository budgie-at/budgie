import { View } from 'react-native';

import { CollapsibleHeaderBackdrop, useScreenChrome } from '@rnw-community/react-native-screen-chrome';

const SCROLL_ANIMATION = { opacityInputRange: [0, 8] } as const;

const renderOpaqueBand = () => <View className="flex-1 border-b-hairline border-surface-separator bg-surface" />;

export const CategorizeInboxHeaderBackdrop = () => {
    const { config } = useScreenChrome();

    return <CollapsibleHeaderBackdrop height={config.headerHeight} scrollAnimation={SCROLL_ANIMATION} renderBand={renderOpaqueBand} />;
};
