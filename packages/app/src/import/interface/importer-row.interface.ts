import { AccountEntityInterface, CategoryEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

export interface ImporterRowInterface {
    toAccount: AccountEntityInterface;
    fromAccount: AccountEntityInterface | null;
    category: CategoryEntityInterface;
    amount: number;
    operatedAt: Date;
    fromInstrument: InstrumentEntityInterface;
    toInstrument: InstrumentEntityInterface;
}
