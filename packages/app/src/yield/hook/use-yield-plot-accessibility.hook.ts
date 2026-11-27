import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YIELD_GROUP_LABEL } from '../constant/yield-group-label.constant';
import { YieldPayoutsScrollContext } from '../context/yield-payouts-scroll.context';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldSelectionContext } from '../context/yield-selection.context';
import { sumYieldScrubbedBuckets } from '../utils/sum-yield-scrubbed-buckets.util';

import { useYieldDateLabels } from './use-yield-date-labels.hook';
import { useYieldSpokenAmount } from './use-yield-spoken-amount.hook';

import type { YieldSummaryInterface } from '@budgie/market';
import type { AccessibilityActionEvent } from 'react-native';

const PAYOUTS_ACTION_PREFIX = 'payouts-';

export const useYieldPlotAccessibility = (
    summary: YieldSummaryInterface | null,
    selectedIndex: number | null,
    onSelect: (index: number) => void
) => {
    const { t } = useLingui();
    const { formatPeriod } = useYieldDateLabels();
    const amountOf = useYieldSpokenAmount();
    const requestPayoutsScroll = use(YieldPayoutsScrollContext);
    const { mode } = use(YieldScreenContext);
    const { cancelScrub } = use(YieldSelectionContext);

    const buckets = summary?.buckets ?? [];
    const currentIndex = Math.min(selectedIndex ?? buckets.length - 1, buckets.length - 1);
    const bucket = buckets.at(currentIndex);
    const scrubbed = sumYieldScrubbedBuckets(buckets, currentIndex, mode);
    const parts = (summary?.groups ?? [])
        .map(({ group }) => {
            const label = t(YIELD_GROUP_LABEL[group]);
            const amount = amountOf(scrubbed.amountOf(group));

            return t`${label}: ${amount}`;
        })
        .join(', ');
    const period = isDefined(bucket) && isDefined(summary) ? formatPeriod(bucket, summary.bucketUnit) : '';
    const total = amountOf(scrubbed.total);

    const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
        const { actionName } = event.nativeEvent;

        if (actionName.startsWith(PAYOUTS_ACTION_PREFIX)) {
            cancelScrub();
            router.setParams({ group: actionName.slice(PAYOUTS_ACTION_PREFIX.length) });
            requestPayoutsScroll();

            return;
        }

        onSelect(Math.min(Math.max(currentIndex + (actionName === 'increment' ? 1 : -1), 0), buckets.length - 1));
    };

    return {
        accessible: true,
        accessibilityRole: 'adjustable',
        accessibilityLabel: t`Passive income chart`,
        accessibilityValue: { text: t`${period}, ${total}: ${parts}` },
        accessibilityActions: [
            { name: 'increment' },
            { name: 'decrement' },
            ...(summary?.groups ?? []).map(({ group }) => {
                const label = t(YIELD_GROUP_LABEL[group]);

                return { name: `${PAYOUTS_ACTION_PREFIX}${group}`, label: t`Show payouts for ${label}` };
            })
        ],
        onAccessibilityAction: handleAccessibilityAction
    } as const;
};
