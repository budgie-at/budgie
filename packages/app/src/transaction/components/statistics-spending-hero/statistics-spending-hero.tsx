import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { shiftDateRange } from '../../../@generic/utils/date/shift-date-range.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useGetTotalIncomeAndExpensesQuery } from '../../query/use-get-total-income-and-expenses.query';
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
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const isAmountProtected = useIsAmountProtected();

    const previousRange = shiftDateRange(filters.date, -1);
    const { expense, isLoading } = useGetTotalIncomeAndExpensesQuery(filters);
    const previous = useGetTotalIncomeAndExpensesQuery({ ...filters, date: previousRange ?? filters.date });

    const hasComparison = isDefined(previousRange) && previous.expense > 0 && !isAmountProtected;

    return (
        <LoadingContent isLoading={isLoading}>
            <View className="gap-y-2xl rounded-3xl bg-grouped-surface-row p-3xl" style={continuousCorners}>
                <View className="gap-y-xs">
                    <Text className="text-sm font-medium text-secondary-foreground">
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
                </View>

                {children}
            </View>
        </LoadingContent>
    );
};
