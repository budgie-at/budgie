import { EnableBankingPendingAuthorizationSchema } from '@budgie/sync';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import * as SecureStore from 'expo-secure-store';

import { isDefined } from '@rnw-community/shared';

import { PIN_SECURE_STORE_OPTIONS } from '../../auth/constant/pin-secure-store-options.constant';
import { EnableBankingSetupErrorReasonEnum } from '../enum/enable-banking-setup-error-reason.enum';
import { EnableBankingSetupError } from '../error/enable-banking-setup.error';

import type { EnableBankingPendingAuthorizationInterface } from '@budgie/sync';

export class EnableBankingSecureStore extends Context.Service<EnableBankingSecureStore>()('@budgie/app/EnableBankingSecureStore', {
    make: Effect.sync(() => {
        const pendingName = 'enable-banking.pending';
        const keyName = (applicationId: string) => `enable-banking.key.${applicationId}`;
        const decodePending = Schema.decodeUnknownEffect(Schema.fromJsonString(EnableBankingPendingAuthorizationSchema));

        const storageError = () => EnableBankingSetupError.make({ reason: EnableBankingSetupErrorReasonEnum.STORAGE_FAILED });
        const read = (name: string) =>
            Effect.tryPromise({ try: () => SecureStore.getItemAsync(name, PIN_SECURE_STORE_OPTIONS), catch: storageError });
        const write = (name: string, value: string) =>
            Effect.tryPromise({ try: () => SecureStore.setItemAsync(name, value, PIN_SECURE_STORE_OPTIONS), catch: storageError });
        const remove = (name: string) =>
            Effect.tryPromise({ try: () => SecureStore.deleteItemAsync(name, PIN_SECURE_STORE_OPTIONS), catch: storageError });

        return {
            readKey: (applicationId: string) => read(keyName(applicationId)),
            removeKey: (applicationId: string) => remove(keyName(applicationId)),
            saveKey: (applicationId: string, pem: string) => write(keyName(applicationId), pem),
            savePending: (pending: EnableBankingPendingAuthorizationInterface) => write(pendingName, JSON.stringify(pending)),
            removePending: () => remove(pendingName),
            readPending: Effect.fn('EnableBankingSecureStore.readPending')(function* () {
                const stored = yield* read(pendingName);

                return isDefined(stored) ? yield* decodePending(stored).pipe(Effect.orElseSucceed(() => null)) : null;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(EnableBankingSecureStore, EnableBankingSecureStore.make);
}
