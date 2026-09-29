import * as Effect from 'effect/Effect';

import { aiCoordinatorService } from './ai-coordinator.service';
import { embeddingDrainerService } from './embedding-drainer.service';
import { translationDrainerService } from './translation-drainer.service';

class AiStorageReplacementService {
    readonly pauseLongLivedRuntime = Effect.fn('AiStorageReplacementService.pauseLongLivedRuntime')(function* () {
        yield* Effect.all([translationDrainerService.pause(), embeddingDrainerService.pause()], { concurrency: 'unbounded' });
        yield* aiCoordinatorService.stop();
    });
}

export const aiStorageReplacementService = new AiStorageReplacementService();
