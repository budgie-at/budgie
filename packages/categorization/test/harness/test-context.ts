import { RuleMatcherService } from '@app/rule/service/rule-matcher.service';
import { buildTestDb, makeTestPlatformLayer, TestSeedService } from '@budgie-at/test-kit';
import {
    CategorizeInboxService,
    CommentEmbeddingRepository,
    MerchantEmbeddingRepository,
    TransactionCategorizeInboxRepository
} from '@budgie/categorization';
import { RuleRepository, SettingsRepository } from '@budgie/contracts';
import * as Layer from 'effect/Layer';

import { isNotEmptyString } from '@rnw-community/shared';

export const backupDatabasePath = isNotEmptyString(process.env['BUDGIE_BACKUP_DB']) ? process.env['BUDGIE_BACKUP_DB'] : null;

export const testDb = buildTestDb(backupDatabasePath);

export const testSeedService = new TestSeedService(testDb);

export const TestLayer = Layer.mergeAll(
    CategorizeInboxService.layer,
    TransactionCategorizeInboxRepository.layer,
    MerchantEmbeddingRepository.layer,
    CommentEmbeddingRepository.layer,
    RuleMatcherService.layer,
    RuleRepository.layer,
    SettingsRepository.layer
).pipe(Layer.provideMerge(makeTestPlatformLayer(testDb)));
