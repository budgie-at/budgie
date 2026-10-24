import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { DatabaseLifecycleService } from '../src/@generic/drizzle/service/database-lifecycle.service';
import { DatabaseRekeyService } from '../src/@generic/drizzle/service/database-rekey.service';
import { AuthService } from '../src/auth/service/auth.service';
import { PinAttemptService } from '../src/auth/service/pin-attempt.service';
import { WidgetSnapshotService } from '../src/widget/service/widget-snapshot.service';

const biometrics = vi.hoisted(() => {
    const defaults = { hasHardware: true, isEnrolled: true, types: [2], result: { success: true }, isNativeFailing: false };

    return { ...defaults, defaults, resetCount: 0 };
});

vi.mock('expo-local-authentication', () => ({
    AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 },
    hasHardwareAsync: () => (biometrics.isNativeFailing ? Promise.reject(new Error('native')) : Promise.resolve(biometrics.hasHardware)),
    isEnrolledAsync: () => Promise.resolve(biometrics.isEnrolled),
    supportedAuthenticationTypesAsync: () => Promise.resolve(biometrics.types),
    authenticateAsync: () => (biometrics.isNativeFailing ? Promise.reject(new Error('native')) : Promise.resolve(biometrics.result))
}));
vi.mock('expo-secure-store', () => ({ AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 0 }));
vi.mock('expo-file-system', () => ({ File: vi.fn(), Directory: vi.fn(), Paths: { document: '' } }));
vi.mock('../src/@generic/drizzle/service/database-lifecycle.service', async () => {
    const Context = await import('effect/Context');

    return { DatabaseLifecycleService: Context.Service<object>('test/DatabaseLifecycleService') };
});
vi.mock('../src/@generic/drizzle/service/database-rekey.service', async () => {
    const Context = await import('effect/Context');

    return { DatabaseRekeyService: Context.Service<object>('test/DatabaseRekeyService') };
});
vi.mock('../src/widget/service/widget-snapshot.service', async () => {
    const Context = await import('effect/Context');

    return { WidgetSnapshotService: Context.Service<object>('test/WidgetSnapshotService') };
});
vi.mock('../src/@generic/utils/reload-app.util', () => ({ reloadApp: () => Promise.resolve() }));

const authServiceLayer = Layer.effect(AuthService, AuthService.make).pipe(
    Layer.provide([
        Layer.mock(DatabaseLifecycleService)({}),
        Layer.mock(DatabaseRekeyService)({}),
        Layer.mock(WidgetSnapshotService)({ unlock: emptyFn }),
        Layer.mock(PinAttemptService)({ reset: () => Effect.sync(() => void (biometrics.resetCount += 1)) })
    ])
);

const configureBiometrics = (overrides: Partial<typeof biometrics.defaults>) =>
    Object.assign(biometrics, biometrics.defaults, { resetCount: 0 }, overrides);

const readBiometricTypes = Effect.flatMap(AuthService, authService => authService.getBiometricTypes());
const authenticate = Effect.flatMap(AuthService, authService => authService.authenticateWithBiometrics());

describe('AuthService biometric capability and prompt', () => {
    it.effect('offers Face ID only when the device has enrolled hardware', () =>
        Effect.gen(function* () {
            configureBiometrics({});
            const enrolled = yield* readBiometricTypes;

            configureBiometrics({ isEnrolled: false });
            const notEnrolled = yield* readBiometricTypes;

            configureBiometrics({ hasHardware: false });
            const noHardware = yield* readBiometricTypes;

            expect(enrolled).toEqual({ isSomeAvailable: true, isFaceIdAvailable: true, isTouchIdAvailable: false });
            expect(notEnrolled.isSomeAvailable).toBe(false);
            expect(noHardware.isSomeAvailable).toBe(false);
        }).pipe(Effect.provide(authServiceLayer))
    );

    it.effect('reports biometrics as unavailable when the native module fails', () =>
        Effect.gen(function* () {
            configureBiometrics({ isNativeFailing: true });

            expect((yield* readBiometricTypes).isSomeAvailable).toBe(false);
        }).pipe(Effect.provide(authServiceLayer))
    );

    it.effect('clears the PIN attempt counter only after a successful biometric unlock', () =>
        Effect.gen(function* () {
            configureBiometrics({});
            const accepted = yield* authenticate;
            const resetsAfterSuccess = biometrics.resetCount;

            configureBiometrics({ result: { success: false } });
            const declined = yield* authenticate;

            expect([accepted, resetsAfterSuccess]).toEqual([true, 1]);
            expect([declined, biometrics.resetCount]).toEqual([false, 0]);
        }).pipe(Effect.provide(authServiceLayer))
    );

    it.effect('falls back to the PIN when the biometric prompt itself fails', () =>
        Effect.gen(function* () {
            configureBiometrics({ isNativeFailing: true });

            expect(yield* authenticate).toBe(false);
            expect(biometrics.resetCount).toBe(0);
        }).pipe(Effect.provide(authServiceLayer))
    );
});
