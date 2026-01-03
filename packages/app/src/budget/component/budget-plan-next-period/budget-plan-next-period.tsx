import { BudgetEntityInterface, BudgetPeriodEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { budgetService } from '../../service/budget.service';
import { FuturePeriodItem } from '../future-period-item/future-period-item';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly currentPeriodEndDate: Date;
}

interface FuturePeriod {
    readonly startDate: Date;
    readonly endDate: Date;
    readonly label: string;
}

const FUTURE_PERIODS_COUNT = 3;

export const BudgetPlanNextPeriod = ({ budget, currentPeriodEndDate }: Props) => {
    const { t } = useLingui();
    const [creatingPeriod, setCreatingPeriod] = useState<string | null>(null);
    const [createdPeriods, setCreatedPeriods] = useState<Set<string>>(new Set());
    const { formatMonthAndDay } = useFormatDate();

    const futurePeriods = budgetService.calculateFuturePeriods(budget.period, budget.startDay, currentPeriodEndDate, FUTURE_PERIODS_COUNT);

    const handleCreatePeriod = async (period: FuturePeriod) => {
        setCreatingPeriod(period.label);

        try {
            await budgetService.createBudgetInstance(budget.id, period.startDate, period.endDate);
            setCreatedPeriods(prev => new Set([...prev, period.label]));
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to create budget period` });
        } finally {
            setCreatingPeriod(null);
        }
    };

    const formatDateRange = (startDate: Date, endDate: Date) => `${formatMonthAndDay(startDate)} - ${formatMonthAndDay(endDate)}`;

    const periodTypeLabel = budget.period === BudgetPeriodEnum.WEEKLY ? t`Weekly` : t`Monthly`;

    return (
        <Card className="gap-3">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                    <Icon icon={UserIconNameEnum.Calendar} size={16} className="text-primary" />
                    <Text className="text-sm font-medium text-primary">
                        <Trans>Plan Future Periods</Trans>
                    </Text>
                </View>
                <Text className="text-xs text-secondary-foreground">{periodTypeLabel}</Text>
            </View>

            <Text className="text-xs text-secondary-foreground">
                <Trans>Pre-plan your budget for upcoming periods</Trans>
            </Text>

            <View className="gap-2">
                {futurePeriods.map(period => (
                    <FuturePeriodItem
                        key={period.label}
                        period={period}
                        creatingPeriod={creatingPeriod}
                        createdPeriods={createdPeriods}
                        formatDateRange={formatDateRange}
                        onCreatePeriod={handleCreatePeriod}
                    />
                ))}
            </View>
        </Card>
    );
};
