import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useIsLargeText } from '../../../@generic/hook/use-is-large-text.hook';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldBreakdownCryptoToday } from '../yield-breakdown-crypto-today/yield-breakdown-crypto-today';
import { YieldBreakdownNet } from '../yield-breakdown-net/yield-breakdown-net';
import { YieldBreakdownRunRate } from '../yield-breakdown-run-rate/yield-breakdown-run-rate';
import { YieldBreakdownVsRate } from '../yield-breakdown-vs-rate/yield-breakdown-vs-rate';

export const YieldBreakdown = () => {
    const isLargeText = useIsLargeText();
    const { screenKey } = use(YieldScreenContext);
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);

    if (!isDefined(summary)) {
        return null;
    }

    const { runRate, cryptoRewardsToday, vsRate } = summary;
    const cellClassName = cn('pb-md', isLargeText ? 'w-full' : 'w-1/2');

    return (
        <View className="flex-row flex-wrap">
            {isPositiveNumber(summary.tax) ? (
                <View className={cellClassName}>
                    <YieldBreakdownNet net={summary.net} />
                </View>
            ) : null}
            {isDefined(runRate) ? (
                <View className={cellClassName}>
                    <YieldBreakdownRunRate runRate={runRate} />
                </View>
            ) : null}
            {isDefined(cryptoRewardsToday) ? (
                <View className={cellClassName}>
                    <YieldBreakdownCryptoToday rewards={cryptoRewardsToday} />
                </View>
            ) : null}
            {isDefined(vsRate) ? (
                <View className={cellClassName}>
                    <YieldBreakdownVsRate vsRate={vsRate} />
                </View>
            ) : null}
        </View>
    );
};
