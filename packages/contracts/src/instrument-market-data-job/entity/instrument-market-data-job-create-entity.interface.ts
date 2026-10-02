import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { PartialByKeysType } from '../../@generic/type/partial-by-keys.type';
import type { InstrumentMarketDataJobEntityInterface } from './instrument-market-data-job-entity.interface';

export type InstrumentMarketDataJobCreateEntityInterface = PartialByKeysType<
    Omit<InstrumentMarketDataJobEntityInterface, BaseEntityKeyType>,
    'status' | 'priority' | 'attempts' | 'lockedAt' | 'completedAt' | 'lastError'
>;
