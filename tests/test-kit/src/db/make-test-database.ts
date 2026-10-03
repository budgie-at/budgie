import { makeEffectSqliteClientDatabase } from '@budgie/contracts';
import { withReplicas } from 'drizzle-orm/sqlite-core/effect';
import * as Effect from 'effect/Effect';
import { identity } from 'effect/Function';

import type { DB } from '@budgie/contracts';

type Client = DB['$client'];

export const makeTestDatabase = Effect.fnUntraced(function* (
    client: Client,
    onStatement?: (queryText: string, params?: ReadonlyArray<unknown>) => void
) {
    const observed =
        onStatement === undefined
            ? client
            : new Proxy(client, {
                  get: (target, property, receiver) =>
                      property === 'unsafe'
                          ? (queryText: string, params?: ReadonlyArray<unknown>) => {
                                onStatement(queryText, params);

                                return target.unsafe(queryText, params);
                            }
                          : Reflect.get(target, property, receiver)
              });
    const primary = yield* makeEffectSqliteClientDatabase(observed, { onMutate: () => Effect.void, runQuery: identity });

    return withReplicas(primary, [primary]);
});
