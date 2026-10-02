import { getTableName } from 'drizzle-orm';

import { appAtomRuntime } from '../runtime/app.runtime';

import type { AppServices } from '../runtime/app.runtime';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import type * as Effect from 'effect/Effect';

export const databaseQueryAtom = <A, E>(tables: readonly SQLiteTable[], effect: Effect.Effect<A, E, AppServices>) =>
    appAtomRuntime.factory.withReactivity(tables.map(table => getTableName(table)))(appAtomRuntime.atom(effect));
