import { and, asc, desc, eq, inArray, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { InstrumentMarketDataJobStatusEnum } from '../enum/instrument-market-data-job-status.enum';
import { InstrumentMarketDataJobEntityTable } from '../table/instrument-market-data-job-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { InstrumentMarketDataJobCreateEntityInterface } from '../entity/instrument-market-data-job-create-entity.interface';

export class InstrumentMarketDataJobRepository {
    readonly enqueueMany = Effect.fn('InstrumentMarketDataJobRepository.enqueueMany')(function* (
        inputs: InstrumentMarketDataJobCreateEntityInterface[]
    ) {
        if (!isNotEmptyArray(inputs)) {
            return;
        }

        yield* Db.query(db =>
            db
                .insert(InstrumentMarketDataJobEntityTable)
                .values(inputs)
                .onConflictDoNothing({
                    target: [
                        InstrumentMarketDataJobEntityTable.instrumentId,
                        InstrumentMarketDataJobEntityTable.quoteInstrumentId,
                        InstrumentMarketDataJobEntityTable.fromDate,
                        InstrumentMarketDataJobEntityTable.toDate
                    ]
                })
        );
    });

    readonly claimNext = Effect.fn('InstrumentMarketDataJobRepository.claimNext')(function* (
        this: InstrumentMarketDataJobRepository,
        maxAttempts: number,
        staleLockedBefore: Date
    ) {
        const now = new Date();
        const jobs = yield* Db.query(db => {
            const nextJobQuery = db
                .select({ id: InstrumentMarketDataJobEntityTable.id })
                .from(InstrumentMarketDataJobEntityTable)
                .where(this.buildClaimableCondition(maxAttempts, staleLockedBefore))
                .orderBy(desc(InstrumentMarketDataJobEntityTable.priority), asc(InstrumentMarketDataJobEntityTable.updatedAt))
                .limit(1);

            return db
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
        });

        return jobs.at(0);
    });

    readonly hasOpen = Effect.fn('InstrumentMarketDataJobRepository.hasOpen')(function* (
        this: InstrumentMarketDataJobRepository,
        instrumentId: number,
        quoteInstrumentId: number
    ) {
        const job = yield* Db.query(db =>
            db.query.InstrumentMarketDataJobEntityTable.findFirst({
                where: this.buildOpenInstrumentQuoteCondition(instrumentId, quoteInstrumentId)
            })
        );

        return isDefined(job);
    });

    readonly markCompleted = Effect.fn('InstrumentMarketDataJobRepository.markCompleted')(function* (jobId: number) {
        yield* Db.query(db =>
            db
                .update(InstrumentMarketDataJobEntityTable)
                .set({
                    status: InstrumentMarketDataJobStatusEnum.COMPLETED,
                    lockedAt: null,
                    completedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(InstrumentMarketDataJobEntityTable.id, jobId))
        );
    });

    readonly markFailed = Effect.fn('InstrumentMarketDataJobRepository.markFailed')(function* (jobId: number, errorMessage: string) {
        yield* Db.query(db =>
            db
                .update(InstrumentMarketDataJobEntityTable)
                .set({
                    status: InstrumentMarketDataJobStatusEnum.FAILED,
                    lockedAt: null,
                    lastError: errorMessage,
                    updatedAt: new Date()
                })
                .where(eq(InstrumentMarketDataJobEntityTable.id, jobId))
        );
    });

    constructor(private db: DB) {}

    findLatestByInstrumentAndQuote(instrumentId: number, quoteInstrumentId: number) {
        return this.db.query.InstrumentMarketDataJobEntityTable.findFirst({
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
