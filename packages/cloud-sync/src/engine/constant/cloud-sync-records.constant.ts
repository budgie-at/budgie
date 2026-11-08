import { HOUSEHOLD_SYNC_ZONE, PERSONAL_SYNC_ZONE } from '@budgie/contracts';
import * as Str from 'effect/String';

export const CLOUD_SYNC_RECORDS = {
    personalZoneName: Str.capitalize(PERSONAL_SYNC_ZONE),
    householdZoneName: Str.capitalize(HOUSEHOLD_SYNC_ZONE),
    metaRecordName: 'sync-meta',
    metaRecordType: Str.capitalize('syncMeta'),
    deviceRecordType: Str.capitalize('syncDevice')
};
