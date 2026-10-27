import { useAtomValue } from '@effect/atom-react/Hooks';
import { useReducedMotion as useInitialReducedMotion } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { reducedMotionAtom } from '../constant/reduced-motion-atom.constant';

export const useReducedMotion = (): boolean => {
    const initialReducedMotion = useInitialReducedMotion();
    const reducedMotion = useAtomValue(reducedMotionAtom);

    return isDefined(reducedMotion) ? reducedMotion : initialReducedMotion;
};
