import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly amount: string;
    readonly className?: string;
}

export const BudgetBreakdownRow = ({ label, amount, className = 'text-secondary-foreground' }: Props) => (
    <View className="flex-row items-baseline justify-between gap-x-md">
        <Text className={cn('shrink text-md', className)}>{label}</Text>
        <ProtectedText className={cn('text-md tabular-nums', className)}>{amount}</ProtectedText>
    </View>
);
