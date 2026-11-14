import * as Clock from 'effect/Clock';
/* oxlint-disable lingui/no-unlocalized-strings */
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { DatabaseLifecycleOperationEnum } from '../../@generic/drizzle/enum/database-lifecycle-operation.enum';
import { DatabaseLifecycleService } from '../../@generic/drizzle/service/database-lifecycle.service';
import { DatabaseRekeyService } from '../../@generic/drizzle/service/database-rekey.service';
import { RekeyParamsInterface } from '../../@generic/drizzle/service/interface/rekey-params.interface';
import { persistDatabaseKey } from '../../@generic/drizzle/utils/persist-database-key.util';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { WidgetSnapshotService } from '../../widget/service/widget-snapshot.service';
import { PIN_KEY } from '../constant/pin-key.constant';
import { PIN_SECURE_STORE_OPTIONS } from '../constant/pin-secure-store-options.constant';
import { SEAL_UNLOCK_GRANT_KEY } from '../constant/seal-unlock-grant-key.constant';
import { BiometricKindEnum } from '../enum/biometric-kind.enum';
import { BiometricTypesInterface } from '../interface/biometric-types.interface';

import { PinAttemptService } from './pin-attempt.service';

export class AuthService extends Context.Service<AuthService>()('@budgie/app/AuthService', {
    make: Effect.gen(function* () {
        const databaseLifecycleService = yield* DatabaseLifecycleService;
        const databaseRekeyService = yield* DatabaseRekeyService;
        const widgetSnapshotService = yield* WidgetSnapshotService;
        const pinAttemptService = yield* PinAttemptService;

        const unavailableBiometricTypes: BiometricTypesInterface = {
            biometricKind: null,
            isSomeAvailable: false
        };

        const getBiometricKind = (hasFace: boolean, hasFingerprint: boolean): BiometricKindEnum | null => {
            if (!hasFace && !hasFingerprint) {
                return null;
            }

            if (Platform.OS === 'ios') {
                return hasFace ? BiometricKindEnum.FACE_ID : BiometricKindEnum.TOUCH_ID;
            }

            if (hasFace && hasFingerprint) {
                return BiometricKindEnum.BIOMETRICS;
            }

            return hasFace ? BiometricKindEnum.FACE_UNLOCK : BiometricKindEnum.FINGERPRINT;
        };

        const getPin = Effect.fn('AuthService.getPin')(function* () {
            return yield* Effect.promise(() => SecureStore.getItemAsync(PIN_KEY, PIN_SECURE_STORE_OPTIONS));
        });

        const runRekey = Effect.fn('AuthService.runRekey')(function* (params: RekeyParamsInterface, afterCommit: Effect.Effect<void>) {
            const previousPin = yield* getPin();

            yield* databaseRekeyService
                .rekey(params, persistDatabaseKey(params.nextKey).pipe(Effect.orDie, Effect.andThen(afterCommit)))
                .pipe(
                    Effect.andThen(reloadApp),
                    Effect.onError(() => persistDatabaseKey(previousPin).pipe(Effect.orDie))
                );
        });

        const rekeyDatabase = Effect.fn('AuthService.rekeyDatabase')(function* (
            params: RekeyParamsInterface,
            afterCommit: Effect.Effect<void> = Effect.void
        ) {
            yield* databaseLifecycleService.run(DatabaseLifecycleOperationEnum.REKEY, runRekey(params, afterCommit));
        });

        const grantSealUnlock = Clock.currentTimeMillis.pipe(
            Effect.flatMap(now =>
                Effect.promise(() => SecureStore.setItemAsync(SEAL_UNLOCK_GRANT_KEY, String(now), PIN_SECURE_STORE_OPTIONS))
            )
        );

        return {
            ensurePinBackgroundAccessibility: Effect.fn('AuthService.ensurePinBackgroundAccessibility')(function* () {
                const pin = yield* getPin();

                if (isNotEmptyString(pin)) {
                    yield* persistDatabaseKey(pin);
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
                    const hasFace = types.some(type => type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
                    const hasFingerprint = types.some(type => type === LocalAuthentication.AuthenticationType.FINGERPRINT);
                    const biometricKind = getBiometricKind(hasFace, hasFingerprint);

                    return {
                        biometricKind,
                        isSomeAvailable: isDefined(biometricKind)
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

                    if (result.success) {
                        yield* pinAttemptService.reset;
                    }

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
            sealOnboarding: Effect.fn('AuthService.sealOnboarding')(function* (
                pin: string,
                isBiometricEnabled: boolean,
                onboardingStep: number
            ) {
                yield* widgetSnapshotService.mask().pipe(Effect.ignoreCause({ log: 'Error' }));
                yield* rekeyDatabase(
                    { nextKey: pin, nextSettings: { isBiometricEnabled, isPinEnabled: true, onboardingStep } },
                    grantSealUnlock
                ).pipe(
                    Effect.onError(() =>
                        Effect.sync(() => {
                            widgetSnapshotService.unlock();
                        })
                    )
                );
            }),
            consumeSealUnlockGrant: Effect.fn('AuthService.consumeSealUnlockGrant')(function* () {
                yield* Effect.promise(() => SecureStore.deleteItemAsync(SEAL_UNLOCK_GRANT_KEY, PIN_SECURE_STORE_OPTIONS));
            }),
            changePin: Effect.fn('AuthService.changePin')(function* (pin: string) {
                yield* rekeyDatabase({ nextKey: pin });
            }),
            verifyPin: (pin: string) => pinAttemptService.verify(Effect.map(getPin(), savedPin => savedPin === pin)),
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
            persistPin: persistDatabaseKey
        };
    })
}) {
    static readonly layer = Layer.effect(AuthService, AuthService.make).pipe(
        Layer.provide([DatabaseLifecycleService.layer, DatabaseRekeyService.layer, PinAttemptService.layer, WidgetSnapshotService.layer])
    );
}
