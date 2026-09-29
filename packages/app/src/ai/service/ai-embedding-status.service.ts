import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';
import * as Equal from 'effect/Equal';
import * as Atom from 'effect/reactivity/Atom';

import { commentEmbeddingRepository, merchantEmbeddingRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { EMPTY_SUBSYSTEM_SNAPSHOT } from '../constant/empty-subsystem-snapshot.constant';
import { AiSystemUmbrellaStateEnum } from '../enum/ai-system-umbrella-state.enum';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { buildSubsystemSnapshot } from '../utils/build-subsystem-snapshot.util';

import { aiUmbrellaStatusService } from './ai-umbrella-status.service';
import { embeddingDrainerService } from './embedding-drainer.service';

class AiEmbeddingStatusService {
    readonly snapshot = Atom.make(get =>
        get(aiUmbrellaStatusService.snapshot).state === AiSystemUmbrellaStateEnum.HEALTHY
            ? buildSubsystemSnapshot(get(embeddingDrainerService.snapshot), get(embeddingProgressStore.snapshot), {
                  boosting: t`Rebuilding learning`,
                  working: t`Learning transactions`,
                  ready: t`Learning up to date`
              })
            : EMPTY_SUBSYSTEM_SNAPSHOT
    ).pipe(Atom.withEquality(Equal.equals));

    readonly rebuild = Effect.fn('AiEmbeddingStatusService.rebuild')(
        function* () {
            yield* embeddingDrainerService.pause();
            yield* Effect.ensuring(
                Effect.all([
                    merchantEmbeddingRepository.truncate(),
                    commentEmbeddingRepository.truncate(),
                    transactionRepository.markAllForEmbedding(),
                    transactionRepository.clearNonIndexableFlags()
                ]),
                embeddingDrainerService.resume()
            );
            yield* embeddingProgressStore.refresh();
            yield* embeddingDrainerService.boost();
        },
        effect => Effect.onError(effect, () => embeddingDrainerService.resume())
    );
}

export const aiEmbeddingStatusService = new AiEmbeddingStatusService();
