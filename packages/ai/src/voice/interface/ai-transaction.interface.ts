import { AccountWithInstrumentEntityInterface, CategoryEntityInterface, CurrencyEnum, TransactionTypeEnum } from '@budgie/contracts';

export interface AITransactionInterface {
    readonly category: CategoryEntityInterface | null;
    readonly amount: number;
    readonly currency: CurrencyEnum | null;
    readonly account: AccountWithInstrumentEntityInterface | null;
    readonly type: TransactionTypeEnum;
    readonly comment: string;
}
