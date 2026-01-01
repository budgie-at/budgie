/* eslint-disable lingui/no-unlocalized-strings, max-lines-per-function, no-nested-ternary */
import { BudgetEntityInterface, BudgetPeriodEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { budgetService } from '../../service/budget.service';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly currentPeriodEndDate: Date;
}

interface FuturePeriod {
    readonly startDate: Date;
    readonly endDate: Date;
    readonly label: string;
    readonly isCreated: boolean;
}

export const BudgetPlanNextPeriod = ({ budget, currentPeriodEndDate }: Props) => {
    const { t } = useLingui();
    const [creatingPeriod, setCreatingPeriod] = useState<string | null>(null);
    const [createdPeriods, setCreatedPeriods] = useState<Set<string>>(new Set());

    const futurePeriods: FuturePeriod[] = useMemo(() => {
        const periods = budgetService.calculateFuturePeriods(
            budget.period,
            budget.startDay,
            currentPeriodEndDate,
            3
        );

        return periods.map(period => ({
            ...period,
            isCreated: createdPeriods.has(period.label)
        }));
    }, [budget.period, budget.startDay, currentPeriodEndDate, createdPeriods]);

    const handleCreatePeriod = useCallback(
        async (period: FuturePeriod) => {
            if (period.isCreated) {
                return;
            }

            setCreatingPeriod(period.label);
            const periodLabel = period.label;

            try {
                await budgetService.createFutureBudgetInstance(budget.id, period.startDate, period.endDate);
                setCreatedPeriods(prev => new Set([...prev, period.label]));
                Toast.show({
                    type: 'success',
                    text1: t`Period Created`,
                    text2: t`Budget for ${periodLabel} has been planned`
                });
            } catch {
                Toast.show({
                    type: 'error',
                    text1: t`Error`,
                    text2: t`Failed to create budget period`
                });
            } finally {
                setCreatingPeriod(null);
            }
        },
        [budget.id, t]
    );

    const formatDateRange = (startDate: Date, endDate: Date) => {
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        const start = startDate.toLocaleDateString('en-US', options);
        const end = endDate.toLocaleDateString('en-US', options);

        return `${start} - ${end}`;
    };

    const getPeriodTypeLabel = () => {
        if (budget.period === BudgetPeriodEnum.WEEKLY) {
            return t`Weekly`;
        }

        return t`Monthly`;
    };

    return (
        <Card className="gap-3">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                    <Icon icon="Calendar" size={16} className="text-primary" />
                    <Text className="text-sm font-medium text-primary">
                        <Trans>Plan Future Periods</Trans>
                    </Text>
                </View>
                <Text className="text-xs text-secondary-foreground">{getPeriodTypeLabel()}</Text>
            </View>

            <Text className="text-xs text-secondary-foreground">
                <Trans>Pre-plan your budget for upcoming periods</Trans>
            </Text>

            <View className="gap-2">
                {futurePeriods.map(period => {
                    const isCreating = creatingPeriod === period.label;
                    const buttonClassName = cn(
                        'flex-row items-center justify-between py-3 px-4 rounded-xl border',
                        period.isCreated
                            ? 'bg-positive-background border-positive-corner'
                            : 'bg-secondary-background border-secondary-corner'
                    );
                    const isDisabled = period.isCreated || isDefined(creatingPeriod);
                    const handlePress = () => void handleCreatePeriod(period);

                    return (
                        <HapticPressable
                            key={period.label}
                            className={buttonClassName}
                            onPress={handlePress}
                            disabled={isDisabled}
                        >
                            <View>
                                <Text className="text-sm font-medium text-primary">{period.label}</Text>
                                <Text className="text-xs text-secondary-foreground">
                                    {formatDateRange(period.startDate, period.endDate)}
                                </Text>
                            </View>

                            {period.isCreated ? (
                                <View className="flex-row items-center gap-1">
                                    <Icon icon="CheckCircle" size={16} className="text-positive-foreground" />
                                    <Text className="text-xs text-positive-foreground">
                                        <Trans>Planned</Trans>
                                    </Text>
                                </View>
                            ) : isCreating ? (
                                <Text className="text-xs text-secondary-foreground">
                                    <Trans>Creating...</Trans>
                                </Text>
                            ) : (
                                <View className="flex-row items-center gap-1">
                                    <Icon icon="Plus" size={16} className="text-primary" />
                                    <Text className="text-xs text-primary">
                                        <Trans>Plan</Trans>
                                    </Text>
                                </View>
                            )}
                        </HapticPressable>
                    );
                })}
            </View>
        </Card>
    );
};

