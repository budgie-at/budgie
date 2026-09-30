import { and, eq, isNotNull, isNull } from 'drizzle-orm';

import { Db } from '../../@generic/service/db.service';
import { InstrumentEntityTable } from '../table/instrument-entity.table';

import type * as schema from '../../schema';
import type { InstrumentPriceProviderEnum } from '../enum/instrument-price-provider.enum';
import type { InstrumentTypeEnum } from '../enum/instrument-type.enum';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class InstrumentRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    readonly getAll = () => Db.query(db => db.query.InstrumentEntityTable.findMany());

    readonly findByIdAsync = (id: number) =>
        Db.query(db => db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.id, id) }));

    readonly findByCode = (code: string) =>
        Db.query(db => db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.code, code) }));

    readonly findByTypeAndPriceProviderWithProviderInstrumentId = (type: InstrumentTypeEnum, priceProvider: InstrumentPriceProviderEnum) =>
        Db.query(db =>
            db.query.InstrumentEntityTable.findMany({
                where: and(
                    eq(InstrumentEntityTable.type, type),
                    eq(InstrumentEntityTable.priceProvider, priceProvider),
                    isNotNull(InstrumentEntityTable.providerInstrumentId),
                    isNull(InstrumentEntityTable.deletedAt)
                )
            })
        );

    readonly findAll = () => Db.query(db => db.query.InstrumentEntityTable.findMany());

    findById(id: number) {
        return this.db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.id, id) });
    }

    findByType(type: InstrumentTypeEnum) {
        return this.db.query.InstrumentEntityTable.findMany({ where: eq(InstrumentEntityTable.type, type) });
    }
}
