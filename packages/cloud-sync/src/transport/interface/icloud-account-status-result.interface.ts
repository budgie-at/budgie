import type { ICloudAccountStatus } from '../type/icloud-account-status.type';

export interface ICloudAccountStatusResult {
    status: ICloudAccountStatus;
    userRecordName: string | null;
}
