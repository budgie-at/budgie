import { View } from 'react-native';

import { CollapsibleHeaderBackdrop } from '@rnw-community/react-native-screen-chrome';

import type { EdgeFadeBandRenderPropsInterface } from '@rnw-community/react-native-screen-chrome';

const renderSurfaceBand = ({ blur }: EdgeFadeBandRenderPropsInterface) => (
    <View className="flex-1">
        {blur}
        <View className="absolute inset-0 bg-linear-to-b from-surface/70 to-transparent" />
    </View>
);

export const CategorizeInboxHeaderBackdrop = () => <CollapsibleHeaderBackdrop renderBand={renderSurfaceBand} />;
