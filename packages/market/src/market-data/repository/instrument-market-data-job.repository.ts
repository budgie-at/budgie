import { Db, InstrumentMarketDataJobEntityTable, InstrumentMarketDataJobStatusEnum } from '@budgie/contracts';
import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray } from '@rnw-community/shared';

import type { InstrumentMarketDataJobCreateEntityInterface, InstrumentMarketDataJobEntityInterface } from '@budgie/contracts';

export class InstrumentMarketDataJobRepository extends Context.Service<InstrumentMarketDataJobRepository>()(
    '@budgie/market/InstrumentMarketDataJobRepository',
    {
        make: Effect.sync(() => {
            const buildInstrumentQuoteFilter = (instrumentId: number, quoteInstrumentId: number) =>
                ({
                    instrumentId,
                    quoteInstrumentId,
                    deletedAt: { isNull: true }
                }) as const;

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

            const buildOpenCondition = (maxAttempts: number, staleLockedBefore: Date) =>
                and(
                    isNull(InstrumentMarketDataJobEntityTable.deletedAt),
                    or(
                        buildClaimableCondition(maxAttempts, staleLockedBefore),
                        and(
                            eq(InstrumentMarketDataJobEntityTable.status, InstrumentMarketDataJobStatusEnum.RUNNING),
                            gt(InstrumentMarketDataJobEntityTable.lockedAt, staleLockedBefore)
                        )
                    )
                );

            const buildClaimOwnerCondition = (job: Pick<InstrumentMarketDataJobEntityInterface, 'id' | 'attempts'>) =>
                and(
                    eq(InstrumentMarketDataJobEntityTable.id, job.id),
                    eq(InstrumentMarketDataJobEntityTable.status, InstrumentMarketDataJobStatusEnum.RUNNING),
                    eq(InstrumentMarketDataJobEntityTable.attempts, job.attempts)
                );

            const markFinished = (
                job: Pick<InstrumentMarketDataJobEntityInterface, 'id' | 'attempts'>,
                status: InstrumentMarketDataJobStatusEnum.COMPLETED | InstrumentMarketDataJobStatusEnum.UNSUPPORTED
            ) =>
                Db.query(db =>
                    db
                        .update(InstrumentMarketDataJobEntityTable)
                        .set({ status, lockedAt: null, completedAt: new Date(), updatedAt: new Date() })
                        .where(buildClaimOwnerCondition(job))
                        .returning({ id: InstrumentMarketDataJobEntityTable.id })
                ).pipe(Effect.map(isNotEmptyArray));

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
                    const now = yield* DateTime.nowAsDate;
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
                hasOpen: (instrumentId: number, quoteInstrumentId: number, maxAttempts: number, staleLockedBefore: Date) =>
                    Db.query(db =>
                        db
                            .select({ id: InstrumentMarketDataJobEntityTable.id })
                            .from(InstrumentMarketDataJobEntityTable)
                            .where(
                                and(
                                    eq(InstrumentMarketDataJobEntityTable.instrumentId, instrumentId),
                                    eq(InstrumentMarketDataJobEntityTable.quoteInstrumentId, quoteInstrumentId),
                                    buildOpenCondition(maxAttempts, staleLockedBefore)
                                )
                            )
                            .limit(1)
                    ).pipe(Effect.map(isNotEmptyArray)),
                hasActiveForInstruments: (instrumentIds: readonly number[], maxAttempts: number, staleLockedBefore: Date) =>
                    isNotEmptyArray(instrumentIds)
                        ? Db.query(db =>
                              db
                                  .select({ id: InstrumentMarketDataJobEntityTable.id })
                                  .from(InstrumentMarketDataJobEntityTable)
                                  .where(
                                      and(
                                          inArray(InstrumentMarketDataJobEntityTable.instrumentId, [...instrumentIds]),
                                          buildOpenCondition(maxAttempts, staleLockedBefore)
                                      )
                                  )
                                  .limit(1)
                          ).pipe(Effect.map(isNotEmptyArray))
                        : Effect.succeed(false),
                markCompleted: (job: Pick<InstrumentMarketDataJobEntityInterface, 'id' | 'attempts'>) =>
                    markFinished(job, InstrumentMarketDataJobStatusEnum.COMPLETED),
                markUnsupported: (job: Pick<InstrumentMarketDataJobEntityInterface, 'id' | 'attempts'>) =>
                    markFinished(job, InstrumentMarketDataJobStatusEnum.UNSUPPORTED),
                markFailed: (job: Pick<InstrumentMarketDataJobEntityInterface, 'id' | 'attempts'>, errorMessage: string) =>
                    Db.query(db =>
                        db
                            .update(InstrumentMarketDataJobEntityTable)
                            .set({
                                status: InstrumentMarketDataJobStatusEnum.FAILED,
                                lockedAt: null,
                                lastError: errorMessage,
                                updatedAt: new Date()
                            })
                            .where(buildClaimOwnerCondition(job))
                    ).pipe(Effect.asVoid),
                findUnsupportedInstrumentIds: (quoteInstrumentId: number) =>
                    Db.query(db =>
                        db
                            .selectDistinct({ instrumentId: InstrumentMarketDataJobEntityTable.instrumentId })
                            .from(InstrumentMarketDataJobEntityTable)
                            .where(
                                and(
                                    eq(InstrumentMarketDataJobEntityTable.quoteInstrumentId, quoteInstrumentId),
                                    eq(InstrumentMarketDataJobEntityTable.status, InstrumentMarketDataJobStatusEnum.UNSUPPORTED),
                                    isNull(InstrumentMarketDataJobEntityTable.deletedAt)
                                )
                            )
                    ).pipe(Effect.map(rows => rows.map(row => row.instrumentId))),
                findLatestByInstrumentAndQuote: (instrumentId: number, quoteInstrumentId: number) =>
                    Db.query(db =>
                        db.query.InstrumentMarketDataJobEntityTable.findFirst({
                            where: buildInstrumentQuoteFilter(instrumentId, quoteInstrumentId),
                            orderBy: { updatedAt: 'desc' }
                        })
                    )
            };
        })
    }
) {
    static readonly layer = Layer.effect(InstrumentMarketDataJobRepository, InstrumentMarketDataJobRepository.make);
}
