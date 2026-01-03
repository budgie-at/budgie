import { BudgetPeriodEnum, UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

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

const containerVariants = cva('flex-row items-center gap-2 rounded-full px-4 py-2 border', {
    variants: {
        isSelected: {
            true: 'bg-primary border-primary',
            false: 'bg-card border-border'
        }
    }
});

const textVariants = cva('text-sm font-medium', {
    variants: {
        isSelected: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground'
        }
    }
});

export const BudgetPeriodSelector = ({ value, onSelect }: Props) => {
    const { i18n } = useLingui();

    return (
        <View className="flex-row flex-wrap gap-2">
            {PERIOD_OPTIONS.map(option => {
                const isSelected = value === option.value;
                const handlePress = () => void onSelect(option.value);

                return (
                    <HapticPressable key={option.value} onPress={handlePress} className={containerVariants({ isSelected })}>
                        {isSelected && <Icon icon={UserIconNameEnum.Check} size={14} className="text-primary-reverse" />}
                        <Text className={textVariants({ isSelected })}>{i18n.t(option.label)}</Text>
                    </HapticPressable>
                );
            })}
        </View>
    );
};
