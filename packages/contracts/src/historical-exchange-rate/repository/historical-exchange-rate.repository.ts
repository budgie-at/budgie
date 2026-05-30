import { and, desc, eq, isNull, lte } from 'drizzle-orm';

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
        return await (tx ?? this.db).query.HistoricalExchangeRateEntityTable.findFirst({
            where: and(
                eq(HistoricalExchangeRateEntityTable.sourceInstrumentId, sourceInstrumentId),
                eq(HistoricalExchangeRateEntityTable.targetInstrumentId, targetInstrumentId),
                lte(HistoricalExchangeRateEntityTable.rateDate, rateDate),
                isNull(HistoricalExchangeRateEntityTable.deletedAt)
            ),
            orderBy: desc(HistoricalExchangeRateEntityTable.rateDate)
        });
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
}
