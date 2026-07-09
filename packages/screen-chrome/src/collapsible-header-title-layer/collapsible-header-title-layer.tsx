import { ReactNode } from 'react';
import { FlexAlignType } from 'react-native';
import Animated from 'react-native-reanimated';

import { useScrollFadeStyle } from '../hook/use-scroll-fade-style.hook';

import { collapsibleHeaderTitleLayerStyles } from './collapsible-header-title-layer.styles';

interface Props {
    readonly children: ReactNode;
    readonly inputRange: readonly [number, number];
    readonly outputRange: readonly [number, number];
    readonly alignItems: FlexAlignType;
}

export const CollapsibleHeaderTitleLayer = ({ children, inputRange, outputRange, alignItems }: Props): ReactNode => {
    const animatedStyle = useScrollFadeStyle(inputRange, outputRange);
    const alignItemsStyle = { alignItems };
    const layerStyle = [collapsibleHeaderTitleLayerStyles.container, alignItemsStyle, animatedStyle];

    return (
        <Animated.View pointerEvents="none" style={layerStyle}>
            {children}
        </Animated.View>
    );
};
