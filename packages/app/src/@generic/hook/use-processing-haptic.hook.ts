import * as Effect from 'effect/Effect';
import * as Schedule from 'effect/Schedule';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useEffect, useRef } from 'react';

import { appRuntime } from '../runtime/app.runtime';

import { useVibration } from './use-vibration.hook';

const HEARTBEAT_START_DELAY_MS = 600;
const HEARTBEAT_INTERVAL_MS = 1100;
const HEARTBEAT_BEAT_GAP_MS = 140;
const HEARTBEAT_MAX_MS = 12000;

export const useProcessingHaptic = (isProcessing: boolean): void => {
    const [, hapticImpact] = useVibration();
    const hapticImpactRef = useRef(hapticImpact);

    useEffect(() => {
        hapticImpactRef.current = hapticImpact;
    });

    useEffect(() => {
        if (!isProcessing) {
            return;
        }

        const pulse = Effect.sync(() => void hapticImpactRef.current(ImpactFeedbackStyle.Soft));
        const heartbeat = pulse.pipe(Effect.andThen(Effect.sleep(HEARTBEAT_BEAT_GAP_MS)), Effect.andThen(pulse));
        const fiber = appRuntime.runFork(
            Effect.repeat(heartbeat, Schedule.spaced(HEARTBEAT_INTERVAL_MS)).pipe(
                Effect.delay(HEARTBEAT_START_DELAY_MS),
                Effect.timeoutOption(HEARTBEAT_MAX_MS)
            )
        );

        return () => void fiber.interruptUnsafe();
    }, [isProcessing]);
};
