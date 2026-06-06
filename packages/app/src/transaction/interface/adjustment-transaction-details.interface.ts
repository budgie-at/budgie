import type { TransactionEntryCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';

export interface AdjustmentTransactionDetailsInterface {
    readonly accountId: number;
    readonly accountTitle: string;
    readonly accountIcon: UserIconNameEnum;
    readonly instrumentCode: string;
    readonly instrumentSymbol: string;
    readonly initialAmount: number;
    readonly initialIsIncrease: boolean;
    readonly entry: TransactionEntryCreateInputInterface;
}
