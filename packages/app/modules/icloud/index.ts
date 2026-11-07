import { NativeModule, requireOptionalNativeModule } from 'expo';

export enum ICloudErrorCode {
    ACCOUNT_UNAVAILABLE = 'ACCOUNT_UNAVAILABLE',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
    BACKUP_KEY_UNAVAILABLE = 'BACKUP_KEY_UNAVAILABLE',
    ENCRYPTED_DATA_RESET = 'ENCRYPTED_DATA_RESET',
    SERVER_RECORD_CHANGED = 'SERVER_RECORD_CHANGED',
    ZONE_NOT_FOUND = 'ZONE_NOT_FOUND',
    USER_DELETED_ZONE = 'USER_DELETED_ZONE',
    PARTICIPANT_NEEDS_VERIFICATION = 'PARTICIPANT_NEEDS_VERIFICATION',
    PERMISSION_FAILURE = 'PERMISSION_FAILURE',
    UNKNOWN_ITEM = 'UNKNOWN_ITEM',
    LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
    CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
    SERVICE_BUSY = 'SERVICE_BUSY',
    SYNC_NOT_STARTED = 'SYNC_NOT_STARTED',
    INVALID_STATE = 'INVALID_STATE',
    UNKNOWN = 'UNKNOWN'
}

export enum ICloudSyncScope {
    PRIVATE = 'PRIVATE',
    SHARED = 'SHARED'
}

export enum ICloudAccountChangeType {
    SIGN_IN = 'SIGN_IN',
    SIGN_OUT = 'SIGN_OUT',
    SWITCH_ACCOUNTS = 'SWITCH_ACCOUNTS'
}

export enum ICloudZoneChangeReason {
    DELETED = 'DELETED',
    PURGED = 'PURGED',
    ENCRYPTED_DATA_RESET = 'ENCRYPTED_DATA_RESET',
    ACCESS_LOST = 'ACCESS_LOST'
}

export enum ICloudShareOutcome {
    JOINING = 'JOINING',
    ACCEPTED = 'ACCEPTED',
    FAILED = 'FAILED'
}

export enum ICloudShareChange {
    SAVED = 'SAVED',
    STOPPED = 'STOPPED',
    FAILED = 'FAILED'
}

export enum ICloudParticipantRole {
    OWNER = 'OWNER',
    PRIVATE_USER = 'PRIVATE_USER',
    PUBLIC_USER = 'PUBLIC_USER',
    UNKNOWN = 'UNKNOWN'
}

export enum ICloudParticipantAcceptanceStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REMOVED = 'REMOVED',
    UNKNOWN = 'UNKNOWN'
}

export enum ICloudParticipantPermission {
    NONE = 'NONE',
    READ_ONLY = 'READ_ONLY',
    READ_WRITE = 'READ_WRITE',
    UNKNOWN = 'UNKNOWN'
}

export const ICLOUD_DEFAULT_OWNER_NAME = '__defaultOwner__';

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

export type ICloudWireValue = string | number | boolean;

export interface ICloudRecordId {
    readonly zoneName: string;
    readonly ownerName: string;
    readonly recordName: string;
}

export interface ICloudZoneId {
    readonly zoneName: string;
    readonly ownerName: string;
}

export interface ICloudRecordPayload extends ICloudRecordId {
    readonly recordType: string;
    readonly systemFields: string | null;
    readonly schemaVersion: number;
    readonly encryptedFields: Readonly<Record<string, ICloudWireValue | null>>;
}

export interface ICloudFetchedRecord extends ICloudRecordId {
    readonly recordType: string;
    readonly systemFields: string;
    readonly schemaVersion: number;
    readonly encryptedFields: Readonly<Record<string, ICloudWireValue>>;
}

export interface ICloudZoneInventoryRecord {
    readonly recordName: string;
    readonly recordType: string;
}

export interface ICloudFetchedDeletion extends ICloudRecordId {
    readonly recordType: string;
}

export interface ICloudSavedRecord extends ICloudRecordId {
    readonly recordType: string;
    readonly systemFields: string;
}

export interface ICloudFailure {
    readonly code: ICloudErrorCode;
    readonly message: string;
}

export interface ICloudFailedSave extends ICloudRecordId, ICloudFailure {
    readonly recordType: string;
    readonly serverRecord: ICloudFetchedRecord | null;
}

export type ICloudFailedDelete = ICloudRecordId & ICloudFailure;

export type ICloudFailedZone = ICloudZoneId & ICloudFailure;

export interface ICloudScopedEvent {
    readonly scope: ICloudSyncScope;
}

export interface ICloudBatchEvent extends ICloudScopedEvent {
    readonly batchId: string;
}

export interface ICloudStateSerializationEvent extends ICloudScopedEvent {
    readonly stateSerialization: string;
}

export interface ICloudFetchedChangesEvent extends ICloudBatchEvent {
    readonly records: readonly ICloudFetchedRecord[];
    readonly deletions: readonly ICloudFetchedDeletion[];
    readonly changedShares: readonly ICloudZoneId[];
}

