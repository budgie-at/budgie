import { useSyncExternalStore } from 'react';

import { AiSystemSnapshotInterface } from '../interface/ai-system-snapshot.interface';
import { aiSystemStatusService } from '../service/ai-system-status.service';

export const useAiSystemStatus = (): AiSystemSnapshotInterface =>
    useSyncExternalStore(aiSystemStatusService.subscribe, aiSystemStatusService.getSnapshot);
