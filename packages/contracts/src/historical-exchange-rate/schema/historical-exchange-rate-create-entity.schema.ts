import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { HistoricalExchangeRateEntitySchema } from './historical-exchange-rate-entity.schema';

export const HistoricalExchangeRateCreateEntitySchema = convertToCreateEntitySchema(HistoricalExchangeRateEntitySchema);
