/* oxlint-disable lingui/no-unlocalized-strings */
import * as Effect from 'effect/Effect';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { isNotEmptyString } from '@rnw-community/shared';

import { DatabaseLifecycleOperationEnum } from '../../@generic/drizzle/enum/database-lifecycle-operation.enum';
import { databaseLifecycleService } from '../../@generic/drizzle/service/database-lifecycle.service';
import { databaseRekeyService } from '../../@generic/drizzle/service/database-rekey.service';
import { RekeyParamsInterface } from '../../@generic/drizzle/service/interface/rekey-params.interface';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { widgetSnapshotService } from '../../widget/service/widget-snapshot.service';
import { PIN_KEY } from '../constant/pin-key.constant';
import { PIN_SECURE_STORE_OPTIONS } from '../constant/pin-secure-store-options.constant';
import { BiometricTypesInterface } from '../interface/biometric-types.interface';

class AuthService {
    private static readonly UNAVAILABLE_BIOMETRIC_TYPES: BiometricTypesInterface = {
        isTouchIdAvailable: false,
        isFaceIdAvailable: false,
        isSomeAvailable: false,
        isLoading: false
    };

    readonly ensurePinBackgroundAccessibility = Effect.fn('AuthService.ensurePinBackgroundAccessibility')(function* (this: AuthService) {
        const pin = yield* this.getPin();

        if (isNotEmptyString(pin)) {
            yield* this.persistPin(pin);
        }
    });

    readonly getBiometricTypes = Effect.fn('AuthService.getBiometricTypes')(
        function* (this: AuthService) {
            const hasHardware = yield* Effect.promise(() => LocalAuthentication.hasHardwareAsync());

            if (!hasHardware) {
                return AuthService.UNAVAILABLE_BIOMETRIC_TYPES;
            }

            const isEnrolled = yield* Effect.promise(() => LocalAuthentication.isEnrolledAsync());

            if (!isEnrolled) {
                return AuthService.UNAVAILABLE_BIOMETRIC_TYPES;
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
        Effect.catchDefect(() => Effect.succeed(AuthService.UNAVAILABLE_BIOMETRIC_TYPES))
    );

    readonly authenticateWithBiometrics = Effect.fn('AuthService.authenticateWithBiometrics')(
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
    );

    readonly createPin = Effect.fn('AuthService.createPin')(function* (this: AuthService, pin: string, isBiometricEnabled: boolean) {
        yield* widgetSnapshotService.mask().pipe(Effect.ignoreCause({ log: 'Error' }));
        yield* this.rekeyDatabase({
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
    });

    readonly changePin = Effect.fn('AuthService.changePin')(function* (this: AuthService, pin: string) {
        yield* this.rekeyDatabase({ nextKey: pin });
    });

    readonly verifyPin = Effect.fn('AuthService.verifyPin')(function* (this: AuthService, pin: string) {
        const savedPin = yield* this.getPin();

        return savedPin === pin;
    });

    readonly deletePin = Effect.fn('AuthService.deletePin')(function* (this: AuthService) {
        yield* this.rekeyDatabase({
            nextKey: null,
            nextSettings: {
                isBiometricEnabled: false,
                isPinEnabled: false
            }
        });
    });

    readonly getPin = Effect.fn('AuthService.getPin')(function* () {
        return yield* Effect.tryPromise(() => SecureStore.getItemAsync(PIN_KEY, PIN_SECURE_STORE_OPTIONS));
    });

    readonly persistPin = Effect.fn('AuthService.persistPin')(function* (pin: string | null) {
        if (isNotEmptyString(pin)) {
            yield* Effect.tryPromise(() => SecureStore.setItemAsync(PIN_KEY, pin, PIN_SECURE_STORE_OPTIONS));
        } else {
            yield* Effect.tryPromise(() => SecureStore.deleteItemAsync(PIN_KEY, PIN_SECURE_STORE_OPTIONS));
        }
    });

    private readonly rekeyDatabase = Effect.fn('AuthService.rekeyDatabase')(function* (this: AuthService, params: RekeyParamsInterface) {
        yield* databaseLifecycleService.run(DatabaseLifecycleOperationEnum.REKEY, this.runRekey(params));
    });

    private readonly runRekey = Effect.fn('AuthService.runRekey')(function* (this: AuthService, params: RekeyParamsInterface) {
        const previousPin = yield* this.getPin();

        yield* databaseRekeyService.rekey(params, this.persistPin(params.nextKey).pipe(Effect.orDie)).pipe(
            Effect.andThen(Effect.promise(() => reloadApp())),
            Effect.onError(() => this.persistPin(previousPin).pipe(Effect.orDie))
        );
    });
}

export const authService = new AuthService();
