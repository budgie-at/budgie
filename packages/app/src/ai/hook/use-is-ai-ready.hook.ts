import { useSyncExternalStore } from 'react';

import { AiSystemUmbrellaStateEnum } from '../enum/ai-system-umbrella-state.enum';
import { aiUmbrellaStatusService } from '../service/ai-umbrella-status.service';

import { useAiAvailable } from './use-ai-available.hook';

export const useIsAiReady = (): boolean => {
    const isAiAvailable = useAiAvailable();
    const umbrella = useSyncExternalStore(aiUmbrellaStatusService.subscribe, aiUmbrellaStatusService.getSnapshot);

    return isAiAvailable && umbrella.state === AiSystemUmbrellaStateEnum.Healthy;
};
