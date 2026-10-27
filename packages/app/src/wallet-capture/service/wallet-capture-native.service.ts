import { AccountRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Queue from 'effect/Queue';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Schema from 'effect/Schema';
import * as Stream from 'effect/Stream';
import * as AppIntents from 'expo-app-intents';

import { NativeCallError } from '../../@generic/error/native-call.error';
import { WalletCaptureNativeRecordsSchema } from '../constant/wallet-capture-native-record-schema.constant';
import { WalletCaptureReactivityKeyEnum } from '../enum/wallet-capture-reactivity-key.enum';

export class WalletCaptureNativeService extends Context.Service<WalletCaptureNativeService>()('@budgie/app/WalletCaptureNativeService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const reactivity = yield* Reactivity.Reactivity;
        const captureInvocationName = 'captureApplePayTransaction';
        const accountCatalogKind = 'walletAccount';

        const callNative = <A>(call: () => Promise<A>) => Effect.tryPromise({ try: call, catch: cause => new NativeCallError({ cause }) });

        return {
            refreshAccounts: Effect.fn('WalletCaptureNativeService.refreshAccounts')(function* () {
                const accounts = yield* accountRepository.getAllActiveAccounts();

                yield* callNative(() =>
                    AppIntents.setEntityCatalogAsync(
                        accountCatalogKind,
                        accounts.filter(account => account.isActive).map(({ id, title }) => ({ id: String(id), title }))
                    )
                );
            }),
            getCaptures: Effect.fn('WalletCaptureNativeService.getCaptures')(function* () {
                const invocations = yield* callNative(() => AppIntents.getPendingInvocationsAsync());

                return yield* Schema.decodeUnknownEffect(WalletCaptureNativeRecordsSchema)(
                    invocations
                        .filter(invocation => invocation.name === captureInvocationName)
                        .map(({ id, params, createdAt }) => ({ ...params, captureId: id, capturedAt: new Date(createdAt).toISOString() }))
                );
            }),
            captureInvocations: Stream.callback<string>(
                queue =>
                    Effect.acquireRelease(
                        Effect.sync(() =>
                            AppIntents.addAppIntentListener(invocation => {
                                if (invocation.name === captureInvocationName) {
                                    Queue.offerUnsafe(queue, invocation.id);
                                }
                            })
                        ),
                        subscription =>
                            Effect.sync(() => {
                                subscription.remove();
                            })
                    ),
                { bufferSize: 1, strategy: 'sliding' }
            ),
            acknowledgeCaptures: (captureIds: readonly string[]) =>
                reactivity.mutation(
                    [WalletCaptureReactivityKeyEnum.CAPTURES],
                    Effect.forEach(captureIds, captureId => callNative(() => AppIntents.removePendingInvocationAsync(captureId)), {
                        discard: true
                    })
                )
        };
    })
}) {
    static readonly layer = Layer.effect(WalletCaptureNativeService, WalletCaptureNativeService.make).pipe(
        Layer.provide(AccountRepository.layer)
    );
}
