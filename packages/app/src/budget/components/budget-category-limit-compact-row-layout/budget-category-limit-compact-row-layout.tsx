import { Text, View } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly amountInput: ReactNode;
    readonly icon: ReactNode;
    readonly testID: string;
    readonly title: string;
}

export const BudgetCategoryLimitCompactRowLayout = ({ amountInput, icon, testID, title }: Props) => (
    <View testID={testID} collapsable={false} className="flex-row items-center gap-x-md bg-primary-reverse px-md py-sm rounded-2xl">
        {icon}
        <Text className="text-primary text-md flex-1" numberOfLines={1}>
            {title}
        </Text>
        {amountInput}
    </View>
);
