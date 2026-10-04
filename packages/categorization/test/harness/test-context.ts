import { buildTestDb, makeTestPlatformLayer, TestSeedService } from '@budgie-at/test-kit';
import {
    CategorizeInboxService,
    CommentEmbeddingRepository,
    MerchantEmbeddingRepository,
    TransactionCategorizeInboxRepository
} from '@budgie/categorization';
import { SettingsRepository, TransactionTagsRepository } from '@budgie/contracts';
import { RuleMatcherService, RuleRepository } from '@budgie/rules';
import * as Layer from 'effect/Layer';

import { isNotEmptyString } from '@rnw-community/shared';

export const backupDatabasePath = isNotEmptyString(process.env['BUDGIE_BACKUP_DB']) ? process.env['BUDGIE_BACKUP_DB'] : null;

export const testDbHandle = await buildTestDb(backupDatabasePath);

export const testDb = testDbHandle.database;

export const testSeedService = new TestSeedService(testDb);

export const TestLayer = Layer.mergeAll(
    CategorizeInboxService.layer,
    TransactionCategorizeInboxRepository.layer,
    MerchantEmbeddingRepository.layer,
    CommentEmbeddingRepository.layer,
    RuleMatcherService.layer,
    RuleRepository.layer,
    SettingsRepository.layer,
    TransactionTagsRepository.layer
).pipe(Layer.provideMerge(makeTestPlatformLayer(testDb)));
