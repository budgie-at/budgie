import { type PropsWithChildren, useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { HostAccessibilityContext } from '../context/host-accessibility.context';

export const HostAccessibilityProvider = ({ children }: PropsWithChildren) => {
    const [layers, setLayers] = useState<readonly string[]>([]);
    const hostAccessibility = { layers, setLayers };

    return (
        <HostAccessibilityContext value={hostAccessibility}>
            <View className="flex-1" accessibilityElementsHidden={isNotEmptyArray(layers)}>
                {children}
            </View>
        </HostAccessibilityContext>
    );
};
