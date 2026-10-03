import { RuleConditionFieldEnum, RuleConditionMatchTypeEnum, RuleConditionOperatorEnum, TransactionTypeEnum } from '@budgie/contracts';
import { RuleMatcherService } from '@budgie/rules';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { TestLayer } from './context';

import type { RuleEvaluationInputInterface } from '@budgie/rules';

const transactionInput: RuleEvaluationInputInterface = {
    type: TransactionTypeEnum.EXPENSE,
    title: 'SPAR MARKET',
    comment: '',
    externalId: null,
    operatedAt: new Date('2026-06-02T12:00:00.000Z'),
    toAccountId: null,
    fromAccountId: 1,
    exchangeRate: 1,
    externalSource: null,
    updatedBy: null,
    amount: 25,
    tagIds: [],
    entries: []
};

const buildRule = (
    conditionMatchType: RuleConditionMatchTypeEnum,
    conditions: Array<[RuleConditionFieldEnum, RuleConditionOperatorEnum, string, string | null]>
) => ({
    id: 1,
    enabled: true,
    conditionMatchType,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    conditions: conditions.map(([field, operator, value, secondaryValue], index) => ({
        id: index + 1,
        ruleId: 1,
        field,
        operator,
        value,
        secondaryValue,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    })),
    actions: []
});

const sparTitleRule = buildRule(RuleConditionMatchTypeEnum.ALL, [
    [RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.CONTAINS, 'spar', null]
]);

const mixedConditions: Array<[RuleConditionFieldEnum, RuleConditionOperatorEnum, string, string | null]> = [
    [RuleConditionFieldEnum.TITLE, RuleConditionOperatorEnum.CONTAINS, 'LIDL', null],
    [RuleConditionFieldEnum.AMOUNT, RuleConditionOperatorEnum.BETWEEN, '10', '30']
];

layer(TestLayer)('RuleMatcherService.evaluateRule', it => {
    it.effect('matches a title contains condition case-insensitively', () =>
        Effect.gen(function* () {
            const ruleMatcherService = yield* RuleMatcherService;

            expect(ruleMatcherService.evaluateRule(sparTitleRule, transactionInput)).toBe(true);
            expect(ruleMatcherService.evaluateRule(sparTitleRule, { ...transactionInput, title: 'LIDL' })).toBe(false);
        })
    );

    it.effect('requires every condition for ALL and any condition for ANY, including amount ranges', () =>
        Effect.gen(function* () {
            const ruleMatcherService = yield* RuleMatcherService;
            const allRule = buildRule(RuleConditionMatchTypeEnum.ALL, mixedConditions);
            const anyRule = buildRule(RuleConditionMatchTypeEnum.ANY, mixedConditions);

            expect(ruleMatcherService.evaluateRule(allRule, transactionInput)).toBe(false);
            expect(ruleMatcherService.evaluateRule(anyRule, transactionInput)).toBe(true);
            expect(ruleMatcherService.evaluateRule(anyRule, { ...transactionInput, amount: 31, title: 'X' })).toBe(false);
        })
    );

    it.effect('never matches adjustment transactions', () =>
        Effect.gen(function* () {
            const ruleMatcherService = yield* RuleMatcherService;

            expect(ruleMatcherService.evaluateRule(sparTitleRule, { ...transactionInput, type: TransactionTypeEnum.ADJUSTMENT })).toBe(
                false
            );
        })
    );
});
