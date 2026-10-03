import { AccountEntityInterface, CategorySourceEnum, InstrumentEntityInterface } from '@budgie/contracts';

export interface ImporterRowInterface {
    toAccount: AccountEntityInterface;
    toAmount: number;
    toInstrument: InstrumentEntityInterface;
    fromAccount: AccountEntityInterface | null;
    fromAmount: number | null;
    fromInstrument: InstrumentEntityInterface | null;
    categoryId: number | null;
    categorySource: CategorySourceEnum;
    mccCategoryId: number | null;
    operatedAt: Date;
    isPlanned: boolean;
}
