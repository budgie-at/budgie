import { useEffect, useRef } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { aiModelResidencyService } from '../service/ai-model-residency.service';
import { sttService } from '../service/stt.service';

interface UseSttResidencyReturn {
    readonly acquireSttResidency: () => Promise<boolean>;
    readonly releaseSttResidency: () => void;
}

export const useSttResidency = (): UseSttResidencyReturn => {
    const hasLeaseRef = useRef(false);
    const pendingAcquireRef = useRef<Promise<unknown>>(Promise.resolve());

    const acquireSttResidency = async (): Promise<boolean> => {
        if (!hasLeaseRef.current) {
            hasLeaseRef.current = true;
            pendingAcquireRef.current = aiModelResidencyService.acquire(AiSubsystemNameEnum.STT).catch(emptyFn);
        }

        await pendingAcquireRef.current;

        return sttService.isReady;
    };

    const releaseSttResidency = (): void => {
        if (hasLeaseRef.current) {
            hasLeaseRef.current = false;
            aiModelResidencyService.releaseNow(AiSubsystemNameEnum.STT);
        }
    };

    // oxlint-disable-next-line react/exhaustive-deps -- Mount-scoped lease; both callbacks only read the stable hasLeaseRef
    useEffect(() => {
        void acquireSttResidency();

        return releaseSttResidency;
    }, []);

    return { acquireSttResidency, releaseSttResidency };
};
