import * as Effect from 'effect/Effect';
import { useRef, useState } from 'react';

import { appRuntime } from '../runtime/app.runtime';
import { logAndContinue } from '../utils/log-and-continue.util';

import type { AppServices } from '../runtime/app.runtime';

export const useSingleFlight = () => {
    const isInFlightRef = useRef(false);
    const [isLoading, setIsLoading] = useState(false);

    const run = <A, E>(action: Effect.Effect<A, E, AppServices>): Promise<void> => {
        if (isInFlightRef.current) {
            return Promise.resolve();
        }

        isInFlightRef.current = true;
        setIsLoading(true);

        return appRuntime.runPromise(
            logAndContinue(action).pipe(
                Effect.asVoid,
                Effect.ensuring(
                    Effect.sync(() => {
                        isInFlightRef.current = false;
                        setIsLoading(false);
                    })
                )
            )
        );
    };

    return { isLoading, run };
};
