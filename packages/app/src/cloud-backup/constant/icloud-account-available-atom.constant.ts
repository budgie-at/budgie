import { ICloudAccountStatusEnum, ICloudErrorCode } from '@budgie/cloud-sync';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';

import { appStateChanges } from '../../@generic/constant/app-state-changes.constant';
import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { CloudTransport } from '../service/cloud-transport.service';

import { iCloudAccountRefreshAtom } from './icloud-account-refresh-atom.constant';

export const iCloudAccountAvailableAtom = appAtomRuntime.atom(get => {
    get(iCloudAccountRefreshAtom);

    return Stream.concat(
        Stream.succeed('active'),
        Stream.filter(appStateChanges, state => state === 'active')
    ).pipe(
        Stream.mapEffect(() =>
            Effect.flatMap(
                Effect.serviceOption(CloudTransport),
                Option.match({
                    onNone: () => Effect.succeed(true),
                    onSome: cloudTransport =>
                        cloudTransport.getAccountStatus.pipe(
                            Effect.map(({ status }) => status === ICloudAccountStatusEnum.AVAILABLE),
                            Effect.catchTags({
                                CloudSyncTransportError: error => Effect.succeed(error.code === ICloudErrorCode.NETWORK_UNAVAILABLE)
                            }),
                            Effect.orElseSucceed(() => false)
                        )
                })
            )
        )
    );
});
