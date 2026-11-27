import { useAtomSet } from '@effect/atom-react/Hooks';
import { router } from 'expo-router';
import { use } from 'react';

import { yieldRangeAtom } from '../constant/yield-range-atom.constant';
import { YieldSelectionContext } from '../context/yield-selection.context';

import type { YieldRangeEnum } from '@budgie/market';

export const useYieldRangeChange = () => {
    const setRange = useAtomSet(yieldRangeAtom);
    const { cancelScrub } = use(YieldSelectionContext);

    return (range: YieldRangeEnum) => {
        cancelScrub();
        setRange(range);
        router.setParams({ range, focus: '' });
    };
};
