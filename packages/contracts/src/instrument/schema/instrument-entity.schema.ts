import { number, string } from 'zod';

import { AccountEntitySchema } from '../../account/schema/account-entity.schema';
import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { INSTRUMENT_SYMBOL_MAX_LENGTH } from '../constant/instrument-symbol-max-length.constant';
import { INSTRUMENT_SYMBOL_MIN_LENGTH } from '../constant/instrument-symbol-min-length.constant';
import { InstrumentAssociationEnum } from '../enum/instrument-association.enum';

export const InstrumentEntitySchema = BaseEntitySchema.extend({
    accountId: number().describe('Id of the account associated with the instrument.'),
    symbol: string().trim().min(INSTRUMENT_SYMBOL_MIN_LENGTH).max(INSTRUMENT_SYMBOL_MAX_LENGTH).describe('Symbol of the instrument.'),

    get [InstrumentAssociationEnum.ACCOUNT]() {
        return AccountEntitySchema.describe('Account associated with the instrument.');
    }
});
