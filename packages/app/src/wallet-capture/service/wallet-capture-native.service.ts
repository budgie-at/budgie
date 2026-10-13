import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Schema from 'effect/Schema';

import { isDefined } from '@rnw-community/shared';

import { appleWalletCaptureNativeModule } from '../../../modules/apple-wallet-capture/src/apple-wallet-capture';
import { WalletCaptureNativeRecordsSchema } from '../constant/wallet-capture-native-record-schema.constant';
import { WalletCaptureReactivityKeyEnum } from '../enum/wallet-capture-reactivity-key.enum';

import type { WalletCaptureAccountInterface } from '../interface/wallet-capture-account.interface';

export class WalletCaptureNativeService extends Context.Service<WalletCaptureNativeService>()('@budgie/app/WalletCaptureNativeService', {
    make: Effect.gen(function* () {
        const nativeModule = yield* appleWalletCaptureNativeModule;
        const reactivity = yield* Reactivity.Reactivity;

        return {
            replaceAccounts: (accounts: WalletCaptureAccountInterface[]) =>
                isDefined(nativeModule) ? Effect.promise(() => nativeModule.replaceAccounts(accounts)) : Effect.void,
            getCaptures: Effect.fn('WalletCaptureNativeService.getCaptures')(function* () {
                if (!isDefined(nativeModule)) {
                    return [];
                }

                return yield* Schema.decodeUnknownEffect(WalletCaptureNativeRecordsSchema)(
                    yield* Effect.promise(() => nativeModule.getCaptures())
                );
            }),
            markNeedsReview: Effect.fn('WalletCaptureNativeService.markNeedsReview')(function* (
                captureId: string,
                duplicateTransactionId: number
            ) {
                if (isDefined(nativeModule)) {
                    yield* reactivity.mutation(
                        [WalletCaptureReactivityKeyEnum.CAPTURES],
                        Effect.promise(() => nativeModule.markNeedsReview(captureId, duplicateTransactionId))
                    );
                }
            }),
            acknowledgeCaptures: Effect.fn('WalletCaptureNativeService.acknowledgeCaptures')(function* (captureIds: string[]) {
                if (isDefined(nativeModule)) {
                    yield* reactivity.mutation(
                        [WalletCaptureReactivityKeyEnum.CAPTURES],
                        Effect.promise(() => nativeModule.acknowledgeCaptures(captureIds))
                    );
                }
            })
        };
    })
}) {
    static readonly layer = Layer.effect(WalletCaptureNativeService, WalletCaptureNativeService.make);
}
