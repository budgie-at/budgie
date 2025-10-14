import { HoldingEntitySchema } from './holding-entity.schema';

export const HoldingCreateEntitySchema = HoldingEntitySchema.pick({ instrumentId: true, quantity: true });
