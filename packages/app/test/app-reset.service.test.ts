import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';
import { vi } from 'vitest';

import { DatabaseLifecycleService } from '../src/@generic/drizzle/service/database-lifecycle.service';
import { AppResetService } from '../src/@generic/service/app-reset.service';
import { AiModelResidencyService } from '../src/ai/service/ai-model-residency.service';
import { AiStorageReplacementService } from '../src/ai/service/ai-storage-replacement.service';
import { AuthService } from '../src/auth/service/auth.service';
import { SiriCatalogService } from '../src/siri/service/siri-catalog.service';
import { PatternCacheService } from '../src/transaction/service/pattern-cache/pattern-cache.service';

import { resetStorage, storage } from './fixture/expo-file-system-fake';
import { inertDbLayer } from './fixture/inert-db-layer';

vi.mock('../src/@generic/drizzle/service/database-lifecycle.service', async () => {
    const Context = await import('effect/Context');

    return { DatabaseLifecycleService: Context.Service<object>('test/ResetLifecycle') };
});
vi.mock('../src/ai/service/ai-storage-replacement.service', async () => {
    const Context = await import('effect/Context');

    return { AiStorageReplacementService: Context.Service<object>('test/ResetStorage') };
});
vi.mock('../src/ai/service/ai-model-residency.service', async () => {
    const Context = await import('effect/Context');

    return { AiModelResidencyService: Context.Service<object>('test/ResetResidency') };
});
vi.mock('../src/auth/service/auth.service', async () => {
    const Context = await import('effect/Context');

    return { AuthService: Context.Service<object>('test/ResetAuth') };
});
vi.mock('../src/transaction/service/pattern-cache/pattern-cache.service', async () => {
    const Context = await import('effect/Context');

    return { PatternCacheService: Context.Service<object>('test/ResetPatternCache') };
});
vi.mock('../src/siri/service/siri-catalog.service', async () => {
    const Context = await import('effect/Context');

    return { SiriCatalogService: Context.Service<object>('test/ResetSiri') };
});
vi.mock('../src/@generic/utils/reload-app.util', () => import('./fixture/reload-app-fake'));
vi.mock('expo-file-system', () => import('./fixture/expo-file-system-fake'));

const resetLayer = Layer.effect(AppResetService, AppResetService.make).pipe(
    Layer.provide([
        Layer.mock(DatabaseLifecycleService)({ run: (_operation, effect) => effect, close: () => Effect.void }),
        Layer.mock(AiStorageReplacementService)({ pauseLongLivedRuntime: () => Effect.void }),
        Layer.mock(AiModelResidencyService)({ drainLock: Semaphore.makeUnsafe(1), suspend: () => Effect.void }),
        Layer.mock(AuthService)({ persistPin: () => Effect.void }),
        Layer.mock(PatternCacheService)({ invalidate: () => undefined }),
        Layer.mock(SiriCatalogService)({ clear: () => Effect.void })
    ])
);

describe('app reset', () => {
    it.effect('erases the live database and every moved-aside database', () =>
        Effect.gen(function* () {
            resetStorage();
            storage.files.set('documents/SQLite/budgie.db', 'live');
            storage.files.set('documents/SQLite/budgie.db-wal', 'live-wal');
            storage.files.set('documents/SQLite/budgie.db.replaced-123', 'original');
            storage.files.set('documents/SQLite/budgie.db.replaced-123-wal', 'original-wal');

            yield* Effect.flatMap(AppResetService, service => service.clearAllDataAndRestart()).pipe(
                Effect.provide([resetLayer, inertDbLayer])
            );

            expect([...storage.files.keys()].filter(path => path.startsWith('documents/SQLite/budgie.db'))).toEqual([]);
        })
    );
});
