import { SyncDeferredError, SyncProviderEnum, SyncRequestSigner, SyncUnauthorizedError } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

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
                    .pipe(Effect.mapError(() => SyncDeferredError.make({ provider, message: 'secure-storage-unavailable' })));
                if (!isDefined(pem)) {
                    return yield* SyncUnauthorizedError.make({ provider, message: 'signing-key-missing' });
                }

                return yield* Effect.try({
                    try: () => signRs256(pem, signingInput),
                    catch: () => SyncUnauthorizedError.make({ provider, message: 'signing-key-unusable' })
                });
            }),
            deleteKey: Effect.fn('SyncRequestSigner.deleteKey')(function* (keyId: string) {
                yield* secureStore
                    .removeKey(keyId)
                    .pipe(Effect.mapError(() => SyncDeferredError.make({ provider, message: 'secure-storage-unavailable' })));
            })
        });
    })
).pipe(Layer.provide(EnableBankingSecureStore.layer));
