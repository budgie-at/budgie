import { ReactNode, useEffect, useRef } from 'react';
import Animated from 'react-native-reanimated';

import { useShakeAnimation } from '../../hook/use-shake-animation.hook';

interface Props {
    readonly children: ReactNode;
    readonly isEnabled: boolean;
}

export const Shake = ({ children, isEnabled }: Props) => {
    const { shake, animatedStyle } = useShakeAnimation();
    const prevTriggerRef = useRef<boolean>(null);

    useEffect(() => {
        if (isEnabled && isEnabled !== prevTriggerRef.current) {
            prevTriggerRef.current = isEnabled;
            shake();
        } else if (!isEnabled) {
            prevTriggerRef.current = null;
        }
    }, [isEnabled, shake]);

    return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};
