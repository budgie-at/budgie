import { logAndContinue } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { useEffect, useEffectEvent, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { sttSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiModelResidencyService } from '../service/ai-model-residency.service';

import type { AppServices } from '../../@generic/runtime/app.runtime';
import type * as Cause from 'effect/Cause';

interface UseSttResidencyReturn {
    readonly acquireSttResidency: () => Effect.Effect<boolean, Cause.YieldableError, AppServices>;
    readonly releaseSttResidency: () => void;
}

export const useSttResidency = (): UseSttResidencyReturn => {
    const acquireFiberRef = useRef<Fiber.Fiber<void> | null>(null);

    const acquireSttResidency = () =>
        Effect.suspend(() => {
            acquireFiberRef.current ??= appRuntime.runFork(
                logAndContinue(
                    Effect.flatMap(AiModelResidencyService, aiModelResidencyService =>
                        aiModelResidencyService.acquire(AiSubsystemNameEnum.STT)
                    ).pipe(Effect.asVoid)
                )
            );

            return Fiber.join(acquireFiberRef.current).pipe(
                Effect.map(() => appAtomRegistry.get(sttSnapshotAtom).status === AiSubsystemStatusEnum.READY)
            );
        });

    const releaseSttResidency = (): void => {
        if (isDefined(acquireFiberRef.current)) {
            const acquireFiber = acquireFiberRef.current;
            acquireFiberRef.current = null;
            acquireFiber.interruptUnsafe();
            appRuntime.runFork(
                logAndContinue(
                    Effect.flatMap(AiModelResidencyService, aiModelResidencyService =>
                        aiModelResidencyService.releaseNow(AiSubsystemNameEnum.STT)
                    )
                )
            );
        }
    };

    const handleAcquire = useEffectEvent(() => acquireSttResidency());
    const handleRelease = useEffectEvent(() => {
        releaseSttResidency();
    });

    useEffect(() => {
        const fiber = appRuntime.runFork(logAndContinue(handleAcquire()));

        return () => {
            fiber.interruptUnsafe();
            handleRelease();
        };
    }, []);

    return { acquireSttResidency, releaseSttResidency };
};
