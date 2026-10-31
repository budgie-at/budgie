import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { shiftDateRange } from '../../../@generic/utils/date/shift-date-range.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useGetTotalIncomeAndExpensesQuery } from '../../query/use-get-total-income-and-expenses.query';
import { checkIfFiltersSelected } from '../../utils/check-if-filters-selected.util';
import { StatisticsCashFlowRow } from '../statistics-cash-flow-row/statistics-cash-flow-row';
import { StatisticsChangeLabel } from '../statistics-change-label/statistics-change-label';

import { StatisticsSpendingHeroSelector } from './statistics-spending-hero.selector';

import type { TransactionFilterInterface } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly children?: ReactNode;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const StatisticsSpendingHero = ({ filters, children }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const isAmountProtected = useIsAmountProtected();

    const previousRange = shiftDateRange(filters.date, -1);
    const { expense, income, isLoading } = useGetTotalIncomeAndExpensesQuery(filters);
    const previous = useGetTotalIncomeAndExpensesQuery({ ...filters, date: previousRange ?? filters.date });

    const hasComparison = isDefined(previousRange) && isPositiveNumber(previous.expense) && isPositiveNumber(expense) && !isAmountProtected;
    const isIncomeOnly = !isPositiveNumber(expense) && isPositiveNumber(income);
    const noSpendingLabel = checkIfFiltersSelected(null, { ...filters, date: null })
        ? t`No spending matches these filters`
        : t`No spending in this period`;

    return (
        <LoadingContent isLoading={isLoading}>
            <View className="gap-y-xl overflow-hidden rounded-3xl bg-grouped-surface-row p-3xl" style={continuousCorners}>
                <View className="gap-y-xs">
                    <Text
                        maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                        className="text-sm font-medium text-secondary-foreground"
                    >
                        <Trans>Spent</Trans>
                    </Text>

                    <HeroFigure
                        amount={expense}
                        currencySymbol={defaultInstrument.symbol}
                        variant="primary"
                        testID={StatisticsSpendingHeroSelector.Spent(expense)}
                    />

                    {hasComparison ? (
                        <StatisticsChangeLabel current={expense} previous={previous.expense} previousRange={previousRange} />
                    ) : null}

                    {isIncomeOnly ? (
                        <Text maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER} className="text-sm text-secondary-foreground">
                            {noSpendingLabel}
                        </Text>
                    ) : null}
                </View>

                {children}

                <StatisticsCashFlowRow income={income} expense={expense} />
            </View>
        </LoadingContent>
    );
};
