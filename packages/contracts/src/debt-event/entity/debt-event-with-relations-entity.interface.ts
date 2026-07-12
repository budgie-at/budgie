import { AccountEntityInterface } from '../../account/entity/account-entity.interface';
import { TransactionEntityInterface } from '../../transaction/entity/transaction-entity.interface';
import { TransactionEntryEntityInterface } from '../../transaction-entry/entity/transaction-entry-entity.interface';
import { DebtEventAssociationEnum } from '../enum/debt-event-association.enum';

import { DebtEventEntityInterface } from './debt-event-entity.interface';

export interface DebtEventWithRelationsEntityInterface extends DebtEventEntityInterface {
    readonly [DebtEventAssociationEnum.DEBT_ACCOUNT]: AccountEntityInterface;
    readonly [DebtEventAssociationEnum.TRANSACTION]?: TransactionEntityInterface | null;
    readonly [DebtEventAssociationEnum.TRANSACTION_ENTRY]?: TransactionEntryEntityInterface | null;
}
