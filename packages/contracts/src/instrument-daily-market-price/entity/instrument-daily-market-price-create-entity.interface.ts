import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { InstrumentDailyMarketPriceEntityInterface } from './instrument-daily-market-price-entity.interface';

export type InstrumentDailyMarketPriceCreateEntityInterface = Omit<InstrumentDailyMarketPriceEntityInterface, BaseEntityKeyType>;
