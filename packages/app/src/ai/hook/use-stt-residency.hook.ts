import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { useCallback, useEffect, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { sttSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { AiModelResidencyService } from '../service/ai-model-residency.service';

import type { DbError as ContractsDbError } from '@budgie/contracts';

interface UseSttResidencyReturn {
    readonly acquireSttResidency: () => Promise<boolean>;
    readonly releaseSttResidency: () => void;
}

export const useSttResidency = (): UseSttResidencyReturn => {
    const isAiEnabled = useSetting('isAiEnabled');
    const isAiVoiceInputEnabled = useSetting('isAiVoiceInputEnabled');
    const acquireFiberRef = useRef<Fiber.Fiber<boolean, ContractsDbError> | null>(null);

    const acquireSttResidency = useCallback((): Promise<boolean> => {
        if (!isAiEnabled || !isAiVoiceInputEnabled) {
            return Promise.resolve(false);
        }

        const acquireFiber =
            acquireFiberRef.current ??
            appRuntime.runFork(
                Effect.flatMap(AiModelResidencyService, aiModelResidencyService => aiModelResidencyService.acquire(AiSubsystemNameEnum.STT))
            );
        acquireFiberRef.current = acquireFiber;

        return appRuntime.runPromise(
            Fiber.join(acquireFiber).pipe(Effect.map(() => appAtomRegistry.get(sttSnapshotAtom).status === AiSubsystemStatusEnum.READY))
        );
    }, [isAiEnabled, isAiVoiceInputEnabled]);

    const releaseSttResidency = useCallback((): void => {
        if (isDefined(acquireFiberRef.current)) {
            acquireFiberRef.current = null;
            appRuntime.runFork(
                Effect.flatMap(AiModelResidencyService, aiModelResidencyService =>
                    aiModelResidencyService.releaseNow(AiSubsystemNameEnum.STT)
                )
            );
        }
    }, []);

    useEffect(() => {
        if (isAiEnabled && isAiVoiceInputEnabled) {
            void acquireSttResidency();
        } else {
            releaseSttResidency();
        }

        return releaseSttResidency;
    }, [acquireSttResidency, isAiEnabled, isAiVoiceInputEnabled, releaseSttResidency]);

    return { acquireSttResidency, releaseSttResidency };
};
