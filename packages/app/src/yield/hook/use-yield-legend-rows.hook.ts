import { YieldGroupEnum } from '@budgie/market';
import { use } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { YIELD_STACK_GROUPS } from '../constant/yield-stack-groups.constant';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldSelectionContext } from '../context/yield-selection.context';
import { roundYieldParts } from '../utils/round-yield-parts.util';
import { selectYieldScrubbedBuckets } from '../utils/select-yield-scrubbed-buckets.util';

import { useYieldRoundParts } from './use-yield-round-parts.hook';
import { useYieldSummary } from './use-yield-summary.hook';

const PERCENT = 100;

const rankOf = (group: YieldGroupEnum): number => YIELD_STACK_GROUPS.findIndex(stacked => stacked === group);

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
        .map(({ group }, index) => ({ group, total: roundedTotals.at(index) ?? 0 }))
        .sort((left, right) => rankOf(left.group) - rankOf(right.group));
    const rowsTotal = rows.reduce((sum, row) => sum + row.total, 0);
    const shares = isPositiveNumber(rowsTotal)
        ? roundYieldParts(
              rows.map(row => (row.total / rowsTotal) * PERCENT),
              PERCENT,
              0
          )
        : [];

    return rows.map((row, index) => ({
        ...row,
        share: rows.length > 1 ? (shares.at(index) ?? 0) / PERCENT : null
    }));
};
