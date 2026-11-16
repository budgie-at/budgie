import type { TransactionEntryTypeEnum } from '@budgie/contracts';

export interface UnconsolidatedTransferLegInterface {
    readonly transactionId: number;
    readonly operatedAt: Date;
    readonly entryType: TransactionEntryTypeEnum;
    readonly amount: number;
    readonly counterpartExternalId: string | null;
    readonly counterpartIban: string | null;
}
