import { useSyncExternalStore } from 'react';

import { AiSubsystemStatusSnapshotInterface } from '../interface/ai-subsystem-status-snapshot.interface';
import { aiTranslationStatusService } from '../service/ai-translation-status.service';

export const useAiTranslationStatus = (): AiSubsystemStatusSnapshotInterface =>
    useSyncExternalStore(aiTranslationStatusService.subscribe, aiTranslationStatusService.getSnapshot);
