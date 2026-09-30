import { and, asc, desc, eq, inArray, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../@generic/service/db.service';
import { InstrumentMarketDataJobStatusEnum } from '../enum/instrument-market-data-job-status.enum';
import { InstrumentMarketDataJobEntityTable } from '../table/instrument-market-data-job-entity.table';

import type { InstrumentMarketDataJobCreateEntityInterface } from '../entity/instrument-market-data-job-create-entity.interface';

export class InstrumentMarketDataJobRepository extends Context.Service<InstrumentMarketDataJobRepository>()(
    '@budgie/contracts/InstrumentMarketDataJobRepository',
    {
        make: Effect.sync(() => {
            const buildInstrumentQuoteCondition = (instrumentId: number, quoteInstrumentId: number) =>
                and(
                    eq(InstrumentMarketDataJobEntityTable.instrumentId, instrumentId),
                    eq(InstrumentMarketDataJobEntityTable.quoteInstrumentId, quoteInstrumentId),
                    isNull(InstrumentMarketDataJobEntityTable.deletedAt)
                );

            const buildClaimableCondition = (maxAttempts: number, staleLockedBefore: Date) =>
                and(
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

            const buildOpenInstrumentQuoteCondition = (instrumentId: number, quoteInstrumentId: number) =>
                and(
                    buildInstrumentQuoteCondition(instrumentId, quoteInstrumentId),
                    inArray(InstrumentMarketDataJobEntityTable.status, [
                        InstrumentMarketDataJobStatusEnum.PENDING,
                        InstrumentMarketDataJobStatusEnum.RUNNING,
                        InstrumentMarketDataJobStatusEnum.FAILED
                    ])
                );

            return {
                enqueueMany: Effect.fn('InstrumentMarketDataJobRepository.enqueueMany')(function* (
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
                }),
                claimNext: Effect.fn('InstrumentMarketDataJobRepository.claimNext')(function* (
                    maxAttempts: number,
                    staleLockedBefore: Date
                ) {
                    const now = new Date();
                    const jobs = yield* Db.query(db => {
                        const nextJobQuery = db
                            .select({ id: InstrumentMarketDataJobEntityTable.id })
                            .from(InstrumentMarketDataJobEntityTable)
                            .where(buildClaimableCondition(maxAttempts, staleLockedBefore))
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
                }),
                hasOpen: (instrumentId: number, quoteInstrumentId: number) =>
                    Db.query(db =>
                        db.query.InstrumentMarketDataJobEntityTable.findFirst({
                            where: buildOpenInstrumentQuoteCondition(instrumentId, quoteInstrumentId)
                        })
                    ).pipe(Effect.map(isDefined)),
                markCompleted: (jobId: number) =>
                    Db.query(db =>
                        db
                            .update(InstrumentMarketDataJobEntityTable)
                            .set({
                                status: InstrumentMarketDataJobStatusEnum.COMPLETED,
                                lockedAt: null,
                                completedAt: new Date(),
                                updatedAt: new Date()
                            })
                            .where(eq(InstrumentMarketDataJobEntityTable.id, jobId))
                    ),
                markFailed: (jobId: number, errorMessage: string) =>
                    Db.query(db =>
                        db
                            .update(InstrumentMarketDataJobEntityTable)
                            .set({
                                status: InstrumentMarketDataJobStatusEnum.FAILED,
                                lockedAt: null,
                                lastError: errorMessage,
                                updatedAt: new Date()
                            })
                            .where(eq(InstrumentMarketDataJobEntityTable.id, jobId))
                    ).pipe(Effect.asVoid),
                findLatestByInstrumentAndQuote: (instrumentId: number, quoteInstrumentId: number) =>
                    Db.query(db =>
                        db.query.InstrumentMarketDataJobEntityTable.findFirst({
                            where: buildInstrumentQuoteCondition(instrumentId, quoteInstrumentId),
                            orderBy: desc(InstrumentMarketDataJobEntityTable.updatedAt)
                        })
                    )
            };
        })
    }
) {
    static readonly layer = Layer.effect(InstrumentMarketDataJobRepository, InstrumentMarketDataJobRepository.make);
}
