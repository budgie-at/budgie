import { ICloudErrorCode } from '../enum/icloud-error-code.enum';

export interface ICloudFailure {
    readonly isRetried: boolean;
    readonly code: ICloudErrorCode;
    readonly message: string;
}
