import { View } from 'react-native';
import { Edges, SafeAreaView } from 'react-native-safe-area-context';

import type { PropsWithChildren } from 'react';

const edges: Edges = ['left', 'right'];

export const BottomTabs = ({ children }: PropsWithChildren) => (
    <SafeAreaView edges={edges}>
        <View className="flex-row pb-4 justify-evenly border-t border-t-secondary-corner items-baseline">{children}</View>
    </SafeAreaView>
);
