import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

interface Props {
    readonly children: ReactNode;
    readonly testID?: string;
}

export const BudgetScrollableSheet = ({ children, testID }: Props) => (
    <View className="flex-1 bg-sheet-surface" collapsable={false} testID={testID}>
        <ScrollView className="flex-1 bg-sheet-surface" contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
            {children}
        </ScrollView>
    </View>
);
