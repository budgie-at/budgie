import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { Db } from '../../@generic/service/db.service';
import { InstrumentEntityTable } from '../table/instrument-entity.table';

import type * as schema from '../../schema';
import type { InstrumentPriceProviderEnum } from '../enum/instrument-price-provider.enum';
import type { InstrumentTypeEnum } from '../enum/instrument-type.enum';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class InstrumentRepository {
    readonly getAll = Effect.fn('InstrumentRepository.getAll')(function* () {
        return yield* Db.query(db => db.query.InstrumentEntityTable.findMany());
    });

    readonly findByIdAsync = Effect.fn('InstrumentRepository.findByIdAsync')(function* (id: number) {
        return yield* Db.query(db => db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.id, id) }));
    });

    readonly findByCode = Effect.fn('InstrumentRepository.findByCode')(function* (code: string) {
        return yield* Db.query(db => db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.code, code) }));
    });

    readonly findByTypeAndPriceProviderWithProviderInstrumentId = Effect.fn(
        'InstrumentRepository.findByTypeAndPriceProviderWithProviderInstrumentId'
    )(function* (type: InstrumentTypeEnum, priceProvider: InstrumentPriceProviderEnum) {
        return yield* Db.query(db =>
            db.query.InstrumentEntityTable.findMany({
                where: and(
                    eq(InstrumentEntityTable.type, type),
                    eq(InstrumentEntityTable.priceProvider, priceProvider),
                    isNotNull(InstrumentEntityTable.providerInstrumentId),
                    isNull(InstrumentEntityTable.deletedAt)
                )
            })
        );
    });

    readonly findAll = Effect.fn('InstrumentRepository.findAll')(function* () {
        return yield* Db.query(db => db.query.InstrumentEntityTable.findMany());
    });

    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findById(id: number) {
        return this.db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.id, id) });
    }

    findByType(type: InstrumentTypeEnum) {
        return this.db.query.InstrumentEntityTable.findMany({ where: eq(InstrumentEntityTable.type, type) });
    }
}
