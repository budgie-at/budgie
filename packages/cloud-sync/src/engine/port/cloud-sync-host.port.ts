import * as Context from 'effect/Context';

import type { HouseholdJoinStatusEnum } from '../../household/enum/household-join-status.enum';
import type { CloudSyncStatusInterface } from '../interface/cloud-sync-status.interface';
import type * as Effect from 'effect/Effect';
import type * as Stream from 'effect/Stream';

export class CloudSyncHost extends Context.Service<
    CloudSyncHost,
    {
        readonly deviceName: string;
        readonly isForeground: Effect.Effect<boolean>;
        readonly foregroundChanges: Stream.Stream<boolean>;
        readonly publishStatus: (status: CloudSyncStatusInterface) => Effect.Effect<void>;
        readonly publishHousehold: (isReady: boolean) => Effect.Effect<void>;
        readonly publishHouseholdOwnerName: (ownerDisplayName: string | null) => Effect.Effect<void>;
        readonly publishJoin: (status: HouseholdJoinStatusEnum, ownerDisplayName: string | null) => Effect.Effect<void>;
        readonly bumpHouseholdRefresh: Effect.Effect<void>;
        readonly bumpAccountRefresh: Effect.Effect<void>;
        readonly notifyJoinFailed: Effect.Effect<void>;
    }
>()('@budgie/cloud-sync/CloudSyncHost') {}
