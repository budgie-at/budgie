import type { InstrumentEntityInterface } from '@budgie/contracts';

export type YieldPricedInstrumentType = Pick<InstrumentEntityInterface, 'id' | 'code' | 'type'>;
