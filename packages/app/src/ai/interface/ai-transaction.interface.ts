import { CategoryEntityInterface, TransactionTypeEnum } from '@budgie/contracts';

export interface AITransactionInterface {
    category: CategoryEntityInterface | null;
    amount: number;
    type: TransactionTypeEnum;
}
