import type {
    ICloudAccountChangeEvent,
    ICloudFetchedChangesEvent,
    ICloudScopedEvent,
    ICloudSentChangesEvent,
    ICloudStateSerializationEvent,
    ICloudZoneChangeEvent
} from '../../../modules/icloud';
import type { CloudSyncEventKindEnum } from '../enum/cloud-sync-event-kind.enum';

export type CloudSyncEventType =
    | { readonly kind: CloudSyncEventKindEnum.STATE_SERIALIZATION; readonly event: ICloudStateSerializationEvent }
    | { readonly kind: CloudSyncEventKindEnum.FETCHED_CHANGES; readonly event: ICloudFetchedChangesEvent }
    | { readonly kind: CloudSyncEventKindEnum.SENT_CHANGES; readonly event: ICloudSentChangesEvent }
    | { readonly kind: CloudSyncEventKindEnum.ACCOUNT_CHANGE; readonly event: ICloudAccountChangeEvent }
    | { readonly kind: CloudSyncEventKindEnum.ZONE_CHANGE; readonly event: ICloudZoneChangeEvent }
    | { readonly kind: CloudSyncEventKindEnum.WILL_FETCH; readonly event: ICloudScopedEvent }
    | { readonly kind: CloudSyncEventKindEnum.DID_FETCH; readonly event: ICloudScopedEvent };
