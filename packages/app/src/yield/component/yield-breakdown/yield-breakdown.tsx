import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { YIELD_RANGE_NAME } from '../../constant/yield-range-name.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { YieldBreakdownCryptoToday } from '../yield-breakdown-crypto-today/yield-breakdown-crypto-today';
import { YieldBreakdownNet } from '../yield-breakdown-net/yield-breakdown-net';
import { YieldBreakdownRunRate } from '../yield-breakdown-run-rate/yield-breakdown-run-rate';
import { YieldBreakdownVsRate } from '../yield-breakdown-vs-rate/yield-breakdown-vs-rate';
import { YieldOpenPositionRow } from '../yield-open-position-row/yield-open-position-row';

const CARD_BORDER_CLASSNAME = 'rounded-3xl dark:border-hairline dark:border-surface-separator';

export const YieldBreakdown = () => {
    const { t } = useLingui();
    const summary = useYieldSummary();
    const { screenKey } = use(YieldScreenContext);

    if (!isDefined(summary)) {
        return null;
    }

    const rangeName = t(YIELD_RANGE_NAME[screenKey.key.range]);
    const { runRate, cryptoRewardsToday, vsRate } = summary;
    const hasOpenRow = isDefined(screenKey.scopeId) && screenKey.from !== screenKey.scopeId;
    const hasSummaryRows = isPositiveNumber(summary.tax) || isDefined(runRate) || isDefined(cryptoRewardsToday) || isDefined(vsRate);

    if (!hasOpenRow && !hasSummaryRows) {
        return null;
    }

    return (
        <View className="gap-y-[12px]">
            {hasOpenRow ? (
                <View className={CARD_BORDER_CLASSNAME}>
                    <GroupedListSection>
                        <YieldOpenPositionRow />
                    </GroupedListSection>
                </View>
            ) : null}
            {hasSummaryRows ? (
                <View className="gap-y-xs">
                    <Text className="px-3xl text-[13px] text-secondary-foreground" maxFontSizeMultiplier={1.6}>
                        {t`Totals · ${rangeName}`}
                    </Text>
                    <View className={CARD_BORDER_CLASSNAME}>
                        <GroupedListSection>
                            {isPositiveNumber(summary.tax) ? <YieldBreakdownNet net={summary.net} /> : null}
                            {isDefined(runRate) ? <YieldBreakdownRunRate runRate={runRate} /> : null}
                            {isDefined(cryptoRewardsToday) ? <YieldBreakdownCryptoToday rewards={cryptoRewardsToday} /> : null}
                            {isDefined(vsRate) ? <YieldBreakdownVsRate vsRate={vsRate} /> : null}
                        </GroupedListSection>
                    </View>
                </View>
            ) : null}
        </View>
    );
};
