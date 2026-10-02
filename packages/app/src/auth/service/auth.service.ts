/* oxlint-disable lingui/no-unlocalized-strings */
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { isNotEmptyString } from '@rnw-community/shared';

import { DatabaseLifecycleOperationEnum } from '../../@generic/drizzle/enum/database-lifecycle-operation.enum';
import { DatabaseLifecycleService } from '../../@generic/drizzle/service/database-lifecycle.service';
import { DatabaseRekeyService } from '../../@generic/drizzle/service/database-rekey.service';
import { RekeyParamsInterface } from '../../@generic/drizzle/service/interface/rekey-params.interface';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { WidgetSnapshotService } from '../../widget/service/widget-snapshot.service';
import { PIN_KEY } from '../constant/pin-key.constant';
import { PIN_SECURE_STORE_OPTIONS } from '../constant/pin-secure-store-options.constant';
import { BiometricTypesInterface } from '../interface/biometric-types.interface';

export class AuthService extends Context.Service<AuthService>()('@budgie/app/AuthService', {
    make: Effect.gen(function* () {
        const databaseLifecycleService = yield* DatabaseLifecycleService;
        const databaseRekeyService = yield* DatabaseRekeyService;
        const widgetSnapshotService = yield* WidgetSnapshotService;

        const unavailableBiometricTypes: BiometricTypesInterface = {
            isTouchIdAvailable: false,
            isFaceIdAvailable: false,
            isSomeAvailable: false,
            isLoading: false
        };

        const getPin = Effect.fn('AuthService.getPin')(function* () {
            return yield* Effect.promise(() => SecureStore.getItemAsync(PIN_KEY, PIN_SECURE_STORE_OPTIONS));
        });

        const persistPin = Effect.fn('AuthService.persistPin')(function* (pin: string | null) {
            if (isNotEmptyString(pin)) {
                yield* Effect.promise(() => SecureStore.setItemAsync(PIN_KEY, pin, PIN_SECURE_STORE_OPTIONS));
            } else {
                yield* Effect.promise(() => SecureStore.deleteItemAsync(PIN_KEY, PIN_SECURE_STORE_OPTIONS));
            }
        });

        const runRekey = Effect.fn('AuthService.runRekey')(function* (params: RekeyParamsInterface) {
            const previousPin = yield* getPin();

            yield* databaseRekeyService.rekey(params, persistPin(params.nextKey).pipe(Effect.orDie)).pipe(
                Effect.andThen(Effect.promise(() => reloadApp())),
                Effect.onError(() => persistPin(previousPin).pipe(Effect.orDie))
            );
        });

        const rekeyDatabase = Effect.fn('AuthService.rekeyDatabase')(function* (params: RekeyParamsInterface) {
            yield* databaseLifecycleService.run(DatabaseLifecycleOperationEnum.REKEY, runRekey(params));
        });

        return {
            ensurePinBackgroundAccessibility: Effect.fn('AuthService.ensurePinBackgroundAccessibility')(function* () {
                const pin = yield* getPin();

                if (isNotEmptyString(pin)) {
                    yield* persistPin(pin);
                }
            }),
            getBiometricTypes: Effect.fn('AuthService.getBiometricTypes')(
                function* () {
                    const hasHardware = yield* Effect.promise(() => LocalAuthentication.hasHardwareAsync());

                    if (!hasHardware) {
                        return unavailableBiometricTypes;
                    }

                    const isEnrolled = yield* Effect.promise(() => LocalAuthentication.isEnrolledAsync());

                    if (!isEnrolled) {
                        return unavailableBiometricTypes;
                    }

                    const types = yield* Effect.promise(() => LocalAuthentication.supportedAuthenticationTypesAsync());
                    const isFaceIdAvailable = types.some(type => type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
                    const isTouchIdAvailable = types.some(type => type === LocalAuthentication.AuthenticationType.FINGERPRINT);

                    return {
                        isSomeAvailable: isFaceIdAvailable || isTouchIdAvailable,
                        isTouchIdAvailable,
                        isFaceIdAvailable,
                        isLoading: false
                    };
                },
                Effect.catchDefect(() => Effect.succeed(unavailableBiometricTypes))
            ),
            authenticateWithBiometrics: Effect.fn('AuthService.authenticateWithBiometrics')(
                function* () {
                    const result = yield* Effect.promise(() =>
                        LocalAuthentication.authenticateAsync({
                            promptMessage: 'Authenticate to access the app',
                            cancelLabel: 'Use PIN',
                            disableDeviceFallback: true
                        })
                    );

                    return result.success;
                },
                Effect.catchDefect(() => Effect.succeed(false))
            ),
            createPin: Effect.fn('AuthService.createPin')(function* (pin: string, isBiometricEnabled: boolean) {
                yield* widgetSnapshotService.mask().pipe(Effect.ignoreCause({ log: 'Error' }));
                yield* rekeyDatabase({
                    nextKey: pin,
                    nextSettings: {
                        isBiometricEnabled,
                        isPinEnabled: true
                    }
                }).pipe(
                    Effect.onError(() =>
                        Effect.sync(() => {
                            widgetSnapshotService.unlock();
                        })
                    )
                );
            }),
            changePin: Effect.fn('AuthService.changePin')(function* (pin: string) {
                yield* rekeyDatabase({ nextKey: pin });
            }),
            verifyPin: Effect.fn('AuthService.verifyPin')(function* (pin: string) {
                const savedPin = yield* getPin();

                return savedPin === pin;
            }),
            deletePin: Effect.fn('AuthService.deletePin')(function* () {
                yield* rekeyDatabase({
                    nextKey: null,
                    nextSettings: {
                        isBiometricEnabled: false,
                        isPinEnabled: false
                    }
                });
            }),
            getPin,
            persistPin
        };
    })
}) {
    static readonly layer = Layer.effect(AuthService, AuthService.make).pipe(
        Layer.provide([DatabaseLifecycleService.layer, DatabaseRekeyService.layer, WidgetSnapshotService.layer])
    );
}
