import type { ExternalSourceEnum, TransactionTypeEnum } from '@budgie/contracts';

export interface LightweightRuleTransactionInterface {
    readonly id: number;
    readonly type: TransactionTypeEnum;
    readonly title: string;
    readonly comment: string;
    readonly fromAccountId: number | null;
    readonly toAccountId: number | null;
    readonly externalSource: ExternalSourceEnum | null;
}
