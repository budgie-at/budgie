import type { BaseEntityInterface } from '@/generic';
import type { TransactionEntityInterface } from '@/transaction';
import type { AccountAssociationEnum } from '@/account';

export interface AccountEntityInterface extends BaseEntityInterface {
    [AccountAssociationEnum.TRANSACTIONS]?: TransactionEntityInterface[];
}
