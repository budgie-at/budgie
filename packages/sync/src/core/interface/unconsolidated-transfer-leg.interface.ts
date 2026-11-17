import type { TransactionEntryTypeEnum } from '@budgie/contracts';

export interface UnconsolidatedTransferLegInterface {
    readonly transactionId: number;
    readonly entryId: number;
    readonly entryExternalId: string | null;
    readonly operatedAt: Date;
    readonly entryType: TransactionEntryTypeEnum;
    readonly amount: number;
    readonly counterpartExternalId: string | null;
    readonly counterpartIban: string | null;
    readonly counterpartAliasExternalIds: readonly string[];
}
