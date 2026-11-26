import { Storage } from '@op-engineering/op-sqlite';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

export const makeLazyStorage = (name: string) =>
    Effect.gen(function* () {
        let storage: Storage | null = null;

        yield* Effect.addFinalizer(() =>
            Effect.sync(() => {
                storage?.closeSync();
                storage = null;
            })
        );

        return (): Storage => {
            if (!isDefined(storage)) {
                storage = new Storage({ name });
            }

            return storage;
        };
    });
