import type { ICloudScopedEvent } from './icloud-scoped-event.interface';

export interface ICloudStateSerializationEvent extends ICloudScopedEvent {
    readonly stateSerialization: string;
}
