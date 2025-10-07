import type { AccountEntityInterface } from '@/account';
import type { CategoryEntityInterface } from '@/category';
import type { BaseEntityInterface } from '@/generic';
import type { TagEntityInterface } from '@/tag';
import type { TransactionAssociationEnum, TransactionTypeEnum } from '@/transaction';

export interface TransactionEntityInterface extends BaseEntityInterface {
    title: string;
    amount: number;
    comment: string;
    accountId: number;
    operationDate: Date;
    type: TransactionTypeEnum;

    [TransactionAssociationEnum.TAGS]?: TagEntityInterface[];
    [TransactionAssociationEnum.ACCOUNT]?: AccountEntityInterface;
    [TransactionAssociationEnum.CATEGORIES]?: CategoryEntityInterface[];
}
