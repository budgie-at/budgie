import type { ICloudFailure } from '../interface/icloud-failure.interface';
import type { ICloudRecordId } from '../interface/icloud-record-id.interface';

export type ICloudFailedDelete = ICloudRecordId & ICloudFailure;
