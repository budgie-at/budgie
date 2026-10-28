import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { useEffect, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { sttSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiModelResidencyService } from '../service/ai-model-residency.service';

import type { AppServices } from '../../@generic/runtime/app.runtime';

interface UseSttResidencyReturn {
    readonly acquireSttResidency: () => Effect.Effect<boolean, unknown, AppServices>;
    readonly releaseSttResidency: () => void;
}

export const useSttResidency = (): UseSttResidencyReturn => {
    const acquireFiberRef = useRef<Fiber.Fiber<boolean> | null>(null);

    const acquireSttResidency = () =>
        Effect.suspend(() => {
            acquireFiberRef.current ??= appRuntime.runFork(
                Effect.flatMap(AiModelResidencyService, aiModelResidencyService => aiModelResidencyService.acquire(AiSubsystemNameEnum.STT))
            );

            return Fiber.join(acquireFiberRef.current).pipe(
                Effect.map(() => appAtomRegistry.get(sttSnapshotAtom).status === AiSubsystemStatusEnum.READY)
            );
        });

    const releaseSttResidency = (): void => {
        if (isDefined(acquireFiberRef.current)) {
            acquireFiberRef.current = null;
            appRuntime.runFork(
                Effect.flatMap(AiModelResidencyService, aiModelResidencyService =>
                    aiModelResidencyService.releaseNow(AiSubsystemNameEnum.STT)
                )
            );
        }
    };

    useEffect(() => {
        appRuntime.runFork(logAndContinue(acquireSttResidency()));

        return releaseSttResidency;
    }, []);

    return { acquireSttResidency, releaseSttResidency };
};
