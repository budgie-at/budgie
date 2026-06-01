import type { DB, ExternalSourceEnum } from '@budgie/contracts';

export interface EntryBaseValuationInputInterface {
    readonly accountId: number;
    readonly amount: number;
    readonly operatedAt: Date;
    readonly externalSource: ExternalSourceEnum | null;
    readonly tx?: DB;
}
