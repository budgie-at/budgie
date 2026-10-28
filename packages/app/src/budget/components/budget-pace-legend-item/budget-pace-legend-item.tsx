import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly amount: string;
    readonly swatchClassName: string;
}

export const BudgetPaceLegendItem = ({ label, amount, swatchClassName }: Props) => (
    <View className="flex-1 gap-y-xs">
        <View className="flex-row items-center gap-x-xs">
            <View className={cn('h-2 w-2 rounded-full', swatchClassName)} />
            <Text className="text-xs text-secondary-foreground">{label}</Text>
        </View>
        <ProtectedText className="text-sm font-semibold tabular-nums text-primary">{amount}</ProtectedText>
    </View>
);
