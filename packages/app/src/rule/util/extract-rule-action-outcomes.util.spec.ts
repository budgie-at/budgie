/* eslint-disable lingui/no-unlocalized-strings */
import { RuleActionTypeEnum, RuleConditionMatchTypeEnum, RuleWithRelationsEntityInterface } from '@budgie/contracts';

import { extractRuleActionOutcomes } from './extract-rule-action-outcomes.util';

const buildRule = (actions: RuleWithRelationsEntityInterface['actions']): RuleWithRelationsEntityInterface =>
    ({
        id: 1,
        enabled: true,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        conditions: [],
        actions
    }) as unknown as RuleWithRelationsEntityInterface;

const buildSetCategoryAction = (categoryId: number) =>
    ({
        type: RuleActionTypeEnum.SET_CATEGORY,
        categoryId,
        tagId: null,
        accountId: null
    }) as unknown as RuleWithRelationsEntityInterface['actions'][0];

const buildAddTagAction = (tagId: number) =>
    ({
        type: RuleActionTypeEnum.ADD_TAG,
        categoryId: null,
        tagId,
        accountId: null
    }) as unknown as RuleWithRelationsEntityInterface['actions'][0];

describe('extractRuleActionOutcomes', () => {
    it('should return null categoryId and empty tagIds for empty rules', () => {
        expect(extractRuleActionOutcomes([])).toStrictEqual({ categoryId: null, tagIds: [] });
    });

    it('should extract categoryId from SET_CATEGORY action', () => {
        const rule = buildRule([buildSetCategoryAction(5)]);

        expect(extractRuleActionOutcomes([rule])).toStrictEqual({ categoryId: 5, tagIds: [] });
    });

    it('should extract tagIds from ADD_TAG actions', () => {
        const rule = buildRule([buildAddTagAction(10), buildAddTagAction(20)]);

        expect(extractRuleActionOutcomes([rule])).toStrictEqual({ categoryId: null, tagIds: [10, 20] });
    });

    it('should take first SET_CATEGORY across multiple rules', () => {
        const ruleA = buildRule([buildSetCategoryAction(5)]);
        const ruleB = buildRule([buildSetCategoryAction(9)]);

        expect(extractRuleActionOutcomes([ruleA, ruleB])).toStrictEqual({ categoryId: 5, tagIds: [] });
    });

    it('should collect unique tagIds across multiple rules', () => {
        const ruleA = buildRule([buildAddTagAction(10)]);
        const ruleB = buildRule([buildAddTagAction(10), buildAddTagAction(20)]);

        expect(extractRuleActionOutcomes([ruleA, ruleB])).toStrictEqual({ categoryId: null, tagIds: [10, 20] });
    });

    it('should extract both categoryId and tagIds', () => {
        const rule = buildRule([buildSetCategoryAction(3), buildAddTagAction(7)]);

        expect(extractRuleActionOutcomes([rule])).toStrictEqual({ categoryId: 3, tagIds: [7] });
    });

    it('should ignore CONVERT_TO_TRANSFER actions', () => {
        const action = { type: RuleActionTypeEnum.CONVERT_TO_TRANSFER, categoryId: null, tagId: null, accountId: 1 };
        const rule = buildRule([action as unknown as RuleWithRelationsEntityInterface['actions'][0]]);

        expect(extractRuleActionOutcomes([rule])).toStrictEqual({ categoryId: null, tagIds: [] });
    });
});
