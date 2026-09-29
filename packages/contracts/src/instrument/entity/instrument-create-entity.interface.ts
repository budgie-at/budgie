import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { PartialByKeysType } from '../../@generic/type/partial-by-keys.type';
import type { InstrumentEntityInterface } from './instrument-entity.interface';

export type InstrumentCreateEntityInterface = PartialByKeysType<
    Omit<InstrumentEntityInterface, BaseEntityKeyType>,
    'priceProvider' | 'providerInstrumentId' | 'marketCapRank'
>;
