import {
    RuleActionEntityTable,
    RuleConditionEntityTable,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    RuleEntityTable
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

export const seedTitleRule = (
    title: string,
    action: Pick<typeof RuleActionEntityTable.$inferInsert, 'type' | 'categoryId' | 'accountId'>
) =>
    Effect.gen(function* () {
        const [rule] = yield* testDb
            .insert(RuleEntityTable)
            .values({ enabled: true, conditionMatchType: RuleConditionMatchTypeEnum.ALL })
            .returning();

        yield* testDb.insert(RuleConditionEntityTable).values({
            ruleId: rule.id,
            field: RuleConditionFieldEnum.TITLE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: title,
            secondaryValue: null
        });
        yield* testDb.insert(RuleActionEntityTable).values({ ruleId: rule.id, tagId: null, ...action });

        return rule;
    });
