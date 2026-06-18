import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { InstrumentPriceProviderEnum } from '../enum/instrument-price-provider.enum';
import { InstrumentTypeEnum } from '../enum/instrument-type.enum';

export const InstrumentEntityTable = sqliteTable(
    'instruments',
    withBaseEntityTableColumns({
        type: text('type', { enum: convertEnumToDrizzleEnum(InstrumentTypeEnum) })
            .$type<InstrumentTypeEnum>()
            .notNull(),
        code: text('code').notNull(),
        name: text('name').notNull(),
        symbol: text('symbol').notNull(),
        priceProvider: text('price_provider', {
            enum: convertEnumToDrizzleEnum(InstrumentPriceProviderEnum)
        }).$type<InstrumentPriceProviderEnum>(),
        providerInstrumentId: text('provider_instrument_id'),
        marketCapRank: int('market_cap_rank', { mode: 'number' })
    })
);
