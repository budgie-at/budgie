import { useWindowDimensions } from 'react-native';

import { useReducedMotion } from '../../@generic/hook/use-reduced-motion.hook';

const ACCESSIBILITY_FONT_SCALE = 1.35;

export const useIsStaticAccountDetailsHeader = (): boolean => {
    const { fontScale } = useWindowDimensions();
    const reducedMotion = useReducedMotion();

    return reducedMotion || fontScale > ACCESSIBILITY_FONT_SCALE;
};
