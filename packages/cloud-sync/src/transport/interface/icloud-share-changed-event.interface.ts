import { ICloudErrorCode } from '../enum/icloud-error-code.enum';
import { ICloudShareChange } from '../enum/icloud-share-change.enum';

export interface ICloudShareChangedEvent {
    readonly zoneName: string;
    readonly change: ICloudShareChange;
    readonly code?: ICloudErrorCode;
    readonly message?: string;
}
