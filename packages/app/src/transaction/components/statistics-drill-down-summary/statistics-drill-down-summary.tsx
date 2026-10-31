import { TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { CategorizeInboxKindEnum } from '../../../categorize-inbox/enum/categorize-inbox-kind.enum';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useGetStatisticsDrillDownQuery } from '../../query/use-get-statistics-drill-down.query';
import { StatisticsDrillDownCaption } from '../statistics-drill-down-caption/statistics-drill-down-caption';
import { StatisticsTrendBars } from '../statistics-trend-bars/statistics-trend-bars';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly kind: CategorizeInboxKindEnum;
    readonly entityId: number;
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
    readonly filters: TransactionFilterInterface;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const StatisticsDrillDownSummary = ({ kind, entityId, type, filters }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const { summary, referenceMonth, isLoading } = useGetStatisticsDrillDownQuery(kind, entityId, type, filters);

    const isIncome = type === TransactionTypeEnum.INCOME;
    const totalLabel = isIncome ? t`Received` : t`Spent`;
    const figureVariant = isIncome ? 'positive' : 'primary';
    const hasTrend = summary.trend.some(point => isPositiveNumber(point.amount));

    return (
        <LoadingContent isLoading={isLoading}>
            <View className="gap-y-2xl rounded-3xl bg-grouped-surface-row p-3xl" style={continuousCorners}>
                <View className="gap-y-xs">
                    <Text
                        maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                        className="text-sm font-medium text-secondary-foreground"
                    >
                        {totalLabel}
                    </Text>

                    <HeroFigure
                        amount={convertFromMicroUnits(summary.amount)}
                        currencySymbol={defaultInstrument.symbol}
                        variant={figureVariant}
                    />

                    <StatisticsDrillDownCaption summary={summary} type={type} currencySymbol={defaultInstrument.symbol} />
                </View>

                {hasTrend ? (
                    <StatisticsTrendBars
                        key={referenceMonth.getTime()}
                        points={summary.trend}
                        currentMonth={referenceMonth}
                        currencySymbol={defaultInstrument.symbol}
                    />
                ) : null}
            </View>
        </LoadingContent>
    );
};
