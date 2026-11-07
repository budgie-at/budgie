import * as Context from 'effect/Context';

import type { ICloudSyncScope } from '../../transport/enum/icloud-sync-scope.enum';
import type { ICloudAccountStatusResult } from '../../transport/interface/icloud-account-status-result.interface';
import type { ICloudFetchedRecord } from '../../transport/interface/icloud-fetched-record.interface';
import type { ICloudJoinedHousehold } from '../../transport/interface/icloud-joined-household.interface';
import type { ICloudOwnedHousehold } from '../../transport/interface/icloud-owned-household.interface';
import type { ICloudRecordId } from '../../transport/interface/icloud-record-id.interface';
import type { ICloudRecordPayload } from '../../transport/interface/icloud-record-payload.interface';
import type { ICloudShareParticipant } from '../../transport/interface/icloud-share-participant.interface';
import type { ICloudZoneInventoryRecord } from '../../transport/interface/icloud-zone-inventory-record.interface';
import type { CloudSyncTransportError } from '../error/cloud-sync-transport.error';
import type { CloudSyncEventType } from '../type/cloud-sync-event.type';
import type * as Effect from 'effect/Effect';
import type * as Stream from 'effect/Stream';

type TransportEffect<A> = Effect.Effect<A, CloudSyncTransportError>;

export class CloudSyncTransport extends Context.Service<
    CloudSyncTransport,
    {
        readonly events: Stream.Stream<CloudSyncEventType>;
        readonly getAccountStatus: TransportEffect<ICloudAccountStatusResult>;
        readonly startSync: (scope: ICloudSyncScope, stateSerialization: string | null) => TransportEffect<void>;
        readonly stopSync: (scope: ICloudSyncScope) => TransportEffect<void>;
        readonly syncNow: (scope: ICloudSyncScope) => TransportEffect<void>;
        readonly ensureZone: (scope: ICloudSyncScope, zoneName: string) => TransportEffect<void>;
        readonly deleteZone: (scope: ICloudSyncScope, zoneName: string) => TransportEffect<void>;
        readonly fetchRecord: (scope: ICloudSyncScope, zoneName: string, recordName: string) => TransportEffect<ICloudFetchedRecord | null>;
        readonly fetchZoneInventory: (scope: ICloudSyncScope, zoneName: string) => TransportEffect<readonly ICloudZoneInventoryRecord[]>;
        readonly addPendingSaves: (scope: ICloudSyncScope, records: readonly ICloudRecordPayload[]) => TransportEffect<void>;
        readonly addPendingDeletes: (scope: ICloudSyncScope, recordIds: readonly ICloudRecordId[]) => TransportEffect<void>;
        readonly confirmFetchedBatch: (scope: ICloudSyncScope, batchId: string) => TransportEffect<void>;
        readonly createHouseholdShare: (zoneName: string) => TransportEffect<void>;
        readonly getShareParticipants: (zoneName: string) => TransportEffect<readonly ICloudShareParticipant[]>;
        readonly findOwnedHousehold: (zoneName: string) => TransportEffect<ICloudOwnedHousehold | null>;
        readonly findJoinedHousehold: (zoneName: string) => TransportEffect<ICloudJoinedHousehold | null>;
        readonly stopSharing: (zoneName: string) => TransportEffect<void>;
        readonly leaveShare: (zoneName: string) => TransportEffect<void>;
        readonly removeParticipant: (zoneName: string, participantId: string) => TransportEffect<void>;
    }
>()('@budgie/cloud-sync/CloudSyncTransport') {}
