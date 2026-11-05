import { buildTestDb, makeTestPlatformLayer, TestSeedService } from '@budgie-at/test-kit';
import { Db, RecurringSeriesEntityTable, RecurringSeriesKindEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { RecurringRefreshService, RecurringService } from '../src/index';
import { RecurringRepository } from '../src/repository/recurring.repository';

import type { RecurringSeriesUserStateEnum } from '@budgie/contracts';

export const testDbHandle = await buildTestDb();

export const testDb = testDbHandle.database;

export const testSeedService = new TestSeedService(testDb);

export const TestLayer = Layer.mergeAll(RecurringService.layer, RecurringRefreshService.layer, RecurringRepository.layer).pipe(
    Layer.provideMerge(makeTestPlatformLayer(testDb))
);

export const detectAt = (now: Date) =>
    Effect.flatMap(RecurringRefreshService, refresh => refresh.refresh(now)).pipe(
        Effect.provide(Layer.fresh(RecurringRefreshService.layer))
    );

export const setUserState = (seriesId: number, userState: RecurringSeriesUserStateEnum) =>
    Effect.flatMap(RecurringService, service => service.restoreUserState(seriesId, userState));

export const renameSeries = (seriesId: number, title: string) =>
    Db.query(database => database.update(RecurringSeriesEntityTable).set({ title }).where(eq(RecurringSeriesEntityTable.id, seriesId)));

export const findSeries = (kind: RecurringSeriesKindEnum = RecurringSeriesKindEnum.EXPENSE) =>
    Effect.map(
        Effect.flatMap(RecurringRepository, repository => repository.findAllSeries()),
        rows => rows.filter(row => row.kind === kind)
    );
