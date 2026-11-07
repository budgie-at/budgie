import { Trans, useLingui } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { SectionHeader } from '../../../@generic/component/section-header/section-header';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetProjectionQuery } from '../../query/use-get-budget-projection.query';
import { buildBudgetDayStripCells } from '../../utils/build-budget-day-strip-cells.util';
import { BudgetDayStripKey } from '../budget-day-strip-key/budget-day-strip-key';
import { BudgetSafeToSpendHeader } from '../budget-safe-to-spend-header/budget-safe-to-spend-header';
import { BudgetSafeToSpendSummary } from '../budget-safe-to-spend-summary/budget-safe-to-spend-summary';
import { BudgetScrollableSheet } from '../budget-scrollable-sheet/budget-scrollable-sheet';
import { BudgetSheetState } from '../budget-sheet-state/budget-sheet-state';
import { BudgetUpcomingChargeRow } from '../budget-upcoming-charge-row/budget-upcoming-charge-row';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetSafeToSpendSheet = ({ budget }: Props) => {
    const { t } = useLingui();
    const { projection, isLoading, isError } = useGetBudgetProjectionQuery(budget);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const { upcomingCharges } = projection;
    const presentDayStates = new Set(buildBudgetDayStripCells(projection, budget.period).map(cell => cell.dayState));

    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';

    const upcomingSection = isNotEmptyArray(upcomingCharges) ? (
        <View className="gap-y-lg">
            <SectionHeader label={t`Upcoming this period`} />
            {upcomingCharges.map(charge => (
                <BudgetUpcomingChargeRow
                    key={`${charge.source.kind}-${charge.source.id}-${charge.date.getTime()}`}
                    charge={charge}
                    currencySymbol={currencySymbol}
                />
            ))}
        </View>
    ) : null;

    if (isError) {
        return <BudgetSheetState title={t`Safe to spend`} isLoading={false} isError />;
    }

    return (
        <BudgetScrollableSheet testID={BudgetSelector.SafeToSpendSheet}>
            <BudgetSafeToSpendHeader budget={budget} />

            <LoadingContent
                isLoading={isLoading}
                className="gap-y-3xl"
                containerClassName="px-5xl pt-md pb-3xl"
                loadingIndicator={<ActivityIndicator size="small" className="absolute inset-x-0 top-[24px]" />}
            >
                <BudgetSafeToSpendSummary projection={projection} currencySymbol={currencySymbol} />

                {upcomingSection}

                <View className="gap-y-md">
                    <SectionHeader label={t`Reading the day strip`} />
                    <Text className="text-sm text-secondary-foreground">
                        <Trans>Each bar compares one day&apos;s spending with your daily plan.</Trans>
                    </Text>
                    <BudgetDayStripKey dayStates={presentDayStates} />
                </View>

                <Text className="text-xxs text-secondary-foreground">
                    <Trans>Recalculates every day. Spend less today and tomorrow&apos;s amount grows.</Trans>
                </Text>
            </LoadingContent>
        </BudgetScrollableSheet>
    );
};
