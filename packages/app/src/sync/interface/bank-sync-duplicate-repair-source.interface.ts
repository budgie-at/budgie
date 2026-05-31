import type { ExternalSourceEnum } from '@budgie/contracts';

export interface BankSyncDuplicateRepairSourceInterface {
    readonly externalSource: ExternalSourceEnum;
    readonly title: string;
    readonly candidateSql: string;
}
