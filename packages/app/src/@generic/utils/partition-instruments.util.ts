import { InstrumentTypeEnum } from '@budgie/contracts';

import type { InstrumentEntityInterface } from '@budgie/contracts';

const COMMON_CURRENCY_CODES = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY']);
const TOP_CRYPTO_COUNT = 8;

type PartitionableInstrument = Pick<InstrumentEntityInterface, 'id' | 'code' | 'name' | 'marketCapRank'>;

const byMarketCapRank = (first: PartitionableInstrument, second: PartitionableInstrument) =>
    (first.marketCapRank ?? Number.MAX_SAFE_INTEGER) - (second.marketCapRank ?? Number.MAX_SAFE_INTEGER);

export const partitionInstruments = <T extends PartitionableInstrument>(
    instruments: readonly T[],
    selectedId: number | undefined,
    type: InstrumentTypeEnum
) => {
    const topCrypto = new Set([...instruments].sort(byMarketCapRank).slice(0, TOP_CRYPTO_COUNT));
    const isFeatured =
        type === InstrumentTypeEnum.CRYPTO
            ? (instrument: T) => topCrypto.has(instrument)
            : (instrument: T) => COMMON_CURRENCY_CODES.has(instrument.code.toUpperCase());
    const featuredInstruments = instruments.filter(isFeatured);
    const featured = type === InstrumentTypeEnum.CRYPTO ? featuredInstruments.sort(byMarketCapRank) : featuredInstruments;
    const selected = instruments.filter(instrument => instrument.id === selectedId && !isFeatured(instrument));
    const other = instruments
        .filter(instrument => !isFeatured(instrument) && instrument.id !== selectedId)
        .sort((first, second) => first.name.localeCompare(second.name));

    return { selected, featured, other };
};
