import { useSyncExternalStore } from 'react';

import { AiTranslationStatusSnapshotInterface } from '../interface/ai-translation-status-snapshot.interface';
import { aiTranslationStatusService } from '../service/ai-translation-status.service';

export const useAiTranslationStatus = (): AiTranslationStatusSnapshotInterface =>
    useSyncExternalStore(aiTranslationStatusService.subscribe, aiTranslationStatusService.getSnapshot);
