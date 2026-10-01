import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import {
    CategoryEntityTable,
    ExternalSourceEnum,
    RuleActionEntityTable,
    RuleActionTypeEnum,
    RuleConditionEntityTable,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    RuleEntityTable,
    TagEntityTable,
    TransactionEntryEntityTable,
    TransactionTagsEntityTable
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb, TestLayer } from '../../harness';

describe('monobank/rules-on-create', () => {
    it.effect('persists matching rule category and tag when inserting new synced transactions', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const [category] = yield* testDb.select().from(CategoryEntityTable);
            const [tag] = yield* testDb
                .insert(TagEntityTable)
                .values({ title: 'Subscription', titleSearch: 'subscription', titleEn: null, titleTags: null, tagsGeneratedAt: null })
                .returning();
            const [rule] = yield* testDb
                .insert(RuleEntityTable)
                .values({ enabled: true, conditionMatchType: RuleConditionMatchTypeEnum.ALL })
                .returning();

            yield* testDb.insert(RuleConditionEntityTable).values([
                {
                    ruleId: rule.id,
                    field: RuleConditionFieldEnum.TITLE,
                    operator: RuleConditionOperatorEnum.CONTAINS,
                    value: 'SPAR',
                    secondaryValue: null
                },
                {
                    ruleId: rule.id,
                    field: RuleConditionFieldEnum.EXTERNAL_SOURCE,
                    operator: RuleConditionOperatorEnum.EQUALS,
                    value: ExternalSourceEnum.MONOBANK,
                    secondaryValue: null
                }
            ]);
            yield* testDb.insert(RuleActionEntityTable).values([
                { ruleId: rule.id, type: RuleActionTypeEnum.SET_CATEGORY, categoryId: category.id, tagId: null, accountId: null },
                { ruleId: rule.id, type: RuleActionTypeEnum.ADD_TAG, categoryId: null, tagId: tag.id, accountId: null }
            ]);

            yield* setupMonobankFixture();
            monobankStub.statement([
                buildMonobank.transaction({
                    id: 'tx-spar-rule',
                    amount: -2500,
                    description: 'SPAR MARKET',
                    hold: false,
                    mcc: 5411,
                    originalMcc: 5411
                })
            ]);

            yield* monobankSyncService.sync();

            const [entry] = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, 'tx-spar-rule'));
            const [transactionTag] = yield* testDb
                .select()
                .from(TransactionTagsEntityTable)
                .where(eq(TransactionTagsEntityTable.transactionId, entry.transactionId));

            expect(entry.categoryId).toBe(category.id);
            expect(transactionTag.tagId).toBe(tag.id);
        }).pipe(Effect.provide(TestLayer))
    );
});
