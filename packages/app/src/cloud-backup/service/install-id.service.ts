import { generateSyncId } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as SecureStore from 'expo-secure-store';

import { isNotEmptyString } from '@rnw-community/shared';

import { PIN_SECURE_STORE_OPTIONS } from '../../auth/constant/pin-secure-store-options.constant';

export class InstallIdService extends Context.Service<InstallIdService>()('@budgie/app/InstallIdService', {
    make: Effect.gen(function* () {
        const installIdKey = 'budgie.installId';

        const resolveInstallId = Effect.promise(() => SecureStore.getItemAsync(installIdKey, PIN_SECURE_STORE_OPTIONS)).pipe(
            Effect.flatMap(storedInstallId =>
                isNotEmptyString(storedInstallId)
                    ? Effect.succeed(storedInstallId)
                    : Effect.sync(generateSyncId).pipe(
                          Effect.tap(installId =>
                              Effect.promise(() => SecureStore.setItemAsync(installIdKey, installId, PIN_SECURE_STORE_OPTIONS))
                          )
                      )
            )
        );

        return { get: yield* Effect.cached(resolveInstallId) };
    })
}) {
    static readonly layer = Layer.effect(InstallIdService, InstallIdService.make);
}
