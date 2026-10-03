import { WalletCaptureNativeService } from '@app/wallet-capture/service/wallet-capture-native.service';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import { vi } from 'vitest';
const nativeModuleLookup = vi.hoisted(() => vi.fn(() => null));
const nativePlatform = vi.hoisted(() => ({ OS: 'ios' }));

vi.unmock('@app/../modules/apple-wallet-capture/src/apple-wallet-capture');
vi.mock('expo', () => ({ requireOptionalNativeModule: nativeModuleLookup }));
vi.mock('react-native', () => ({ Platform: nativePlatform }));

describe('Wallet capture native platform boundary', () => {
    it.effect.each(['android', 'ios'])('safely supports a missing native module on %s', platform =>
        Effect.gen(function* () {
            Object.assign(nativePlatform, { OS: platform });
            nativeModuleLookup.mockClear();
            yield* Effect.gen(function* () {
                const nativeService = yield* WalletCaptureNativeService;
                expect(yield* nativeService.getCaptures()).toEqual([]);
                yield* nativeService.replaceAccounts([]);
                yield* nativeService.markNeedsReview('missing', 1);
                yield* nativeService.acknowledgeCaptures(['missing']);
                expect(nativeModuleLookup).toHaveBeenCalledTimes(platform === 'ios' ? 1 : 0);
            }).pipe(Effect.provide(WalletCaptureNativeService.layer.pipe(Layer.provide(Reactivity.layer))));
        })
    );
});
