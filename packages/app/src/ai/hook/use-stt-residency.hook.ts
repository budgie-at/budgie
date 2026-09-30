import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { useEffect, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { aiModelResidencyService } from '../service/ai-model-residency.service';
import { sttService } from '../service/stt.service';

interface UseSttResidencyReturn {
    readonly acquireSttResidency: () => Promise<boolean>;
    readonly releaseSttResidency: () => void;
}

export const useSttResidency = (): UseSttResidencyReturn => {
    const acquireFiberRef = useRef<Fiber.Fiber<boolean> | null>(null);

    const acquireSttResidency = (): Promise<boolean> => {
        acquireFiberRef.current ??= appRuntime.runFork(aiModelResidencyService.acquire(AiSubsystemNameEnum.STT));

        return appRuntime.runPromise(Fiber.join(acquireFiberRef.current).pipe(Effect.map(() => sttService.isReady)));
    };

    const releaseSttResidency = (): void => {
        if (isDefined(acquireFiberRef.current)) {
            acquireFiberRef.current = null;
            appRuntime.runFork(aiModelResidencyService.releaseNow(AiSubsystemNameEnum.STT));
        }
    };

    // oxlint-disable-next-line react/exhaustive-deps -- Mount-scoped lease; both callbacks only read the stable acquireFiberRef
    useEffect(() => {
        void acquireSttResidency();

        return releaseSttResidency;
    }, []);

    return { acquireSttResidency, releaseSttResidency };
};
