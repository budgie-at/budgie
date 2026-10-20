import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Queue from 'effect/Queue';
import * as Stream from 'effect/Stream';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import { addNetworkStateListener, getNetworkStateAsync, NetworkStateType } from 'expo-network';

import { NetworkTypeEnum } from '../enum/network-type.enum';
import { NativeCallError } from '../error/native-call.error';

import type { NetworkState } from 'expo-network';

export class NetworkService extends Context.Service<NetworkService>()('@budgie/app/NetworkService', {
    make: Effect.gen(function* () {
        const toNetworkType = (state: NetworkState): NetworkTypeEnum => {
            if (state.isConnected === false || state.type === NetworkStateType.NONE) {
                return NetworkTypeEnum.OFFLINE;
            }
            if (state.type === NetworkStateType.WIFI || state.type === NetworkStateType.ETHERNET) {
                return NetworkTypeEnum.WIFI;
            }

            return state.type === NetworkStateType.CELLULAR ? NetworkTypeEnum.CELLULAR : NetworkTypeEnum.UNKNOWN;
        };

        const networkStates = Stream.callback<NetworkState>(queue =>
            Effect.acquireRelease(
                Effect.sync(() =>
                    addNetworkStateListener(state => {
                        Queue.offerUnsafe(queue, state);
                    })
                ),
                subscription =>
                    Effect.sync(() => {
                        subscription.remove();
                    })
            )
        );

        const initialNetworkType = yield* Effect.tryPromise({
            try: () => getNetworkStateAsync(),
            catch: cause => new NativeCallError({ cause })
        }).pipe(
            Effect.map(toNetworkType),
            Effect.timeout(Duration.seconds(1)),
            Effect.orElseSucceed(() => NetworkTypeEnum.UNKNOWN)
        );
        const networkType = yield* SubscriptionRef.make(initialNetworkType);

        yield* Effect.forkScoped(Stream.runForEach(networkStates, state => SubscriptionRef.set(networkType, toNetworkType(state))));

        return {
            current: SubscriptionRef.get(networkType),
            changes: SubscriptionRef.changes(networkType)
        };
    })
}) {
    static readonly layer = Layer.effect(NetworkService, NetworkService.make);
}
