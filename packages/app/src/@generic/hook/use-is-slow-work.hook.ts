import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import { useEffect, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { appRuntime } from '../runtime/app.runtime';

const SLOW_WORK_DELAY = Duration.seconds(1);

export const useIsSlowWork = (isWorking: boolean): boolean => {
    const [hasBeenSlow, setHasBeenSlow] = useState(false);

    useEffect(() => {
        if (!isWorking) {
            return emptyFn;
        }

        const fiber = appRuntime.runFork(Effect.sleep(SLOW_WORK_DELAY).pipe(Effect.andThen(Effect.sync(() => void setHasBeenSlow(true)))));

        return () => {
            fiber.interruptUnsafe();
            setHasBeenSlow(false);
        };
    }, [isWorking]);

    return isWorking && hasBeenSlow;
};
