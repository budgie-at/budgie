import { AccountEntityInterface } from '../../account/entity/account-entity.interface';
import { CategoryEntityInterface } from '../../category/entity/category-entity.interface';
import { InstrumentEntityInterface } from '../../instrument/entity/instrument-entity.interface';

export interface ImporterRowInterface {
    toAccount: AccountEntityInterface;
    toAmount: number;
    toInstrument: InstrumentEntityInterface;
    fromAccount: AccountEntityInterface | null;
    fromAmount: number | null;
    fromInstrument: InstrumentEntityInterface | null;
    category: CategoryEntityInterface;
    operatedAt: Date;
}
