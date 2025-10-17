import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PropsWithChildren } from 'react';

export const BottomTabs = ({ children }: PropsWithChildren) => (
    <SafeAreaView>
        <View className="flex-row justify-evenly border-t border-t-border-secondary items-baseline">{children}</View>
    </SafeAreaView>
);
