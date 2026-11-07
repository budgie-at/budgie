import { NativeModule, requireOptionalNativeModule } from 'expo';

import type {
    ICloudAccountChangeEvent,
    ICloudAccountStatusResult,
    ICloudFetchedChangesEvent,
    ICloudFetchedRecord,
    ICloudJoinedHousehold,
    ICloudOwnedHousehold,
    ICloudRecordId,
    ICloudRecordPayload,
    ICloudScopedEvent,
    ICloudSentChangesEvent,
    ICloudShareAcceptedEvent,
    ICloudShareChangedEvent,
    ICloudShareParticipant,
    ICloudStateSerializationEvent,
    ICloudSyncScope,
    ICloudZoneChangeEvent,
    ICloudZoneInventoryRecord
} from '@budgie/cloud-sync';

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
