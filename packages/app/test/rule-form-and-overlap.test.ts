import {
    PERSONAL_SYNC_ZONE,
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { vi } from 'vitest';

import { getOverlappingRuleIds } from '../src/rule/utils/get-overlapping-rule-ids.util';
import { getRuleFormIssue } from '../src/rule/utils/get-rule-form-issue.util';

vi.mock('@lingui/core/macro', () => ({ msg: (strings: TemplateStringsArray) => ({ id: strings.join('') }) }));

const VALID_ACTION = {
    type: RuleActionTypeEnum.SET_CATEGORY,
    categoryId: 1,
    tagId: null,
    accountId: null
};

const buildRule = ({
    id,
    conditionMatchType,
    value,
    secondaryValue = null
}: {
    readonly id: number;
    readonly conditionMatchType: RuleConditionMatchTypeEnum;
    readonly value: string;
    readonly secondaryValue?: string | null;
}) => ({
    id,
    enabled: true,
    conditionMatchType,
    conditions: [
        {
            id,
            ruleId: id,
            field: RuleConditionFieldEnum.TITLE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value,
            secondaryValue,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            syncId: null,
            syncZone: PERSONAL_SYNC_ZONE
        }
    ]
});

describe('rule form validation and overlap detection', () => {
    it('rejects unsafe regex patterns, non-numeric amounts, and inverted BETWEEN bounds', () => {
        expect(
            getRuleFormIssue({
                conditions: [
                    {
                        field: RuleConditionFieldEnum.TITLE,
                        operator: RuleConditionOperatorEnum.MATCHES_REGEX,
                        value: '(a+)+',
                        secondaryValue: null
                    }
                ],
                actions: [VALID_ACTION]
            })
        ).toMatchObject({ conditionIndex: 0 });

        expect(
            getRuleFormIssue({
                conditions: [
                    {
                        field: RuleConditionFieldEnum.TITLE,
                        operator: RuleConditionOperatorEnum.MATCHES_REGEX,
                        value: 'a'.repeat(201),
                        secondaryValue: null
                    }
                ],
                actions: [VALID_ACTION]
            })
        ).toMatchObject({ conditionIndex: 0 });

        expect(
            getRuleFormIssue({
                conditions: [
                    {
                        field: RuleConditionFieldEnum.AMOUNT,
                        operator: RuleConditionOperatorEnum.GREATER_THAN,
                        value: 'not-a-number',
                        secondaryValue: null
                    }
                ],
                actions: [VALID_ACTION]
            })
        ).toMatchObject({ conditionIndex: 0 });

        expect(
            getRuleFormIssue({
                conditions: [
                    {
                        field: RuleConditionFieldEnum.AMOUNT,
                        operator: RuleConditionOperatorEnum.BETWEEN,
                        value: '50',
                        secondaryValue: '10'
                    }
                ],
                actions: [VALID_ACTION]
            })
        ).toMatchObject({ conditionIndex: 0 });

        expect(
            getRuleFormIssue({
                conditions: [
                    {
                        field: RuleConditionFieldEnum.AMOUNT,
                        operator: RuleConditionOperatorEnum.BETWEEN,
                        value: '10',
                        secondaryValue: '50'
                    }
                ],
                actions: [VALID_ACTION]
            })
        ).toBeNull();
    });

    it('detects overlap between single-condition ALL and ANY rules and ignores stale secondaryValue on non-BETWEEN', () => {
        const overlaps = getOverlappingRuleIds([
            buildRule({ id: 1, conditionMatchType: RuleConditionMatchTypeEnum.ALL, value: 'SPAR', secondaryValue: 'old' }),
            buildRule({ id: 2, conditionMatchType: RuleConditionMatchTypeEnum.ANY, value: ' spar ' })
        ]);

        expect([...overlaps]).toEqual([2]);
    });
});
