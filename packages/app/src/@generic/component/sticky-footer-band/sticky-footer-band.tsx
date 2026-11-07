import { ReactNode, useState } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EdgeFade } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_EDGE_RAMP_LENGTH } from '../../constant/screen-chrome-config.constant';

import type { LayoutChangeEvent, ViewStyle } from 'react-native';

interface Props {
    readonly children: ReactNode;
    readonly onLayout?: (event: LayoutChangeEvent) => void;
}

const STICKY_FOOTER_STYLE = { position: 'absolute', right: 0, bottom: 0, left: 0 } satisfies ViewStyle;

export const StickyFooterBand = ({ children, onLayout }: Props): ReactNode => {
    const { bottom } = useSafeAreaInsets();
    const [footerHeight, setFooterHeight] = useState(bottom);
    const fadeHeight = Math.max(0, footerHeight - bottom) + SCREEN_CHROME_EDGE_RAMP_LENGTH;
    const handleLayout = (event: LayoutChangeEvent) => {
        setFooterHeight(event.nativeEvent.layout.height);
        onLayout?.(event);
    };

    return (
        <KeyboardStickyView style={STICKY_FOOTER_STYLE}>
            <EdgeFade position="bottom" height={fadeHeight} />
            <View className="z-3 pb-safe" onLayout={handleLayout}>
                {children}
            </View>
        </KeyboardStickyView>
    );
};
