import { Text, View } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly amountInput: ReactNode;
    readonly icon: ReactNode;
    readonly subtitle: ReactNode;
    readonly testID: string;
    readonly title: string;
}

export const BudgetCategoryLimitCompactRowLayout = ({ amountInput, icon, subtitle, testID, title }: Props) => (
    <View collapsable={false} className="flex-row items-center gap-x-md bg-primary-reverse px-md py-sm rounded-2xl">
        {icon}
        <View className="flex-1 items-start">
            <Text className="text-primary text-md" numberOfLines={1} testID={testID}>
                {title}
            </Text>
            {subtitle}
        </View>
        {amountInput}
    </View>
);
