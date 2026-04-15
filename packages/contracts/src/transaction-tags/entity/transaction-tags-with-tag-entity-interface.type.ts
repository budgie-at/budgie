import { TagEntityInterface } from '../../tag/entity/tag-entity-interface.type';
import { TransactionTagsAssociationEnum } from '../enum/transaction-tags-association.enum';

import { TransactionTagsEntityInterface } from './transaction-tags-entity-interface.type';

export interface TransactionTagsWithTagEntityInterface extends TransactionTagsEntityInterface {
    [TransactionTagsAssociationEnum.TAG]: TagEntityInterface;
}
