import * as Schema from 'effect/Schema';

export const CloudSyncDeviceRecordSchema = Schema.fromJsonString(
    Schema.Struct({ encryptedFields: Schema.Struct({ installId: Schema.String, lastSyncedAt: Schema.Finite }) })
);
