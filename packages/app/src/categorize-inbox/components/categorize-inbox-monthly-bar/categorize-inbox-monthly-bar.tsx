import Animated, { FadeIn, Keyframe } from 'react-native-reanimated';

import { ENTRANCE_REDUCED_DURATION } from '../../../@generic/constant/entrance-motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import {
    CATEGORIZE_INBOX_BAR_DURATION,
    CATEGORIZE_INBOX_BAR_EASING,
    CATEGORIZE_INBOX_BAR_MIN_HEIGHT,
    CATEGORIZE_INBOX_BAR_STAGGER,
    CATEGORIZE_INBOX_BAR_START_SCALE,
    CATEGORIZE_INBOX_BAR_STRIP_HEIGHT
} from '../../constant/categorize-inbox-bar-motion.constant';

interface Props {
    readonly count: number;
    readonly maxCount: number;
    readonly index: number;
}

export const CategorizeInboxMonthlyBar = ({ count, maxCount, index }: Props) => {
    const reducedMotion = useReducedMotion();

    const height = Math.max(CATEGORIZE_INBOX_BAR_MIN_HEIGHT, (count / maxCount) * CATEGORIZE_INBOX_BAR_STRIP_HEIGHT);
    const style = { height, transformOrigin: 'bottom' } as const;
    const growEntering = new Keyframe({
        from: { opacity: 0, transform: [{ scaleY: CATEGORIZE_INBOX_BAR_START_SCALE }] },
        to: { opacity: 1, transform: [{ scaleY: 1 }], easing: CATEGORIZE_INBOX_BAR_EASING }
    })
        .duration(CATEGORIZE_INBOX_BAR_DURATION)
        .delay(index * CATEGORIZE_INBOX_BAR_STAGGER);
    const entering = reducedMotion ? FadeIn.duration(ENTRANCE_REDUCED_DURATION) : growEntering;

    return <Animated.View entering={entering} className="bg-positive-fill flex-1 rounded-t-[2px]" style={style} />;
};
