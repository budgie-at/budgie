import { useLingui } from '@lingui/react/macro';
import { differenceInDays } from 'date-fns/differenceInDays';
import { parseISO } from 'date-fns/parseISO';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { YIELD_RANGE_NAME } from '../../constant/yield-range-name.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { YieldBreakdownCryptoToday } from '../yield-breakdown-crypto-today/yield-breakdown-crypto-today';
import { YieldBreakdownEarned } from '../yield-breakdown-earned/yield-breakdown-earned';
import { YieldBreakdownMonthlyAverage } from '../yield-breakdown-monthly-average/yield-breakdown-monthly-average';
import { YieldBreakdownNet } from '../yield-breakdown-net/yield-breakdown-net';
import { YieldBreakdownRunRate } from '../yield-breakdown-run-rate/yield-breakdown-run-rate';
import { YieldBreakdownSkeleton } from '../yield-breakdown-skeleton/yield-breakdown-skeleton';
import { YieldBreakdownTax } from '../yield-breakdown-tax/yield-breakdown-tax';
import { YieldBreakdownVsRate } from '../yield-breakdown-vs-rate/yield-breakdown-vs-rate';
import { YieldBreakdownYieldRate } from '../yield-breakdown-yield-rate/yield-breakdown-yield-rate';
import { YieldOpenPositionRow } from '../yield-open-position-row/yield-open-position-row';

const DAYS_PER_MONTH = 30.4375;
const MIN_AVERAGE_MONTHS = 2;
const CARD_BORDER_CLASSNAME = 'rounded-3xl dark:border-hairline dark:border-surface-separator';

export const YieldBreakdown = () => {
    const { t } = useLingui();
    const summary = useYieldSummary();
    const { screenKey } = use(YieldScreenContext);

    if (!isDefined(summary)) {
        return <YieldBreakdownSkeleton />;
    }

    const rangeName = t(YIELD_RANGE_NAME[screenKey.key.range]);
    const { runRate, cryptoRewardsToday, vsRate, annualYield } = summary;
    const hasOpenRow = isDefined(screenKey.scopeId) && screenKey.from !== screenKey.scopeId;
    const monthCount = Math.round(differenceInDays(parseISO(summary.today), parseISO(summary.windowStart)) / DAYS_PER_MONTH);
    const monthlyAverage = summary.earned.value / monthCount;
    const hasTotalsRows = summary.hasYield && summary.payoutCount !== 1;
    const hasOutlookRow = isDefined(runRate);

    if (!hasOpenRow && !hasTotalsRows && !hasOutlookRow) {
        return null;
    }

    return (
        <View className="gap-y-[24px]">
            {hasOpenRow ? (
                <View className={CARD_BORDER_CLASSNAME}>
                    <GroupedListSection>
                        <YieldOpenPositionRow />
                    </GroupedListSection>
                </View>
            ) : null}
            {hasTotalsRows ? (
                <View className="gap-y-[8px]">
                    <Text accessibilityRole="header" className="px-3xl text-[17px] font-semibold text-primary" maxFontSizeMultiplier={1.6}>
                        {t`Totals · ${rangeName}`}
                    </Text>
                    <View className={CARD_BORDER_CLASSNAME}>
                        <GroupedListSection>
                            <YieldBreakdownEarned earned={summary.earned.value} isEstimated={summary.earned.isEstimated} />
                            {isPositiveNumber(summary.tax) ? <YieldBreakdownTax tax={summary.tax} /> : null}
                            {isPositiveNumber(summary.tax) ? <YieldBreakdownNet net={summary.net} /> : null}
                            {monthCount >= MIN_AVERAGE_MONTHS ? <YieldBreakdownMonthlyAverage average={monthlyAverage} /> : null}
                            {isDefined(annualYield.rate) ? (
                                <YieldBreakdownYieldRate rate={annualYield.rate} isEstimated={annualYield.isEstimated} />
                            ) : null}
                            {isDefined(cryptoRewardsToday) ? <YieldBreakdownCryptoToday rewards={cryptoRewardsToday} /> : null}
                            {isDefined(vsRate) ? <YieldBreakdownVsRate vsRate={vsRate} /> : null}
                        </GroupedListSection>
                    </View>
                </View>
            ) : null}
            {isDefined(runRate) ? (
                <View className="gap-y-[8px]">
                    <Text accessibilityRole="header" className="px-3xl text-[17px] font-semibold text-primary" maxFontSizeMultiplier={1.6}>
                        {t`Outlook`}
                    </Text>
                    <View className={CARD_BORDER_CLASSNAME}>
                        <GroupedListSection>
                            <YieldBreakdownRunRate runRate={runRate} />
                        </GroupedListSection>
                    </View>
                </View>
            ) : null}
        </View>
    );
};