export interface ICloudSentChangesEvent extends ICloudBatchEvent {
    readonly savedRecords: readonly ICloudSavedRecord[];
    readonly failedSaves: readonly ICloudFailedSave[];
    readonly deletedRecords: readonly ICloudRecordId[];
    readonly failedDeletes: readonly ICloudFailedDelete[];
    readonly savedZones: readonly ICloudZoneId[];
    readonly failedZoneSaves: readonly ICloudFailedZone[];
    readonly deletedZones: readonly ICloudZoneId[];
    readonly failedZoneDeletes: readonly ICloudFailedZone[];
}

export interface ICloudAccountChangeEvent extends ICloudBatchEvent {
    readonly changeType: ICloudAccountChangeType;
    readonly currentUserRecordName: string | null;
    readonly previousUserRecordName: string | null;
}

export interface ICloudDeletedZone extends ICloudZoneId {
    readonly reason: ICloudZoneChangeReason;
}

export interface ICloudZoneChangeEvent extends ICloudBatchEvent {
    readonly deleted: readonly ICloudDeletedZone[];
    readonly modified: readonly ICloudZoneId[];
}

export interface ICloudShareAcceptedEvent extends ICloudZoneId {
    readonly outcome: ICloudShareOutcome;
    readonly ownerDisplayName?: string;
    readonly code?: ICloudErrorCode;
    readonly message?: string;
}

export interface ICloudJoinedHousehold extends ICloudZoneId {
    readonly ownerDisplayName?: string;
}

export interface ICloudOwnedHousehold {
    readonly zoneName: string;
    readonly shareRecordName: string;
}

export interface ICloudShareChangedEvent {
    readonly zoneName: string;
    readonly change: ICloudShareChange;
    readonly code?: ICloudErrorCode;
    readonly message?: string;
}

export interface ICloudShareParticipant {
    readonly participantId: string;
    readonly displayName: string | null;
    readonly role: ICloudParticipantRole;
    readonly acceptanceStatus: ICloudParticipantAcceptanceStatus;
    readonly permission: ICloudParticipantPermission;
    readonly isCurrentUser: boolean;
}

type ICloudNativeEvents = {
    onStateSerialization: (event: ICloudStateSerializationEvent) => void;
    onFetchedChanges: (event: ICloudFetchedChangesEvent) => void;
    onSentChanges: (event: ICloudSentChangesEvent) => void;
    onAccountChange: (event: ICloudAccountChangeEvent) => void;
    onZoneChange: (event: ICloudZoneChangeEvent) => void;
    onWillFetchChanges: (event: ICloudScopedEvent) => void;
    onDidFetchChanges: (event: ICloudScopedEvent) => void;
    onShareAccepted: (event: ICloudShareAcceptedEvent) => void;
    onShareChanged: (event: ICloudShareChangedEvent) => void;
};

declare class ICloudNativeModule extends NativeModule<ICloudNativeEvents> {
    startSync(scope: ICloudSyncScope, stateSerialization: string | null): Promise<void>;
    stopSync(scope: ICloudSyncScope): Promise<void>;
    syncNow(scope: ICloudSyncScope): Promise<void>;
    addPendingSaves(scope: ICloudSyncScope, records: readonly ICloudRecordPayload[]): Promise<void>;
    addPendingDeletes(scope: ICloudSyncScope, recordIds: readonly ICloudRecordId[]): Promise<void>;
    confirmFetchedBatch(scope: ICloudSyncScope, batchId: string): Promise<void>;
    fetchRecord(scope: ICloudSyncScope, zoneName: string, recordName: string): Promise<ICloudFetchedRecord | null>;
    fetchZoneInventory(scope: ICloudSyncScope, zoneName: string): Promise<readonly ICloudZoneInventoryRecord[]>;
    ensureZone(scope: ICloudSyncScope, zoneName: string): Promise<void>;
    deleteZone(scope: ICloudSyncScope, zoneName: string): Promise<void>;
    createHouseholdShare(zoneName: string): Promise<void>;
    getShareParticipants(zoneName: string): Promise<readonly ICloudShareParticipant[]>;
    findOwnedHousehold(zoneName: string): Promise<ICloudOwnedHousehold | null>;
    findJoinedHousehold(zoneName: string): Promise<ICloudJoinedHousehold | null>;
    stopSharing(zoneName: string): Promise<void>;
    leaveShare(zoneName: string): Promise<void>;
    removeParticipant(zoneName: string, participantId: string): Promise<void>;
    getAccountStatus(): Promise<ICloudAccountStatusResult>;
    saveBackup(fileUri: string, fields: Record<string, string | number>, encryptedFields: Record<string, string>): Promise<string>;
    listBackups(): Promise<readonly ICloudBackupMetadata[]>;
    downloadBackup(recordName: string): Promise<ICloudDownloadedBackup>;
    deleteBackups(recordNames: readonly string[]): Promise<void>;
}

export const ICloudModule = requireOptionalNativeModule<ICloudNativeModule>('ICloud');
