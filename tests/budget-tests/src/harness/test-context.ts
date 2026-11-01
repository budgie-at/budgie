import { buildTestDb, makeTestPlatformLayer, TestSeedService } from '@budgie-at/test-kit';
import {
    BudgetCategoryLimitRepository,
    BudgetFundSpendService,
    BudgetLimitChangeRepository,
    BudgetPeriodCloseService,
    BudgetPeriodSnapshotRepository,
    BudgetRepository,
    BudgetService,
    BudgetSinkingFundRepository
} from '@budgie/budget';
import { StatisticsRepository } from '@budgie/contracts';
import * as Clock from 'effect/Clock';
import * as Layer from 'effect/Layer';

export const testDbHandle = await buildTestDb();

export const testDb = testDbHandle.database;

export const testSeedService = new TestSeedService(testDb);

export const TestLayer = Layer.mergeAll(
    BudgetService.layer,
    BudgetRepository.layer,
    BudgetCategoryLimitRepository.layer,
    BudgetPeriodSnapshotRepository.layer,
    BudgetPeriodCloseService.layer,
    BudgetSinkingFundRepository.layer,
    BudgetLimitChangeRepository.layer,
    BudgetFundSpendService.layer,
    StatisticsRepository.layer
).pipe(Layer.provideMerge(makeTestPlatformLayer(testDb)), Layer.provideMerge(Layer.succeed(Clock.Clock, Clock.Clock.defaultValue())));
