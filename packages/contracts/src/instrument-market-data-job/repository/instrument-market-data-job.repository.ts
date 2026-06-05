import { Log } from '@budgie/logger';
import { and, asc, desc, eq, inArray, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { InstrumentMarketDataJobStatusEnum } from '../enum/instrument-market-data-job-status.enum';
import { InstrumentMarketDataJobEntityTable } from '../table/instrument-market-data-job-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { InstrumentMarketDataJobCreateEntityInterface } from '../entity/instrument-market-data-job-create-entity.interface';
import type { InstrumentMarketDataJobEntityInterface } from '../entity/instrument-market-data-job-entity.interface';

export class InstrumentMarketDataJobRepository {
    constructor(private db: DB) {}

    @Log(
        (inputs, tx) =>
            `enter instrumentIds=${inputs.map(input => input.instrumentId).join(',')} quoteInstrumentIds=${inputs.map(input => input.quoteInstrumentId).join(',')} fromDates=${inputs.map(input => input.fromDate).join(',')} toDates=${inputs.map(input => input.toDate).join(',')} hasTx=${String(isDefined(tx))}`,
        (_result, inputs, tx) =>
            `done instrumentIds=${inputs.map(input => input.instrumentId).join(',')} quoteInstrumentIds=${inputs.map(input => input.quoteInstrumentId).join(',')} fromDates=${inputs.map(input => input.fromDate).join(',')} toDates=${inputs.map(input => input.toDate).join(',')} hasTx=${String(isDefined(tx))}`,
        (error, inputs, tx) =>
            `throw instrumentIds=${inputs.map(input => input.instrumentId).join(',')} quoteInstrumentIds=${inputs.map(input => input.quoteInstrumentId).join(',')} fromDates=${inputs.map(input => input.fromDate).join(',')} toDates=${inputs.map(input => input.toDate).join(',')} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async enqueueMany(inputs: InstrumentMarketDataJobCreateEntityInterface[], tx?: DB): Promise<void> {
        if (!isNotEmptyArray(inputs)) {
            return;
        }

        await (tx ?? this.db)
            .insert(InstrumentMarketDataJobEntityTable)
            .values(inputs)
            .onConflictDoNothing({
                target: [
                    InstrumentMarketDataJobEntityTable.instrumentId,
                    InstrumentMarketDataJobEntityTable.quoteInstrumentId,
                    InstrumentMarketDataJobEntityTable.fromDate,
                    InstrumentMarketDataJobEntityTable.toDate
                ]
            });
    }

    @Log(
        (maxAttempts, staleLockedBefore) => `enter maxAttempts=${maxAttempts} staleLockedBefore=${staleLockedBefore.toISOString()}`,
        (result, maxAttempts, staleLockedBefore) =>
            `done maxAttempts=${maxAttempts} staleLockedBefore=${staleLockedBefore.toISOString()} jobId=${String(result?.id)}`,
        (error, maxAttempts, staleLockedBefore) =>
            `throw maxAttempts=${maxAttempts} staleLockedBefore=${staleLockedBefore.toISOString()} error=${getErrorMessage(error)}`
    )
    async findNext(maxAttempts: number, staleLockedBefore: Date): Promise<InstrumentMarketDataJobEntityInterface | undefined> {
        return await this.db.query.InstrumentMarketDataJobEntityTable.findFirst({
            where: and(
                or(
                    inArray(InstrumentMarketDataJobEntityTable.status, [
                        InstrumentMarketDataJobStatusEnum.PENDING,
                        InstrumentMarketDataJobStatusEnum.FAILED
                    ]),
                    and(
                        eq(InstrumentMarketDataJobEntityTable.status, InstrumentMarketDataJobStatusEnum.RUNNING),
                        isNotNull(InstrumentMarketDataJobEntityTable.lockedAt),
                        lte(InstrumentMarketDataJobEntityTable.lockedAt, staleLockedBefore)
                    )
                ),
                sql`${InstrumentMarketDataJobEntityTable.attempts} < ${maxAttempts}`,
                isNull(InstrumentMarketDataJobEntityTable.deletedAt)
            ),
            orderBy: [desc(InstrumentMarketDataJobEntityTable.priority), asc(InstrumentMarketDataJobEntityTable.updatedAt)]
        });
    }

    @Log(
        (instrumentId, quoteInstrumentId, tx) =>
            `enter instrumentId=${instrumentId} quoteInstrumentId=${quoteInstrumentId} hasTx=${String(isDefined(tx))}`,
        (result, instrumentId, quoteInstrumentId, tx) =>
            `done instrumentId=${instrumentId} quoteInstrumentId=${quoteInstrumentId} hasTx=${String(isDefined(tx))} hasOpenJob=${String(result)}`,
        (error, instrumentId, quoteInstrumentId, tx) =>
            `throw instrumentId=${instrumentId} quoteInstrumentId=${quoteInstrumentId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async hasOpen(instrumentId: number, quoteInstrumentId: number, tx?: DB): Promise<boolean> {
        const job = await (tx ?? this.db).query.InstrumentMarketDataJobEntityTable.findFirst({
            where: and(
                eq(InstrumentMarketDataJobEntityTable.instrumentId, instrumentId),
                eq(InstrumentMarketDataJobEntityTable.quoteInstrumentId, quoteInstrumentId),
                inArray(InstrumentMarketDataJobEntityTable.status, [
                    InstrumentMarketDataJobStatusEnum.PENDING,
                    InstrumentMarketDataJobStatusEnum.RUNNING,
                    InstrumentMarketDataJobStatusEnum.FAILED
                ]),
                isNull(InstrumentMarketDataJobEntityTable.deletedAt)
            )
        });

        return isDefined(job);
    }

    @Log(
        (jobId, tx) => `enter jobId=${jobId} hasTx=${String(isDefined(tx))}`,
        (_result, jobId, tx) => `done jobId=${jobId} hasTx=${String(isDefined(tx))}`,
        (error, jobId, tx) => `throw jobId=${jobId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async markRunning(jobId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(InstrumentMarketDataJobEntityTable)
            .set({
                status: InstrumentMarketDataJobStatusEnum.RUNNING,
                attempts: sql`${InstrumentMarketDataJobEntityTable.attempts} + 1`,
                lockedAt: new Date(),
                lastError: null,
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(InstrumentMarketDataJobEntityTable.id, jobId),
                    or(
                        eq(InstrumentMarketDataJobEntityTable.status, InstrumentMarketDataJobStatusEnum.PENDING),
                        eq(InstrumentMarketDataJobEntityTable.status, InstrumentMarketDataJobStatusEnum.FAILED),
                        eq(InstrumentMarketDataJobEntityTable.status, InstrumentMarketDataJobStatusEnum.RUNNING)
                    )
                )
            );
    }

    @Log(
        (jobId, tx) => `enter jobId=${jobId} hasTx=${String(isDefined(tx))}`,
        (_result, jobId, tx) => `done jobId=${jobId} hasTx=${String(isDefined(tx))}`,
        (error, jobId, tx) => `throw jobId=${jobId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async markCompleted(jobId: number, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(InstrumentMarketDataJobEntityTable)
            .set({
                status: InstrumentMarketDataJobStatusEnum.COMPLETED,
                lockedAt: null,
                completedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(InstrumentMarketDataJobEntityTable.id, jobId));
    }

    @Log(
        (jobId, errorMessage, tx) => `enter jobId=${jobId} errorMessage="${errorMessage}" hasTx=${String(isDefined(tx))}`,
        (_result, jobId, errorMessage, tx) => `done jobId=${jobId} errorMessage="${errorMessage}" hasTx=${String(isDefined(tx))}`,
        (error, jobId, errorMessage, tx) =>
            `throw jobId=${jobId} errorMessage="${errorMessage}" hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async markFailed(jobId: number, errorMessage: string, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(InstrumentMarketDataJobEntityTable)
            .set({
                status: InstrumentMarketDataJobStatusEnum.FAILED,
                lockedAt: null,
                lastError: errorMessage,
                updatedAt: new Date()
            })
            .where(eq(InstrumentMarketDataJobEntityTable.id, jobId));
    }

    findLatestByInstrumentAndQuote(instrumentId: number, quoteInstrumentId: number) {
        return this.db.query.InstrumentMarketDataJobEntityTable.findFirst({
            where: and(
                eq(InstrumentMarketDataJobEntityTable.instrumentId, instrumentId),
                eq(InstrumentMarketDataJobEntityTable.quoteInstrumentId, quoteInstrumentId),
                isNull(InstrumentMarketDataJobEntityTable.deletedAt)
            ),
            orderBy: desc(InstrumentMarketDataJobEntityTable.updatedAt)
        });
    }
}
