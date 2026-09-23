import { Log } from '@budgie/logger';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { InstrumentPriceProviderEnum } from '../enum/instrument-price-provider.enum';
import { InstrumentTypeEnum } from '../enum/instrument-type.enum';
import { InstrumentEntityTable } from '../table/instrument-entity.table';

import type * as schema from '../../schema';
import type { InstrumentEntityInterface } from '../entity/instrument-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class InstrumentRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    @Log(
        'enter',
        result => `done codes=${result.map(instrument => instrument.code).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async getAll(): Promise<InstrumentEntityInterface[]> {
        return await this.db.query.InstrumentEntityTable.findMany();
    }

    @Log(
        id => `enter id=${id}`,
        (result, id) => `done id=${id} found=${String(isDefined(result))}`,
        (error, id) => `throw id=${id} error=${getErrorMessage(error)}`
    )
    async findByIdAsync(id: number): Promise<InstrumentEntityInterface | undefined> {
        return await this.db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.id, id) });
    }

    @Log(
        code => `enter code="${code}"`,
        (result, code) => `done code="${code}" found=${String(isDefined(result))}`,
        (error, code) => `throw code="${code}" error=${getErrorMessage(error)}`
    )
    async findByCode(code: string): Promise<InstrumentEntityInterface | undefined> {
        return await this.db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.code, code) });
    }

    @Log(
        (type, priceProvider) => `enter type=${type} priceProvider=${priceProvider}`,
        (result, type, priceProvider) =>
            `done type=${type} priceProvider=${priceProvider} codes=${result.map(instrument => instrument.code).join(',')}`,
        (error, type, priceProvider) => `throw type=${type} priceProvider=${priceProvider} error=${getErrorMessage(error)}`
    )
    async findByTypeAndPriceProviderWithProviderInstrumentId(
        type: InstrumentTypeEnum,
        priceProvider: InstrumentPriceProviderEnum
    ): Promise<InstrumentEntityInterface[]> {
        return await this.db.query.InstrumentEntityTable.findMany({
            where: and(
                eq(InstrumentEntityTable.type, type),
                eq(InstrumentEntityTable.priceProvider, priceProvider),
                isNotNull(InstrumentEntityTable.providerInstrumentId),
                isNull(InstrumentEntityTable.deletedAt)
            )
        });
    }

    findAll() {
        return this.db.query.InstrumentEntityTable.findMany();
    }

    findById(id: number) {
        return this.db.query.InstrumentEntityTable.findFirst({ where: eq(InstrumentEntityTable.id, id) });
    }

    findByType(type: InstrumentTypeEnum) {
        return this.db.query.InstrumentEntityTable.findMany({ where: eq(InstrumentEntityTable.type, type) });
    }
}
