import { YIELD_STACK_GROUPS } from '../constant/yield-stack-groups.constant';

import type { YieldGroupEnum, YieldGroupTotalInterface } from '@budgie/market';

export const buildYieldStackOrder = (groups: readonly YieldGroupTotalInterface[]): readonly YieldGroupEnum[] => {
    const ranked = [...groups]
        .sort((left, right) => right.total - left.total)
        .map(({ group }) => group)
        .filter(group => YIELD_STACK_GROUPS.some(stacked => stacked === group));

    return [...ranked, ...YIELD_STACK_GROUPS.filter(group => !ranked.includes(group))];
};
