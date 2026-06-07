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
        (maxAttempts, staleLockedBefore, tx) =>
            `enter maxAttempts=${maxAttempts} staleLockedBefore=${staleLockedBefore.toISOString()} hasTx=${String(isDefined(tx))}`,
        (result, maxAttempts, staleLockedBefore, tx) =>
            `done maxAttempts=${maxAttempts} staleLockedBefore=${staleLockedBefore.toISOString()} hasTx=${String(isDefined(tx))} jobId=${String(result?.id)}`,
        (error, maxAttempts, staleLockedBefore, tx) =>
            `throw maxAttempts=${maxAttempts} staleLockedBefore=${staleLockedBefore.toISOString()} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async claimNext(maxAttempts: number, staleLockedBefore: Date, tx?: DB): Promise<InstrumentMarketDataJobEntityInterface | undefined> {
        const now = new Date();
        const db = tx ?? this.db;
        const nextJobQuery = db
            .select({ id: InstrumentMarketDataJobEntityTable.id })
            .from(InstrumentMarketDataJobEntityTable)
            .where(this.buildClaimableCondition(maxAttempts, staleLockedBefore))
            .orderBy(desc(InstrumentMarketDataJobEntityTable.priority), asc(InstrumentMarketDataJobEntityTable.updatedAt))
            .limit(1);
        const [job] = await db
            .update(InstrumentMarketDataJobEntityTable)
            .set({
                status: InstrumentMarketDataJobStatusEnum.RUNNING,
                attempts: sql`${InstrumentMarketDataJobEntityTable.attempts} + 1`,
                lockedAt: now,
                lastError: null,
                updatedAt: now
            })
            .where(inArray(InstrumentMarketDataJobEntityTable.id, nextJobQuery))
            .returning();

        return job;
    }

    @Log(
        (instrumentId, quoteInstrumentId, tx) =>
            `enter lookup=open-job instrumentId=${instrumentId} quoteInstrumentId=${quoteInstrumentId} hasTx=${String(isDefined(tx))}`,
        (result, instrumentId, quoteInstrumentId, tx) =>
            `done lookup=open-job instrumentId=${instrumentId} quoteInstrumentId=${quoteInstrumentId} hasTx=${String(isDefined(tx))} hasOpenJob=${String(result)}`,
        (error, instrumentId, quoteInstrumentId, tx) =>
            `throw lookup=open-job instrumentId=${instrumentId} quoteInstrumentId=${quoteInstrumentId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async hasOpen(instrumentId: number, quoteInstrumentId: number, tx?: DB): Promise<boolean> {
        const job = await (tx ?? this.db).query.InstrumentMarketDataJobEntityTable.findFirst({
            where: this.buildOpenInstrumentQuoteCondition(instrumentId, quoteInstrumentId)
        });

        return isDefined(job);
    }

    @Log(
        (jobId, tx) => `enter transition=completed jobId=${jobId} hasTx=${String(isDefined(tx))}`,
        (_result, jobId, tx) => `done transition=completed jobId=${jobId} hasTx=${String(isDefined(tx))}`,
        (error, jobId, tx) => `throw transition=completed jobId=${jobId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
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

    @Log(
        (instrumentId, quoteInstrumentId, tx) =>
            `enter lookup=latest-job instrumentId=${instrumentId} quoteInstrumentId=${quoteInstrumentId} hasTx=${String(isDefined(tx))}`,
        (result, instrumentId, quoteInstrumentId, tx) =>
            `done lookup=latest-job instrumentId=${instrumentId} quoteInstrumentId=${quoteInstrumentId} hasTx=${String(isDefined(tx))} queryBuilt=${String(isDefined(result))}`,
        (error, instrumentId, quoteInstrumentId, tx) =>
            `throw lookup=latest-job instrumentId=${instrumentId} quoteInstrumentId=${quoteInstrumentId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    findLatestByInstrumentAndQuote(instrumentId: number, quoteInstrumentId: number, tx?: DB) {
        return (tx ?? this.db).query.InstrumentMarketDataJobEntityTable.findFirst({
            where: this.buildInstrumentQuoteCondition(instrumentId, quoteInstrumentId),
            orderBy: desc(InstrumentMarketDataJobEntityTable.updatedAt)
        });
    }

    private buildClaimableCondition(maxAttempts: number, staleLockedBefore: Date) {
        return and(
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
        );
    }

    private buildOpenInstrumentQuoteCondition(instrumentId: number, quoteInstrumentId: number) {
        return and(
            this.buildInstrumentQuoteCondition(instrumentId, quoteInstrumentId),
            inArray(InstrumentMarketDataJobEntityTable.status, [
                InstrumentMarketDataJobStatusEnum.PENDING,
                InstrumentMarketDataJobStatusEnum.RUNNING,
                InstrumentMarketDataJobStatusEnum.FAILED
            ])
        );
    }

    private buildInstrumentQuoteCondition(instrumentId: number, quoteInstrumentId: number) {
        return and(
            eq(InstrumentMarketDataJobEntityTable.instrumentId, instrumentId),
            eq(InstrumentMarketDataJobEntityTable.quoteInstrumentId, quoteInstrumentId),
            isNull(InstrumentMarketDataJobEntityTable.deletedAt)
        );
    }
}
