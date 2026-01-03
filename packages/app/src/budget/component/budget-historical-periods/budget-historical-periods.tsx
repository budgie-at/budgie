import { BudgetAllocationEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BudgetHistoricalPeriodCard } from '../budget-historical-period-card/budget-historical-period-card';

interface HistoricalPeriod {
    readonly label: string;
    readonly startDate: Date;
    readonly endDate: Date;
}

interface Props {
    readonly totalPlanned: number;
    readonly categoryIds: number[];
    readonly currencySymbol: string;
    readonly periods: HistoricalPeriod[];
    readonly allocations: BudgetAllocationEntityInterface[];
}

export const BudgetHistoricalPeriods = ({ periods, categoryIds, totalPlanned, currencySymbol, allocations }: Props) => {
    const allocationData = allocations
        .filter((alloc): alloc is BudgetAllocationEntityInterface & { categoryId: number } => isDefined(alloc.categoryId))
        .map(alloc => ({ categoryId: alloc.categoryId, amount: alloc.amount }));

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
