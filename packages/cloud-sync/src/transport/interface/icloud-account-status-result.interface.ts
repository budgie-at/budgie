import type { ICloudAccountStatusEnum } from '../enum/icloud-account-status.enum';

export interface ICloudAccountStatusResult {
    readonly status: ICloudAccountStatusEnum;
    readonly userRecordName: string | null;
}
