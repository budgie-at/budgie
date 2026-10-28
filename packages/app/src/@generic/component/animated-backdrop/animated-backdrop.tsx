import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const FADE_IN_DURATION = 200;
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
            className="absolute inset-0 bg-black/85"
            entering={FadeIn.duration(FADE_IN_DURATION)}
            exiting={FadeOut.duration(FADE_OUT_DURATION)}
            onTouchEnd={onClose}
        />
    );
};
