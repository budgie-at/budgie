import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';

import type { TransactionInfoSimilarPeriodButtonPropsInterface } from '../../interface/transaction-info-similar-period-button-props.interface';

export const TransactionInfoSimilarPeriodButton = ({
    label,
    period,
    selectedPeriod,
    onPeriodChange
}: TransactionInfoSimilarPeriodButtonPropsInterface) => {
    const isSelected = period === selectedPeriod;
    const className = isSelected ? 'bg-primary-reverse' : 'bg-transparent';
    const textClassName = isSelected ? 'text-primary-reverse' : 'text-secondary-foreground';

    const handlePress = () => {
        onPeriodChange(period);
    };

    return (
        <HapticPressable className={cn('rounded-full px-md py-xs', className)} onPress={handlePress}>
            <Text className={cn('text-xs font-semibold', textClassName)}>{label}</Text>
        </HapticPressable>
    );
};
