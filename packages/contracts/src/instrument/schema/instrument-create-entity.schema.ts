import { InstrumentEntitySchema } from './instrument-entity.schema';

export const InstrumentCreateEntitySchema = InstrumentEntitySchema.pick({ accountId: true, symbol: true });
