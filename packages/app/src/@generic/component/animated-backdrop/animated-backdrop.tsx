import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { EASE_OUT, MOTION_BASE_DURATION } from '../../constant/motion.constant';

const FADE_IN_DURATION = MOTION_BASE_DURATION;
const FADE_OUT_DURATION = 100;

interface Props {
    readonly isVisible: boolean;
    readonly onClose?: () => void;
}

export const AnimatedBackdrop = ({ isVisible, onClose }: Props) => {
    if (!isVisible) {
        return null;
    }

    return (
        <Animated.View
            className="absolute inset-0 bg-black/80 dark:bg-black/85"
            entering={FadeIn.duration(FADE_IN_DURATION).easing(EASE_OUT)}
            exiting={FadeOut.duration(FADE_OUT_DURATION).easing(EASE_OUT)}
            onTouchEnd={onClose}
        />
    );
};
