import { number } from 'zod';

import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { InstrumentEntitySchema } from '../../instrument/schema/instrument-entity.schema';
import { HoldingAssociationEnum } from '../enum/holding-association.enum';

export const HoldingEntitySchema = BaseEntitySchema.extend({
    instrumentId: number().describe('Id of the instrument associated with the holding.'),
    quantity: number().nonnegative().describe('Quantity of the holding.'),

    get [HoldingAssociationEnum.INSTRUMENT]() {
        return InstrumentEntitySchema.describe('Instrument associated with the holding.');
    }
});
