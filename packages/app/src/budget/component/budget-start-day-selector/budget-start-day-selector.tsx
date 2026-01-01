/* eslint-disable lingui/no-unlocalized-strings */
import { BudgetPeriodEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly period: BudgetPeriodEnum;
    readonly value: number;
    readonly onSelect: (value: number) => void;
}

const DAYS_OF_WEEK = [
    { value: 0, label: msg`Sun` },
    { value: 1, label: msg`Mon` },
    { value: 2, label: msg`Tue` },
    { value: 3, label: msg`Wed` },
    { value: 4, label: msg`Thu` },
    { value: 5, label: msg`Fri` },
    { value: 6, label: msg`Sat` }
];

const MONTHS_OF_YEAR = [
    { value: 1, label: msg`Jan` },
    { value: 2, label: msg`Feb` },
    { value: 3, label: msg`Mar` },
    { value: 4, label: msg`Apr` },
    { value: 5, label: msg`May` },
    { value: 6, label: msg`Jun` },
    { value: 7, label: msg`Jul` },
    { value: 8, label: msg`Aug` },
    { value: 9, label: msg`Sep` },
    { value: 10, label: msg`Oct` },
    { value: 11, label: msg`Nov` },
    { value: 12, label: msg`Dec` }
];

const QUARTER_MONTHS = [
    { value: 1, label: msg`1st Month` },
    { value: 2, label: msg`2nd Month` },
    { value: 3, label: msg`3rd Month` }
];

const MONTH_DAY_OPTIONS = [1, 5, 10, 15, 20, 25];

export const BudgetStartDaySelector = ({ period, value, onSelect }: Props) => {
    const { t, i18n } = useLingui();

    if (period === BudgetPeriodEnum.WEEKLY || period === BudgetPeriodEnum.BI_WEEKLY) {
        return (
            <View className="flex-row flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => {
                    const isSelected = value === day.value;
                    const handlePress = () => {
                        onSelect(day.value);
                    };
                    const buttonClassName = cn(
                        'px-3 py-2 rounded-xl border',
                        isSelected ? 'bg-primary border-primary' : 'bg-secondary-background border-secondary-corner'
                    );
                    const textClassName = cn(
                        'text-sm font-medium',
                        isSelected ? 'text-primary-reverse' : 'text-secondary-foreground'
                    );

                    return (
                        <HapticPressable key={day.value} onPress={handlePress} className={buttonClassName}>
                            <Text className={textClassName}>{i18n.t(day.label)}</Text>
                        </HapticPressable>
                    );
                })}
            </View>
        );
    }

    if (period === BudgetPeriodEnum.YEARLY) {
        return (
            <View className="flex-row flex-wrap gap-2">
                {MONTHS_OF_YEAR.map(month => {
                    const isSelected = value === month.value;
                    const handlePress = () => {
                        onSelect(month.value);
                    };
                    const buttonClassName = cn(
                        'px-3 py-2 rounded-xl border',
                        isSelected ? 'bg-primary border-primary' : 'bg-secondary-background border-secondary-corner'
                    );
                    const textClassName = cn(
                        'text-sm font-medium',
                        isSelected ? 'text-primary-reverse' : 'text-secondary-foreground'
                    );

                    return (
                        <HapticPressable key={month.value} onPress={handlePress} className={buttonClassName}>
                            <Text className={textClassName}>{i18n.t(month.label)}</Text>
                        </HapticPressable>
                    );
                })}
            </View>
        );
    }

    if (period === BudgetPeriodEnum.QUARTERLY) {
        return (
            <View className="flex-row flex-wrap gap-2">
                {QUARTER_MONTHS.map(month => {
                    const isSelected = value === month.value;
                    const handlePress = () => {
                        onSelect(month.value);
                    };
                    const buttonClassName = cn(
                        'px-4 py-2 rounded-xl border',
                        isSelected ? 'bg-primary border-primary' : 'bg-secondary-background border-secondary-corner'
                    );
                    const textClassName = cn(
                        'text-sm font-medium',
                        isSelected ? 'text-primary-reverse' : 'text-secondary-foreground'
                    );

                    return (
                        <HapticPressable key={month.value} onPress={handlePress} className={buttonClassName}>
                            <Text className={textClassName}>{i18n.t(month.label)}</Text>
                        </HapticPressable>
                    );
                })}
            </View>
        );
    }

    return (
        <View className="gap-2">
            <View className="flex-row flex-wrap gap-2">
                {MONTH_DAY_OPTIONS.map(day => {
                    const isSelected = value === day;
                    const handlePress = () => {
                        onSelect(day);
                    };
                    const buttonClassName = cn(
                        'px-4 py-2 rounded-xl border',
                        isSelected ? 'bg-primary border-primary' : 'bg-secondary-background border-secondary-corner'
                    );
                    const textClassName = cn(
                        'text-sm font-medium',
                        isSelected ? 'text-primary-reverse' : 'text-secondary-foreground'
                    );

                    return (
                        <HapticPressable key={day} onPress={handlePress} className={buttonClassName}>
                            <Text className={textClassName}>{day}</Text>
                        </HapticPressable>
                    );
                })}
            </View>
            {!MONTH_DAY_OPTIONS.includes(value) && value > 0 && (
                <Text className="text-xs text-secondary-foreground">{t`Current: Day ${value}`}</Text>
            )}
        </View>
    );
};
