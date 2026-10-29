import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';

interface Props {
    readonly label: string;
    readonly amount: string;
}

export const BudgetBreakdownRow = ({ label, amount }: Props) => (
    <View className="flex-row items-baseline justify-between gap-x-md">
        <Text className="shrink text-sm text-secondary-foreground">{label}</Text>
        <ProtectedText className="text-sm tabular-nums text-secondary-foreground">{amount}</ProtectedText>
    </View>
);
