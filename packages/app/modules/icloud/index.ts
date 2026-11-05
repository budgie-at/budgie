import { NativeModule, requireOptionalNativeModule } from 'expo';

export enum ICloudErrorCode {
    ACCOUNT_UNAVAILABLE = 'ACCOUNT_UNAVAILABLE',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
    BACKUP_KEY_UNAVAILABLE = 'BACKUP_KEY_UNAVAILABLE',
    ENCRYPTED_DATA_RESET = 'ENCRYPTED_DATA_RESET',
    UNKNOWN = 'UNKNOWN'
}

export type ICloudAccountStatus = 'available' | 'noAccount' | 'restricted' | 'temporarilyUnavailable' | 'couldNotDetermine';

export interface ICloudAccountStatusResult {
    status: ICloudAccountStatus;
    userRecordName: string | null;
}

export interface ICloudBackupMetadata {
    recordName: string;
    createdAt: string;
    installId: string;
    deviceName: string;
    deviceModel: string;
    appVersion: string;
    schemaVersion: number;
}

export interface ICloudDownloadedBackup {
    fileUri: string;
    backupKey: string;
}

declare class ICloudNativeModule extends NativeModule {
    getAccountStatus(): Promise<ICloudAccountStatusResult>;
    saveBackup(fileUri: string, fields: Record<string, string | number>, encryptedFields: Record<string, string>): Promise<string>;
    listBackups(): Promise<readonly ICloudBackupMetadata[]>;
    downloadBackup(recordName: string): Promise<ICloudDownloadedBackup>;
    deleteBackups(recordNames: readonly string[]): Promise<void>;
}

export const ICloudModule = requireOptionalNativeModule<ICloudNativeModule>('ICloud');
