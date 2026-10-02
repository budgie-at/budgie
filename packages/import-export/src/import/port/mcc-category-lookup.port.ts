import * as Context from 'effect/Context';

import type { Db, DbError, MccCategoryLookupInterface } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export class MccCategoryLookup extends Context.Service<
    MccCategoryLookup,
    {
        readonly load: Effect.Effect<Map<string, MccCategoryLookupInterface>, DbError, Db>;
    }
>()('@budgie/import-export/MccCategoryLookup') {}
