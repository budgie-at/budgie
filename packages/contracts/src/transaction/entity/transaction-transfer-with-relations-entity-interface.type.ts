import { AccountEntityInterface } from '../../account/entity/account-entity-interface.type';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionWithRelationsEntityInterface } from './transaction-with-relations-entity-interface.type';

export interface TransactionTransferWithRelationsEntityInterface extends Omit<
    TransactionWithRelationsEntityInterface,
    TransactionAssociationEnum.TO_ACCOUNT | TransactionAssociationEnum.FROM_ACCOUNT | 'type'
> {
    [TransactionAssociationEnum.FROM_ACCOUNT]: AccountEntityInterface;
    [TransactionAssociationEnum.TO_ACCOUNT]: AccountEntityInterface;
    type: TransactionTypeEnum.TRANSFER;
}
