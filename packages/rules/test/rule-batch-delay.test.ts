import {
    CategoryEntityTable,
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { RuleEngineService, RuleService } from '@budgie/rules';
import { describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as TestClock from 'effect/testing/TestClock';

import { RuleServicesLayer, testDb, testSeedService } from './context';

describe('rules engine batch delay', () => {
    it.effect('finishes a batch without matches without waiting on the clock', () =>
        Effect.gen(function* () {
            const ruleService = yield* RuleService;
            const ruleEngineService = yield* RuleEngineService;
            const [category] = yield* testDb.select().from(CategoryEntityTable);
            const account = yield* testSeedService.account();
            yield* ruleService.create({
                enabled: true,
                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                conditions: [
                    {
                        field: RuleConditionFieldEnum.TITLE,
                        operator: RuleConditionOperatorEnum.CONTAINS,
                        value: 'SPAR',
                        secondaryValue: null
                    }
                ],
                actions: [{ type: RuleActionTypeEnum.SET_CATEGORY, categoryId: category.id, tagId: null, accountId: null }]
            });

            const fiber = yield* Effect.forkChild(
                ruleEngineService.applyRulesToTransactions(
                    [1],
                    [
                        {
                            type: TransactionTypeEnum.EXPENSE,
                            title: 'LIDL',
                            comment: '',
                            externalId: null,
                            operatedAt: new Date('2026-06-02T12:00:00.000Z'),
                            toAccountId: null,
                            fromAccountId: account.id,
                            exchangeRate: 1,
                            externalSource: null,
                            updatedBy: null,
                            amount: 10,
                            tagIds: [],
                            entries: [
                                {
                                    accountId: account.id,
                                    categoryId: null,
                                    mccCategoryId: null,
                                    type: TransactionEntryTypeEnum.CREDIT,
                                    amount: 10
                                }
                            ]
                        }
                    ]
                )
            );

            yield* TestClock.withLive(Fiber.join(fiber).pipe(Effect.timeout('2 seconds')));
        }).pipe(Effect.provide(RuleServicesLayer))
    );
});
