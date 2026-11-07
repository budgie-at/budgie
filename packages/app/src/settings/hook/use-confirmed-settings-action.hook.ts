import * as Effect from 'effect/Effect';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useState } from 'react';

import { useProcessingHaptic } from '../../@generic/hook/use-processing-haptic.hook';
import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';

import type { AppServices } from '../../@generic/runtime/app.runtime';
import type * as Cause from 'effect/Cause';

export const useConfirmedSettingsAction = (confirmOptions: Parameters<typeof confirmAlert>[0], errorTitle: string) => {
    const [, hapticImpact] = useVibration();
    const { isLoading, run: runSingleFlight } = useSingleFlight();
    const [isProcessing, setIsProcessing] = useState(false);

    useProcessingHaptic(isProcessing);

    const run = (action: Effect.Effect<unknown, Cause.YieldableError, AppServices>) =>
        runSingleFlight(
            Effect.gen(function* () {
                if (!(yield* confirmAlert(confirmOptions))) {
                    return;
                }

                if (confirmOptions.isDestructive) {
                    hapticImpact(ImpactFeedbackStyle.Heavy);
                }

                setIsProcessing(true);

                yield* action.pipe(Effect.ensuring(Effect.sync(() => void setIsProcessing(false))));
            }).pipe(toastOnFailure(errorTitle))
        );

    return { isLoading, run };
};
