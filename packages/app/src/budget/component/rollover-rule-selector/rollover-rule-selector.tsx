import { BudgetRolloverRuleEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useCallback } from 'react';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

const ROLLOVER_OPTIONS = [
    { value: BudgetRolloverRuleEnum.NONE, label: msg`None`, hint: msg`Unused budget is lost at period end` },
    { value: BudgetRolloverRuleEnum.CARRY_POSITIVE, label: msg`Carry Surplus`, hint: msg`Only unspent amounts roll over` },
    { value: BudgetRolloverRuleEnum.CARRY_ALL, label: msg`Carry All`, hint: msg`Both surplus and deficit roll over` }
];

const optionVariants = cva('flex-1 items-center py-2 rounded-lg border', {
    variants: {
        active: {
            true: 'bg-primary border-primary',
            false: 'bg-secondary-background border-secondary-corner'
        }
    },
    defaultVariants: { active: false }
});

const optionTextVariants = cva('text-xs', {
    variants: {
        active: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground'
        }
    },
    defaultVariants: { active: false }
});

interface Props {
    readonly value: BudgetRolloverRuleEnum;
    readonly onChange: (value: BudgetRolloverRuleEnum) => void;
}

export const RolloverRuleSelector = ({ value, onChange }: Props) => {
    const { i18n } = useLingui();

    const selectedOption = ROLLOVER_OPTIONS.find(opt => opt.value === value);

    const handleNonePress = useCallback(() => void onChange(BudgetRolloverRuleEnum.NONE), [onChange]);
    const handleCarryPositivePress = useCallback(() => void onChange(BudgetRolloverRuleEnum.CARRY_POSITIVE), [onChange]);
    const handleCarryAllPress = useCallback(() => void onChange(BudgetRolloverRuleEnum.CARRY_ALL), [onChange]);

    const handlers = {
        [BudgetRolloverRuleEnum.NONE]: handleNonePress,
        [BudgetRolloverRuleEnum.CARRY_POSITIVE]: handleCarryPositivePress,
        [BudgetRolloverRuleEnum.CARRY_ALL]: handleCarryAllPress
    };

    return (
        <View className="gap-2">
            <View className="flex-row gap-2">
                {ROLLOVER_OPTIONS.map(option => {
                    const isSelected = value === option.value;

                    return (
                        <HapticPressable
                            key={option.value}
                            onPress={handlers[option.value]}
                            className={optionVariants({ active: isSelected })}
                        >
                            <Text className={optionTextVariants({ active: isSelected })}>{i18n.t(option.label)}</Text>
                        </HapticPressable>
                    );
                })}
            </View>
            {selectedOption && <Text className="text-xs text-secondary-foreground">{i18n.t(selectedOption.hint)}</Text>}
        </View>
    );
};

