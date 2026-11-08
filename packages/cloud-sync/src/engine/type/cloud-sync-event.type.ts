import type { ICloudAccountChangeEvent } from '../../transport/interface/icloud-account-change-event.interface';
import type { ICloudFetchedChangesEvent } from '../../transport/interface/icloud-fetched-changes-event.interface';
import type { ICloudScopedEvent } from '../../transport/interface/icloud-scoped-event.interface';
import type { ICloudSentChangesEvent } from '../../transport/interface/icloud-sent-changes-event.interface';
import type { ICloudShareAcceptedEvent } from '../../transport/interface/icloud-share-accepted-event.interface';
import type { ICloudShareChangedEvent } from '../../transport/interface/icloud-share-changed-event.interface';
import type { ICloudStateSerializationEvent } from '../../transport/interface/icloud-state-serialization-event.interface';
import type { ICloudZoneChangeEvent } from '../../transport/interface/icloud-zone-change-event.interface';
import type { CloudSyncEventKindEnum } from '../enum/cloud-sync-event-kind.enum';

export type CloudSyncEventType =
    | { readonly kind: CloudSyncEventKindEnum.STATE_SERIALIZATION; readonly event: ICloudStateSerializationEvent }
    | { readonly kind: CloudSyncEventKindEnum.FETCHED_CHANGES; readonly event: ICloudFetchedChangesEvent }
    | { readonly kind: CloudSyncEventKindEnum.SENT_CHANGES; readonly event: ICloudSentChangesEvent }
    | { readonly kind: CloudSyncEventKindEnum.ACCOUNT_CHANGE; readonly event: ICloudAccountChangeEvent }
    | { readonly kind: CloudSyncEventKindEnum.ZONE_CHANGE; readonly event: ICloudZoneChangeEvent }
    | { readonly kind: CloudSyncEventKindEnum.WILL_FETCH; readonly event: ICloudScopedEvent }
    | { readonly kind: CloudSyncEventKindEnum.DID_FETCH; readonly event: ICloudScopedEvent }
    | { readonly kind: CloudSyncEventKindEnum.SHARE_ACCEPTED; readonly event: ICloudShareAcceptedEvent }
    | { readonly kind: CloudSyncEventKindEnum.SHARE_CHANGED; readonly event: ICloudShareChangedEvent };
