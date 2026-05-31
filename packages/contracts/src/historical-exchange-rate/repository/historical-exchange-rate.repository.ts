import { SQL, and, asc, desc, eq, isNull, lte } from 'drizzle-orm';

import { HistoricalExchangeRateEntityTable } from '../table/historical-exchange-rate-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { HistoricalExchangeRateCreateEntityInterface } from '../entity/historical-exchange-rate-create-entity.interface';
import type { HistoricalExchangeRateEntityInterface } from '../entity/historical-exchange-rate-entity.interface';

export class HistoricalExchangeRateRepository {
    constructor(private db: DB) {}

    async findForDateOrBefore(
        sourceInstrumentId: number,
        targetInstrumentId: number,
        rateDate: string,
        tx?: DB
    ): Promise<HistoricalExchangeRateEntityInterface | undefined> {
        const where = and(
            this.buildPairCondition(sourceInstrumentId, targetInstrumentId),
            lte(HistoricalExchangeRateEntityTable.rateDate, rateDate)
        );

        return await this.findFirstRate(where, desc(HistoricalExchangeRateEntityTable.rateDate), tx);
    }

    async findEarliest(
        sourceInstrumentId: number,
        targetInstrumentId: number,
        tx?: DB
    ): Promise<HistoricalExchangeRateEntityInterface | undefined> {
        const where = this.buildPairCondition(sourceInstrumentId, targetInstrumentId);

        return await this.findFirstRate(where, asc(HistoricalExchangeRateEntityTable.rateDate), tx);
    }

    async upsert(input: HistoricalExchangeRateCreateEntityInterface, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .insert(HistoricalExchangeRateEntityTable)
            .values(input)
            .onConflictDoUpdate({
                target: [
                    HistoricalExchangeRateEntityTable.sourceInstrumentId,
                    HistoricalExchangeRateEntityTable.targetInstrumentId,
                    HistoricalExchangeRateEntityTable.rateDate
                ],
                set: {
                    rate: input.rate,
                    updatedAt: new Date()
                }
            });
    }

    private buildPairCondition(sourceInstrumentId: number, targetInstrumentId: number): SQL | undefined {
        return and(
            eq(HistoricalExchangeRateEntityTable.sourceInstrumentId, sourceInstrumentId),
            eq(HistoricalExchangeRateEntityTable.targetInstrumentId, targetInstrumentId),
            isNull(HistoricalExchangeRateEntityTable.deletedAt)
        );
    }

    private async findFirstRate(
        where: SQL | undefined,
        order: SQL,
        tx?: DB
    ): Promise<HistoricalExchangeRateEntityInterface | undefined> {
        return await (tx ?? this.db).query.HistoricalExchangeRateEntityTable.findFirst({ where, orderBy: order });
    }
}
