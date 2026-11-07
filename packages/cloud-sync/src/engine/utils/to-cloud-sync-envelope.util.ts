import type { ICloudFetchedRecord } from '../../transport/interface/icloud-fetched-record.interface';

export const toCloudSyncEnvelope = (
    record: Pick<ICloudFetchedRecord, 'encryptedFields' | 'recordName' | 'recordType' | 'schemaVersion'>,
    zone: string
) => ({
    recordType: record.recordType,
    recordName: record.recordName,
    zone,
    schemaVersion: record.schemaVersion,
    encryptedFields: record.encryptedFields
});
