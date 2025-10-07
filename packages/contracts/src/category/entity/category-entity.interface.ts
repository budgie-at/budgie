import type { CategoryAssociationEnum } from '@/category';
import type { BaseEntityInterface } from '@/generic';
import type { TransactionEntityInterface } from '@/transaction';

export interface CategoryEntityInterface extends BaseEntityInterface {
    title: string;

    [CategoryAssociationEnum.TRANSACTIONS]?: TransactionEntityInterface[];
}
