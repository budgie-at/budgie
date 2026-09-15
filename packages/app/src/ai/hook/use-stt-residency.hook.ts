import { useEffect, useRef } from 'react';

import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { aiModelResidencyService } from '../service/ai-model-residency.service';

interface UseSttResidencyReturn {
    readonly acquireSttResidency: () => Promise<boolean>;
    readonly releaseSttResidency: () => void;
}

export const useSttResidency = (): UseSttResidencyReturn => {
    const hasLeaseRef = useRef(false);
    const pendingAcquireRef = useRef<Promise<boolean>>(Promise.resolve(false));

    const acquireSttResidency = async (): Promise<boolean> => {
        if (!hasLeaseRef.current) {
            hasLeaseRef.current = true;
            pendingAcquireRef.current = aiModelResidencyService.acquire(AiSubsystemNameEnum.STT).catch(() => false);
        }

        return pendingAcquireRef.current;
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
