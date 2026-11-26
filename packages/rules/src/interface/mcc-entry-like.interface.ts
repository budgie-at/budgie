import type { TransactionEntryTypeEnum } from '@budgie/contracts';

export interface MccEntryLikeInterface {
    readonly type: TransactionEntryTypeEnum;
    readonly mccCode?: string | null;
    readonly mccCategory?: { readonly mcc: string } | null;
}
