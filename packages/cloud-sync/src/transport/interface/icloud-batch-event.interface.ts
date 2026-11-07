import type { ICloudScopedEvent } from './icloud-scoped-event.interface';

export interface ICloudBatchEvent extends ICloudScopedEvent {
    readonly batchId: string;
}
