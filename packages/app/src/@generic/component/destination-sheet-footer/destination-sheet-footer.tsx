import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const MIN_BOTTOM_SPACING = 16;

export const DestinationSheetFooter = ({ children }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const style = { paddingBottom: Math.max(bottom, MIN_BOTTOM_SPACING) };

    return (
        <View className="border-t-hairline border-surface-separator bg-primary-reverse px-xl pt-lg" style={style}>
            {children}
        </View>
    );
};
