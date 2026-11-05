import type { SyncRecordInterface } from '../../mapping/interface/sync-record.interface';
import type { EncodedSyncFieldsType } from '../../mapping/type/encoded-sync-fields.type';

export const withSyncRecordFields = (record: SyncRecordInterface, zone: string, fields: EncodedSyncFieldsType): SyncRecordInterface => ({
    ...record,
    zone,
    encryptedFields: { ...record.encryptedFields, ...fields }
});
