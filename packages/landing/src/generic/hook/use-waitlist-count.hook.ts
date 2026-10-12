'use client';

import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { useEffect, useState } from 'react';

import { getWaitlistCount } from '../action/waitlist.action';

export const useWaitlistCount = (isEnabled: boolean) => {
    const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

    useEffect(() => {
        const fiber = Effect.runFork(
            isEnabled
                ? Effect.tryPromise(async () => await getWaitlistCount()).pipe(
                      Effect.tap(count => Effect.sync(() => void setWaitlistCount(count))),
                      Effect.ignore
                  )
                : Effect.void
        );

        return () => void Effect.runFork(Fiber.interrupt(fiber));
    }, [isEnabled]);

    return waitlistCount;
};
