import { InstrumentTypeEnum } from '@budgie/contracts';

import type { InstrumentEntityInterface } from '@budgie/contracts';

const COMMON_CURRENCY_CODES = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY']);
const TOP_CRYPTO_COUNT = 8;

type PartitionableInstrument = Pick<InstrumentEntityInterface, 'id' | 'code' | 'name'>;

export const partitionInstruments = <T extends PartitionableInstrument>(
    instruments: readonly T[],
    selectedId: number | undefined,
    type: InstrumentTypeEnum
) => {
    const isFeatured =
        type === InstrumentTypeEnum.CRYPTO
            ? (instrument: T) => instruments.indexOf(instrument) < TOP_CRYPTO_COUNT
            : (instrument: T) => COMMON_CURRENCY_CODES.has(instrument.code.toUpperCase());
    const featured = instruments.filter(isFeatured);
    const selected = instruments.filter(instrument => instrument.id === selectedId && !isFeatured(instrument));
    const remaining = instruments.filter(instrument => !isFeatured(instrument) && instrument.id !== selectedId);
    const other =
        type === InstrumentTypeEnum.CRYPTO ? remaining : [...remaining].sort((first, second) => first.name.localeCompare(second.name));

    return { selected, featured, other };
};
