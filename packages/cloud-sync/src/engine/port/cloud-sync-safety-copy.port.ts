import * as Context from 'effect/Context';

import type { Db } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';
import type { SqlError } from 'effect/sql/SqlError';

export class CloudSyncSafetyCopy extends Context.Service<
    CloudSyncSafetyCopy,
    {
        readonly create: Effect.Effect<void, SqlError, Db>;
    }
>()('@budgie/cloud-sync/CloudSyncSafetyCopy') {}
