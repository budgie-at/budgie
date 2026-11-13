import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { InstrumentEntityTable } from '../table/instrument-entity.table';

import type { InstrumentCreateEntityInterface } from '../entity/instrument-create-entity.interface';
import type { InstrumentPriceProviderEnum } from '../enum/instrument-price-provider.enum';
import type { InstrumentTypeEnum } from '../enum/instrument-type.enum';

export class InstrumentRepository extends Context.Service<InstrumentRepository>()('@budgie/contracts/InstrumentRepository', {
    make: Effect.succeed({
        getAll: Db.query(db => db.query.InstrumentEntityTable.findMany()),
        create: (input: InstrumentCreateEntityInterface) =>
            Db.query(db => db.insert(InstrumentEntityTable).values([input]).returning()).pipe(Effect.map(([instrument]) => instrument)),
        findById: (id: number) => Db.query(db => db.query.InstrumentEntityTable.findFirst({ where: { id } })),
        findByCode: (code: string) => Db.query(db => db.query.InstrumentEntityTable.findFirst({ where: { code } })),
        findByProvider: (priceProvider: InstrumentPriceProviderEnum, providerInstrumentId: string) =>
            Db.query(db =>
                db.query.InstrumentEntityTable.findFirst({ where: { priceProvider, providerInstrumentId, deletedAt: { isNull: true } } })
            ),
        findByType: (type: InstrumentTypeEnum) => Db.query(db => db.query.InstrumentEntityTable.findMany({ where: { type } })),
        findByTypeAndPriceProviderWithProviderInstrumentId: (type: InstrumentTypeEnum, priceProvider: InstrumentPriceProviderEnum) =>
            Db.query(db =>
                db.query.InstrumentEntityTable.findMany({
                    where: { type, priceProvider, providerInstrumentId: { isNotNull: true }, deletedAt: { isNull: true } }
                })
            )
    })
}) {
    static readonly layer = Layer.effect(InstrumentRepository, InstrumentRepository.make);
}
