import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLocalSearchParams } from 'expo-router';

import { defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { yieldRangeAtom } from '../constant/yield-range-atom.constant';
import { toYieldKey } from '../utils/to-yield-key.util';

import type { YieldScreenKeyInterface } from '../interface/yield-screen-key.interface';
import type { YieldScreenParamsInterface } from '../interface/yield-screen-params.interface';

export const useYieldScreenParams = (): YieldScreenKeyInterface => {
    const params = useLocalSearchParams<YieldScreenParamsInterface>();
    const sessionRange = useAtomValue(yieldRangeAtom);
    const baseInstrumentId = useAtomValue(defaultInstrumentIdAtom);

    return toYieldKey(params, sessionRange, baseInstrumentId);
};
