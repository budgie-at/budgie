import { YieldGroupEnum } from '@budgie/market';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldSelectionContext } from '../context/yield-selection.context';
import { selectYieldScrubbedBuckets } from '../utils/select-yield-scrubbed-buckets.util';

import { useYieldRoundParts } from './use-yield-round-parts.hook';
import { useYieldSummary } from './use-yield-summary.hook';

export const useYieldLegendRows = () => {
    const { mode } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);
    const summary = useYieldSummary();
    const roundParts = useYieldRoundParts();

    const scrubbedBuckets = selectYieldScrubbedBuckets(summary?.buckets ?? [], selectedIndex, mode);
    const groups = summary?.groups ?? [];
    const rawTotals = groups.map(({ group, total }) =>
        isDefined(selectedIndex) ? scrubbedBuckets.reduce((sum, item) => sum + item.amounts[group], 0) : total
    );
    const displayedTotal = isDefined(selectedIndex)
        ? scrubbedBuckets.reduce((sum, item) => sum + item.total, 0)
        : (summary?.earned.value ?? 0);
    const roundedTotals = roundParts(rawTotals, displayedTotal);
    const rows = groups
        .map(({ group, total }, index) => ({ group, total: roundedTotals.at(index) ?? 0, order: total }))
        .sort((left, right) => right.order - left.order)
        .map(({ group, total }) => ({ group, total }));
    const taxTotal = isDefined(selectedIndex)
        ? scrubbedBuckets.reduce((sum, item) => sum + item.amounts[YieldGroupEnum.TAX], 0)
        : (summary?.tax ?? 0);

    return { rows, taxTotal };
};
