import { type PropsWithChildren, useState } from 'react';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HostAccessibilityContext } from '../context/host-accessibility.context';

export const HostAccessibilityProvider = ({ children }: PropsWithChildren) => {
    const [overlayCount, setOverlayCount] = useState(0);

    return (
        <HostAccessibilityContext value={setOverlayCount}>
            <View className="flex-1" accessibilityElementsHidden={isPositiveNumber(overlayCount)}>
                {children}
            </View>
        </HostAccessibilityContext>
    );
};
