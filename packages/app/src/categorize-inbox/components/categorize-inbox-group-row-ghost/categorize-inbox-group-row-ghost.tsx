import { View } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const CategorizeInboxGroupRowGhost = ({ children }: Props) => (
    <View className="opacity-0" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
        {children}
    </View>
);
