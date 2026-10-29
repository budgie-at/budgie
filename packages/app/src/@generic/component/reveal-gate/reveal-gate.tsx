import { useLayoutEffect, useRef, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { RevealGateContext } from '../../context/reveal-gate.context';

import type { ReactNode } from 'react';

interface Props {
    readonly isLoading: boolean;
    readonly children: ReactNode;
}

const REVEAL_TIMING = { duration: 150 };
const REVEAL_TIMEOUT_MS = 600;

export const RevealGate = ({ isLoading, children }: Props) => {
    const opacity = useSharedValue(0);
    const pendingReadsRef = useRef(0);
    const isRevealedRef = useRef(false);
    const isMountedRef = useRef(false);
    const [settledReads, setSettledReads] = useState(0);

    const track = () => {
        pendingReadsRef.current += 1;

        return () => {
            pendingReadsRef.current -= 1;
            setSettledReads(count => count + 1);
        };
    };

    useLayoutEffect(() => {
        if (!isRevealedRef.current && !isLoading && pendingReadsRef.current === 0) {
            isRevealedRef.current = true;
            opacity.set(isMountedRef.current ? withTiming(1, REVEAL_TIMING) : 1);
        }

        if (!isMountedRef.current) {
            isMountedRef.current = true;

            if (!isRevealedRef.current) {
                opacity.set(withDelay(REVEAL_TIMEOUT_MS, withTiming(1, REVEAL_TIMING)));
            }
        }
    }, [isLoading, settledReads, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <RevealGateContext value={track}>
            <Animated.View className="flex-1" style={animatedStyle}>
                {children}
            </Animated.View>
        </RevealGateContext>
    );
};
