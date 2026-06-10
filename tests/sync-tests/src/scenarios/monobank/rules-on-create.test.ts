import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

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

import { buildMonobank, monobankStub, setupMonobankFixture, testDb } from '../../harness';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

describe('monobank/rules-on-create', () => {
    it('persists matching rule category and tag when inserting new synced transactions', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const [tag] = testDb
            .insert(TagEntityTable)
            .values({ title: 'Subscription', titleSearch: 'subscription', titleEn: null, titleTags: null, tagsGeneratedAt: null })
            .returning()
            .all();
        const [rule] = testDb
            .insert(RuleEntityTable)
            .values({ enabled: true, conditionMatchType: RuleConditionMatchTypeEnum.ALL })
            .returning()
            .all();

        testDb
            .insert(RuleConditionEntityTable)
            .values([
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
            ])
            .run();
        testDb
            .insert(RuleActionEntityTable)
            .values([
                { ruleId: rule.id, type: RuleActionTypeEnum.SET_CATEGORY, categoryId: category.id, tagId: null, accountId: null },
                { ruleId: rule.id, type: RuleActionTypeEnum.ADD_TAG, categoryId: null, tagId: tag.id, accountId: null }
            ])
            .run();

        setupMonobankFixture();
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

        await monobankSyncService.sync();

        const [entry] = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-spar-rule'))
            .all();
        const [transactionTag] = testDb
            .select()
            .from(TransactionTagsEntityTable)
            .where(eq(TransactionTagsEntityTable.transactionId, entry?.transactionId ?? 0))
            .all();

        expect(entry?.categoryId).toBe(category.id);
        expect(transactionTag?.tagId).toBe(tag.id);
    });
});
