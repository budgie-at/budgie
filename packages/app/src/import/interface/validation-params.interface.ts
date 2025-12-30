import { AccountEntityInterface, CategoryEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

import { NormalizedRowType } from '../type/normalized-row.type';

export interface ValidationParamsInterface {
    normalizedRow: NormalizedRowType;
    toAccount?: AccountEntityInterface;
    category?: CategoryEntityInterface;
    operatedAt: Date;
    toAmount: number;
    toInstrument?: InstrumentEntityInterface;
    fromInstrument?: InstrumentEntityInterface;
    fromAmount?: number;
    isPlanned?: boolean;
}
