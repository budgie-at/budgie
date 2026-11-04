import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import * as SecureStore from 'expo-secure-store';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { PIN_SECURE_STORE_OPTIONS } from '../../auth/constant/pin-secure-store-options.constant';
import { EnableBankingSetupErrorReasonEnum } from '../enum/enable-banking-setup-error-reason.enum';
import { EnableBankingSetupError } from '../error/enable-banking-setup.error';

import type { EnableBankingPendingAuthorizationInterface } from '@budgie/sync';

const PendingAuthorizationSchema = Schema.fromJsonString(
    Schema.Struct({
        state: Schema.String,
        applicationId: Schema.String,
        aspspName: Schema.String,
        aspspCountry: Schema.String,
        integrationId: Schema.NullOr(Schema.Number),
        callbackUrl: Schema.String,
        expiresAtMs: Schema.Number
    })
);

export class EnableBankingSecureStore extends Context.Service<EnableBankingSecureStore>()('@budgie/app/EnableBankingSecureStore', {
    make: Effect.sync(() => {
        const chunkLength = 1800;
        const pendingName = 'enable-banking.pending';
        const keyName = (applicationId: string) => `enable-banking.key.${applicationId}`;
        const chunkName = (applicationId: string, index: number) => `${keyName(applicationId)}.${index}`;

        const storageError = () => new EnableBankingSetupError({ reason: EnableBankingSetupErrorReasonEnum.STORAGE_FAILED });
        const read = (name: string) =>
            Effect.tryPromise({ try: () => SecureStore.getItemAsync(name, PIN_SECURE_STORE_OPTIONS), catch: storageError });
        const write = (name: string, value: string) =>
            Effect.tryPromise({ try: () => SecureStore.setItemAsync(name, value, PIN_SECURE_STORE_OPTIONS), catch: storageError });
        const remove = (name: string) =>
            Effect.tryPromise({ try: () => SecureStore.deleteItemAsync(name, PIN_SECURE_STORE_OPTIONS), catch: storageError });

        const readKey = Effect.fn('EnableBankingSecureStore.readKey')(function* (applicationId: string) {
            const count = Number(yield* read(keyName(applicationId)));
            if (!Number.isInteger(count) || count < 1) {
                return null;
            }

            const chunks: string[] = [];
            for (let index = 0; index < count; index += 1) {
                const chunk = yield* read(chunkName(applicationId, index));
                if (!isNotEmptyString(chunk)) {
                    return null;
                }
                chunks.push(chunk);
            }

            return chunks.join('');
        });

        const removeKey = Effect.fn('EnableBankingSecureStore.removeKey')(function* (applicationId: string) {
            const count = Number(yield* read(keyName(applicationId)));
            for (let index = 0; index < (Number.isInteger(count) ? count : 0); index += 1) {
                yield* remove(chunkName(applicationId, index));
            }
            yield* remove(keyName(applicationId));
        });

        return {
            readKey,
            removeKey,
            saveKey: Effect.fn('EnableBankingSecureStore.saveKey')(function* (applicationId: string, pem: string) {
                const chunks = pem.match(new RegExp(`[^]{1,${chunkLength}}`, 'gu')) ?? [];
                const store = Effect.gen(function* () {
                    for (const [index, chunk] of chunks.entries()) {
                        yield* write(chunkName(applicationId, index), chunk);
                    }
                    yield* write(keyName(applicationId), String(chunks.length));
                    if ((yield* readKey(applicationId)) !== pem) {
                        return yield* storageError();
                    }
                });

                yield* store.pipe(Effect.tapError(() => Effect.ignore(removeKey(applicationId))));
            }),
            savePending: (pending: EnableBankingPendingAuthorizationInterface) => write(pendingName, JSON.stringify(pending)),
            takePending: Effect.fn('EnableBankingSecureStore.takePending')(function* () {
                const stored = yield* read(pendingName);
                if (!isDefined(stored)) {
                    return null;
                }
                yield* remove(pendingName);

                return yield* Schema.decodeUnknownEffect(PendingAuthorizationSchema)(stored).pipe(Effect.orElseSucceed(() => null));
            })
        };
    })
}) {
    static readonly layer = Layer.effect(EnableBankingSecureStore, EnableBankingSecureStore.make);
}
