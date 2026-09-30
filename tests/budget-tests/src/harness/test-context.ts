import { buildTestDb, makeTestPlatformLayer, TestSeedService } from '@budgie-at/test-kit';
import {
    BudgetAlertThresholdService,
    BudgetCategoryLimitRepository,
    BudgetRepository,
    BudgetService,
    BudgetSpentService,
    BudgetTemplateService
} from '@budgie/budget';
import { StatisticsRepository } from '@budgie/contracts';
import * as Clock from 'effect/Clock';
import * as Layer from 'effect/Layer';

export const testDb = buildTestDb();

export const testSeedService = new TestSeedService(testDb);

export const TestLayer = Layer.mergeAll(
    BudgetService.layer,
    BudgetRepository.layer,
    BudgetCategoryLimitRepository.layer,
    BudgetSpentService.layer,
    BudgetTemplateService.layer,
    BudgetAlertThresholdService.layer,
    StatisticsRepository.layer
).pipe(Layer.provideMerge(makeTestPlatformLayer(testDb)), Layer.provideMerge(Layer.succeed(Clock.Clock, Clock.Clock.defaultValue())));
