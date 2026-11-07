import { ICloudSyncScope } from '../enum/icloud-sync-scope.enum';

export interface ICloudScopedEvent {
    readonly scope: ICloudSyncScope;
}
