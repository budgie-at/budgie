import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { shiftDateRange } from '../../../@generic/utils/date/shift-date-range.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDateRange } from '../../../i18n/hook/use-format-date-range.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useGetTotalIncomeAndExpensesQuery } from '../../query/use-get-total-income-and-expenses.query';
import { StatisticsChangeLabel } from '../statistics-change-label/statistics-change-label';
import { StatisticsHeroFigureRow } from '../statistics-hero-figure-row/statistics-hero-figure-row';

import { StatisticsSpendingHeroSelector } from './statistics-spending-hero.selector';

import type { TransactionFilterInterface } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly children?: ReactNode;
}

const AMOUNT_STYLE = { fontVariant: ['tabular-nums' as const] };
const continuousCorners = { borderCurve: 'continuous' as const };

export const StatisticsSpendingHero = ({ filters, children }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();
    const formatDateRange = useFormatDateRange();

    const previousRange = shiftDateRange(filters.date, -1);
    const { expense, income, isLoading } = useGetTotalIncomeAndExpensesQuery(filters);
    const previous = useGetTotalIncomeAndExpensesQuery({ ...filters, date: previousRange ?? filters.date });

    const net = income - expense;
    const netSign = net > 0 ? '+' : '';
    const incomeSign = income > 0 ? '+' : '';
    const hasComparison = isDefined(previousRange) && previous.expense > 0;

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
                        <StatisticsChangeLabel
                            current={expense}
                            previous={previous.expense}
                            previousLabel={formatDateRange(previousRange)}
                        />
                    ) : null}
                </View>

                {children}

                <View className="gap-y-sm border-t-hairline border-surface-separator pt-xl">
                    <StatisticsHeroFigureRow label={t`Income`}>
                        <ProtectedText style={AMOUNT_STYLE} className="text-[15px] font-medium text-positive-foreground">
                            {`${incomeSign}${formatDigits(income, defaultInstrument.symbol)}`}
                        </ProtectedText>
                    </StatisticsHeroFigureRow>

                    <StatisticsHeroFigureRow label={t`Net`}>
                        <ProtectedText style={AMOUNT_STYLE} className="text-[15px] font-medium text-primary">
                            {`${netSign}${formatDigits(net, defaultInstrument.symbol)}`}
                        </ProtectedText>
                    </StatisticsHeroFigureRow>
                </View>
            </View>
        </LoadingContent>
    );
};
