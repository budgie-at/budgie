import { YieldGroupEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { use } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { decimalPlacesAtom } from '../../settings/constants/settings-atoms.constant';
import { YIELD_STACK_GROUPS } from '../constant/yield-stack-groups.constant';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldSelectionContext } from '../context/yield-selection.context';
import { roundYieldParts } from '../utils/round-yield-parts.util';
import { sumYieldScrubbedBuckets } from '../utils/sum-yield-scrubbed-buckets.util';

import { useYieldSummary } from './use-yield-summary.hook';

const PERCENT = 100;

const rankOf = (group: YieldGroupEnum): number => YIELD_STACK_GROUPS.findIndex(stacked => stacked === group);

export const useYieldLegendRows = () => {
    const { mode } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);
    const summary = useYieldSummary();
    const decimalPlaces = useAtomValue(decimalPlacesAtom);

    const scrubbed = sumYieldScrubbedBuckets(summary?.buckets ?? [], selectedIndex, mode);
    const groups = summary?.groups ?? [];
    const rawTotals = groups.map(({ group, total }) => (isDefined(selectedIndex) ? scrubbed.amountOf(group) : total));
    const displayedTotal = isDefined(selectedIndex) ? scrubbed.total : (summary?.earned.value ?? 0);
    const rawSum = rawTotals.reduce((accumulated, part) => accumulated + part, 0);
    const roundedTotals = roundYieldParts(rawTotals, Math.abs(rawSum - displayedTotal) <= 1 ? displayedTotal : rawSum, decimalPlaces);
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
