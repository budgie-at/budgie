import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';

import { databaseQueryAtom } from './database-query-atom.util';

import type { AppServices } from '../runtime/app.runtime';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import type * as Context from 'effect/Context';

export const databaseQueryFamily = <Key, Identifier extends AppServices, Shape, A, E>(
    tables: readonly SQLiteTable[],
    service: Context.Key<Identifier, Shape>,
    query: (service: Shape, key: Key) => Effect.Effect<A, E, AppServices>
) =>
    Atom.family((key: Key) =>
        databaseQueryAtom(
            tables,
            Effect.flatMap(service, resolvedService => query(resolvedService, key))
        )
    );
