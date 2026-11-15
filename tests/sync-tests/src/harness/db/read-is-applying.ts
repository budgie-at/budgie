import * as Effect from 'effect/Effect';

import type { DB } from '@budgie/contracts';

export const readIsApplying = (database: DB) =>
    database.$client
        .unsafe<{ readonly isApplying: number }>('SELECT is_applying AS isApplying FROM sync_apply_state')
        .pipe(Effect.map(([row]) => row.isApplying));
