import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { aiCoordinatorService } from './ai-coordinator.service';
import { aiEmbeddingStatusService } from './ai-embedding-status.service';
import { aiSystemStatusService } from './ai-system-status.service';
import { aiTranslationStatusService } from './ai-translation-status.service';
import { aiUmbrellaStatusService } from './ai-umbrella-status.service';
import { embeddingDrainerService } from './embedding-drainer.service';
import { translationDrainerService } from './translation-drainer.service';

class AiStorageReplacementService {
    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async pauseLongLivedRuntime(): Promise<void> {
        await Promise.all([translationDrainerService.pause(), embeddingDrainerService.pause()]);
        aiEmbeddingStatusService.stop();
        aiTranslationStatusService.stop();
        aiUmbrellaStatusService.stop();
        aiSystemStatusService.stop();
        aiCoordinatorService.stop();
    }
}

export const aiStorageReplacementService = new AiStorageReplacementService();
