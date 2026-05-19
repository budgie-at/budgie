import { AccountEntityInterface, CategoryEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

export interface ImporterRowInterface {
    toAccount: AccountEntityInterface;
    toAmount: number;
    toInstrument: InstrumentEntityInterface;
    fromAccount: AccountEntityInterface | null;
    fromAmount: number | null;
    fromInstrument: InstrumentEntityInterface | null;
    category: CategoryEntityInterface;
    operatedAt: Date;
    isPlanned: boolean;
    mccCategoryId: number | null;
}
