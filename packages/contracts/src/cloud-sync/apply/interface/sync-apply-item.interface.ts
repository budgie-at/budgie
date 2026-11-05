import type { DecodedSyncRecordInterface } from '../../mapping/interface/decoded-sync-record.interface';

export interface SyncApplyItemInterface {
    readonly decoded: DecodedSyncRecordInterface;
    readonly envelopeJson: string;
    readonly systemFields: string | null;
    readonly movedTo: string | null;
}
