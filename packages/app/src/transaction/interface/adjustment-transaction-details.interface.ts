import type { InstrumentTypeEnum, TransactionEntryCreateInputInterface, UserIconType } from '@budgie/contracts';

export interface AdjustmentTransactionDetailsInterface {
    readonly accountId: number;
    readonly accountTitle: string;
    readonly accountIcon: UserIconType;
    readonly instrumentCode: string;
    readonly instrumentSymbol: string;
    readonly instrumentType: InstrumentTypeEnum;
    readonly initialAmount: number;
    readonly initialIsIncrease: boolean;
    readonly entry: TransactionEntryCreateInputInterface;
}
