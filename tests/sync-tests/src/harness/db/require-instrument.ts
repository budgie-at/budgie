import { instrumentRepository } from '@app/@generic/drizzle/db/db';
import { CurrencyEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { InstrumentEntityInterface } from '@budgie/contracts';

export const requireInstrument = async (code: CurrencyEnum): Promise<InstrumentEntityInterface> => {
    const instrument = await instrumentRepository.findByCode(code);

    if (!isDefined(instrument)) {
        throw new Error(`Instrument ${code} not found`);
    }

    return instrument;
};
