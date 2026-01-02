import { BudgetAllocationEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { BudgetHistoricalPeriodCard } from '../budget-historical-period-card/budget-historical-period-card';

interface HistoricalPeriod {
    readonly label: string;
    readonly startDate: Date;
    readonly endDate: Date;
}

interface Props {
    readonly periods: readonly HistoricalPeriod[];
    readonly categoryIds: readonly number[];
    readonly totalPlanned: number;
    readonly currencySymbol: string;
    readonly allocations: readonly BudgetAllocationEntityInterface[];
}

export const BudgetHistoricalPeriods = ({ periods, categoryIds, totalPlanned, currencySymbol, allocations }: Props) => {
    const allocationData = allocations.map(alloc => ({ categoryId: alloc.categoryId ?? 0, amount: alloc.amount }));

    return (
        <View className="gap-3">
            <Text className="text-xs uppercase text-secondary-foreground mt-2">
                <Trans>Previous Periods</Trans>
            </Text>
            {periods.map(period => (
                <BudgetHistoricalPeriodCard
                    key={period.label}
                    label={period.label}
                    startDate={period.startDate}
                    endDate={period.endDate}
                    categoryIds={categoryIds}
                    totalPlanned={totalPlanned}
                    currencySymbol={currencySymbol}
                    allocations={allocationData}
                />
            ))}
        </View>
    );
};

