import type { ExternalSourceEnum } from '@budgie/contracts';

export interface BankSyncDuplicateRepairSourceInterface {
    readonly externalSource: ExternalSourceEnum;
    readonly candidateSql: string;
}
