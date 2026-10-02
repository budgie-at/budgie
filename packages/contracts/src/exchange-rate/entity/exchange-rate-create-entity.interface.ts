import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { ExchangeRateEntityInterface } from './exchange-rate-entity.interface';

export type ExchangeRateCreateEntityInterface = Omit<ExchangeRateEntityInterface, BaseEntityKeyType>;
