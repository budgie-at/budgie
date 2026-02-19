import { TagEntityInterface } from '../../tag/entity/tag-entity.interface';
import { TransactionTagsAssociationEnum } from '../enum/transaction-tags-association.enum';

import { TransactionTagsEntityInterface } from './transaction-tags-entity.interface';

export interface TransactionTagsWithTagEntityInterface extends TransactionTagsEntityInterface {
    [TransactionTagsAssociationEnum.TAG]: TagEntityInterface;
}
