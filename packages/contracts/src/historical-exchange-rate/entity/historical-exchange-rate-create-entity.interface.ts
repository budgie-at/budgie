import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { HistoricalExchangeRateEntityInterface } from './historical-exchange-rate-entity.interface';

export type HistoricalExchangeRateCreateEntityInterface = Omit<HistoricalExchangeRateEntityInterface, BaseEntityKeyType>;
