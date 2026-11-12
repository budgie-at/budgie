import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';

import { isDefined } from '@rnw-community/shared';

import { DatabaseSwapService } from '../../src/@generic/drizzle/service/database-swap.service';
import { AiEmbeddingStatusService } from '../../src/ai/service/ai-embedding-status.service';
import { AiStorageReplacementService } from '../../src/ai/service/ai-storage-replacement.service';
import { AuthService } from '../../src/auth/service/auth.service';
import { cloudSyncStateStoreLayer } from '../../src/cloud-sync/layer/cloud-sync-state-store.layer';

import { secrets } from './expo-secure-store-fake';

export const importDependenciesLayer = Layer.mergeAll(
    Layer.mock(AiStorageReplacementService)({ pauseLongLivedRuntime: () => Effect.void }),
    Layer.mock(AiEmbeddingStatusService)({ forgetModel: Effect.void }),
    Layer.mock(AuthService)({
        getPin: () => Effect.sync(() => secrets.get('user_pin') ?? null),
        persistPin: pin => Effect.sync(() => void (isDefined(pin) ? secrets.set('user_pin', pin) : secrets.delete('user_pin')))
    }),
    DatabaseSwapService.layer,
    cloudSyncStateStoreLayer,
    Reactivity.layer
);
