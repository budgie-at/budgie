'use client';

import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { useEffect, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { getWaitlistCount } from '../action/waitlist.action';

export const useWaitlistCount = (isEnabled: boolean) => {
    const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

    useEffect(() => {
        const fiber = Effect.runFork(
            isEnabled
                ? Effect.tryPromise({ try: async () => await getWaitlistCount(), catch: emptyFn }).pipe(
                      Effect.tap(count => Effect.sync(() => void setWaitlistCount(count))),
                      Effect.ignore
                  )
                : Effect.void
        );

        return () => void Effect.runFork(Fiber.interrupt(fiber));
    }, [isEnabled]);

    return waitlistCount;
};
