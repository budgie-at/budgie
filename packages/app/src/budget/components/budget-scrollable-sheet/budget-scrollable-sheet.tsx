import { ReactNode } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
    readonly children: ReactNode;
    readonly testID?: string;
}

export const BudgetScrollableSheet = ({ children, testID }: Props) => {
    const { height } = useWindowDimensions();
    const { top, bottom } = useSafeAreaInsets();
    const scrollViewStyle = { flexGrow: 0, maxHeight: height - top - bottom };

    return (
        <View className="bg-sheet-surface" collapsable={false} testID={testID}>
            <ScrollView
                className="bg-sheet-surface"
                style={scrollViewStyle}
                contentInsetAdjustmentBehavior="automatic"
                showsVerticalScrollIndicator={false}
            >
                {children}
            </ScrollView>
        </View>
    );
};
