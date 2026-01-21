import { AccountWithInstrumentEntityInterface, CategoryEntityInterface, CurrencyEnum, TransactionTypeEnum } from '@budgie/contracts';

export interface AITransactionInterface {
    category: CategoryEntityInterface | null;
    amount: number;
    currency: CurrencyEnum | null;
    account: AccountWithInstrumentEntityInterface | null;
    type: TransactionTypeEnum;
    comment: string;
}
