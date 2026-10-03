import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { vi } from 'vitest';

import type { DB } from '@budgie/contracts';

export class FakeDatabaseConnectionService extends Context.Service<
    FakeDatabaseConnectionService,
    {
        readonly db: DB;
        readonly close: Effect.Effect<void>;
    }
>()('@budgie/app/DatabaseConnectionService') {
    static readonly closeMock = vi.fn((): Effect.Effect<void> => Effect.void);

    static readonly layer = Layer.effect(
        FakeDatabaseConnectionService,
        Effect.map(Db, db => ({ db, close: Effect.suspend(() => FakeDatabaseConnectionService.closeMock()) }))
    );
}
