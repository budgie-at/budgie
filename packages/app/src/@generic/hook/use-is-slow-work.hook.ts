import { useAtomValue } from '@effect/atom-react/Hooks';

import { delayedFlagAtom } from '../constant/delayed-flag-atom.constant';

const SLOW_WORK_DELAY_MS = 1_000;

export const useIsSlowWork = (isWorking: boolean): boolean => useAtomValue(delayedFlagAtom([isWorking, SLOW_WORK_DELAY_MS]));
