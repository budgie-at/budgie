/* eslint-disable lingui/no-unlocalized-strings */
import { BudgetPeriodEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly value: BudgetPeriodEnum;
    readonly onSelect: (value: BudgetPeriodEnum) => void;
}

const PERIOD_OPTIONS = [
    { value: BudgetPeriodEnum.WEEKLY, label: msg`Weekly` },
    { value: BudgetPeriodEnum.BI_WEEKLY, label: msg`Bi-weekly` },
    { value: BudgetPeriodEnum.MONTHLY, label: msg`Monthly` },
    { value: BudgetPeriodEnum.QUARTERLY, label: msg`Quarterly` },
    { value: BudgetPeriodEnum.YEARLY, label: msg`Yearly` },
    { value: BudgetPeriodEnum.CUSTOM, label: msg`Custom` }
];

export const BudgetPeriodSelector = ({ value, onSelect }: Props) => {
    const { i18n } = useLingui();

    return (
        <View className="flex-row flex-wrap gap-2">
            {PERIOD_OPTIONS.map(option => {
                const isSelected = value === option.value;
                const handlePress = () => void onSelect(option.value);
                const containerClassName = cn(
                    'flex-row items-center gap-2 rounded-full px-4 py-2 border',
                    isSelected ? 'bg-primary border-primary' : 'bg-card border-border'
                );
                const textClassName = cn('text-sm font-medium', isSelected ? 'text-primary-reverse' : 'text-secondary-foreground');

                return (
                    <HapticPressable key={option.value} onPress={handlePress} className={containerClassName}>
                        {isSelected && <Icon icon="Check" size={14} className="text-primary-reverse" />}
                        <Text className={textClassName}>{i18n.t(option.label)}</Text>
                    </HapticPressable>
                );
            })}
        </View>
    );
};
