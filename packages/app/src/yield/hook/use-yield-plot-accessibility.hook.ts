import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { YIELD_GROUP_LABEL } from '../constant/yield-group-label.constant';

import { useYieldDateLabels } from './use-yield-date-labels.hook';

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
    const formatAmount = useProtectedAmountLabel();
    const isAmountProtected = useIsAmountProtected();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const buckets = summary?.buckets ?? [];
    const currentIndex = Math.min(selectedIndex ?? buckets.length - 1, buckets.length - 1);
    const bucket = buckets.at(currentIndex);
    const hidden = t`hidden amount`;
    const amountOf = (value: number) => (isAmountProtected ? hidden : formatAmount(value, symbol));
    const parts = (summary?.groups ?? [])
        .map(({ group }) => {
            const label = t(YIELD_GROUP_LABEL[group]).toLowerCase();
            const amount = amountOf(bucket?.amounts[group] ?? 0);

            return [label, amount].join(' ');
        })
        .join(', ');
    const period = isDefined(bucket) && isDefined(summary) ? formatPeriod(bucket, summary.bucketUnit) : '';
    const total = amountOf(bucket?.total ?? 0);

    const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
        const { actionName } = event.nativeEvent;

        if (actionName.startsWith(PAYOUTS_ACTION_PREFIX)) {
            router.setParams({ group: actionName.slice(PAYOUTS_ACTION_PREFIX.length) });

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
