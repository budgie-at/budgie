import { type PropsWithChildren, useState } from 'react';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HostAccessibilityContext } from '../context/host-accessibility.context';

export const HostAccessibilityProvider = ({ children }: PropsWithChildren) => {
    const [openCount, setOpenCount] = useState(0);
    const layers = { openCount, setOpenCount };

    return (
        <HostAccessibilityContext value={layers}>
            <View className="flex-1" accessibilityElementsHidden={isPositiveNumber(openCount)}>
                {children}
            </View>
        </HostAccessibilityContext>
    );
};
