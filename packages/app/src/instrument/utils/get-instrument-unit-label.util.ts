import { isListedSecurityType } from './is-listed-security-type.util';

import type { InstrumentEntityInterface } from '@budgie/contracts';

export const getInstrumentUnitLabel = (instrument: Pick<InstrumentEntityInterface, 'code' | 'symbol' | 'type'>): string =>
    isListedSecurityType(instrument.type) ? instrument.symbol : instrument.code;
