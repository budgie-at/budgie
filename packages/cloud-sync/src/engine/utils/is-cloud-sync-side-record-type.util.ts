import { CLOUD_SYNC_RECORDS } from '../constant/cloud-sync-records.constant';

export const isCloudSyncSideRecordType = (recordType: string): boolean =>
    recordType === CLOUD_SYNC_RECORDS.metaRecordType || recordType === CLOUD_SYNC_RECORDS.deviceRecordType;
