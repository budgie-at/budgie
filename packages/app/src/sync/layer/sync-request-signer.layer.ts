import { Db } from '@budgie/contracts';
import { SyncDeferredError, SyncProviderEnum, SyncRequestSigner, SyncUnauthorizedError } from '@budgie/sync';
import { sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { EnableBankingSecureStore } from '../service/enable-banking-secure-store.service';
import { signRs256 } from '../utils/sign-rs256.util';

const provider = SyncProviderEnum.ENABLE_BANKING;

export const syncRequestSignerLayer = Layer.effect(
    SyncRequestSigner,
    Effect.gen(function* () {
        const secureStore = yield* EnableBankingSecureStore;

        return SyncRequestSigner.of({
            sign: Effect.fn('SyncRequestSigner.sign')(function* (keyId: string, signingInput: string) {
                const pem = yield* secureStore
                    .readKey(keyId)
                    .pipe(Effect.mapError(() => new SyncDeferredError({ provider, message: 'secure-storage-unavailable' })));
                if (!isDefined(pem)) {
                    return yield* new SyncUnauthorizedError({ provider, message: 'signing-key-missing' });
                }

                return yield* Effect.try({
                    try: () => signRs256(pem, signingInput),
                    catch: () => new SyncUnauthorizedError({ provider, message: 'signing-key-unusable' })
                });
            }),
            deleteKey: Effect.fn('SyncRequestSigner.deleteKey')(function* (keyId: string) {
                yield* secureStore
                    .removeKey(keyId)
                    .pipe(Effect.mapError(() => new SyncDeferredError({ provider, message: 'secure-storage-unavailable' })));
            }),
            generateState: Db.query(db => db.all<{ readonly state: string }>(sql`SELECT lower(hex(randomblob(32))) AS state`)).pipe(
                Effect.orDie,
                Effect.flatMap(([row]) =>
                    isDefined(row) && isNotEmptyString(row.state) ? Effect.succeed(row.state) : Effect.die(new Error('No random state'))
                )
            )
        });
    })
).pipe(Layer.provide(EnableBankingSecureStore.layer));
