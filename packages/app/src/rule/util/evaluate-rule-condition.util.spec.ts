import {
    ExternalSourceEnum,
    RuleConditionFieldEnum,
    RuleConditionOperatorEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';

import { evaluateRuleCondition, matchOperator } from './evaluate-rule-condition.util';

const buildInput = (overrides: Partial<RuleEvaluationInputInterface> = {}): RuleEvaluationInputInterface => ({
    type: TransactionTypeEnum.EXPENSE,
    title: 'NETFLIX',
    comment: 'Monthly subscription',
    amount: 15.99,
    fromAccountId: 1,
    toAccountId: null,
    operatedAt: new Date(),
    externalId: null,
    exchangeRate: 1,
    updatedBy: null,
    tagIds: [],
    externalSource: null,
    entries: [
        {
            type: TransactionEntryTypeEnum.CREDIT,
            categoryId: 1,
            accountId: 1,
            amount: 15.99,
            mccCategoryId: null,
            mccCode: null
        }
    ],
    ...overrides
});

describe('matchOperator', () => {
    describe('EQUALS', () => {
        it('should match case-insensitively', () => {
            expect(matchOperator(RuleConditionOperatorEnum.EQUALS, 'Netflix', 'netflix', null)).toBe(true);
        });

        it('should not match different values', () => {
            expect(matchOperator(RuleConditionOperatorEnum.EQUALS, 'Spotify', 'Netflix', null)).toBe(false);
        });

        it('should compare numbers as strings', () => {
            expect(matchOperator(RuleConditionOperatorEnum.EQUALS, 42, '42', null)).toBe(true);
        });

        it('should return false for null field value', () => {
            expect(matchOperator(RuleConditionOperatorEnum.EQUALS, null, 'test', null)).toBe(false);
        });
    });

    describe('NOT_EQUALS', () => {
        it('should return true for different values', () => {
            expect(matchOperator(RuleConditionOperatorEnum.NOT_EQUALS, 'Netflix', 'Spotify', null)).toBe(true);
        });

        it('should return false for same value case-insensitively', () => {
            expect(matchOperator(RuleConditionOperatorEnum.NOT_EQUALS, 'NETFLIX', 'netflix', null)).toBe(false);
        });

        it('should return false for null field value', () => {
            expect(matchOperator(RuleConditionOperatorEnum.NOT_EQUALS, null, 'test', null)).toBe(false);
        });
    });

    describe('CONTAINS', () => {
        it('should find substring case-insensitively', () => {
            expect(matchOperator(RuleConditionOperatorEnum.CONTAINS, 'Netflix Monthly', 'netflix', null)).toBe(true);
        });

        it('should return false when substring not found', () => {
            expect(matchOperator(RuleConditionOperatorEnum.CONTAINS, 'Spotify', 'Netflix', null)).toBe(false);
        });

        it('should match exact string', () => {
            expect(matchOperator(RuleConditionOperatorEnum.CONTAINS, 'Netflix', 'Netflix', null)).toBe(true);
        });

        it('should return false for null field value', () => {
            expect(matchOperator(RuleConditionOperatorEnum.CONTAINS, null, 'test', null)).toBe(false);
        });
    });

    describe('NOT_CONTAINS', () => {
        it('should return true when substring not found', () => {
            expect(matchOperator(RuleConditionOperatorEnum.NOT_CONTAINS, 'Spotify', 'Netflix', null)).toBe(true);
        });

        it('should return false when substring found', () => {
            expect(matchOperator(RuleConditionOperatorEnum.NOT_CONTAINS, 'Netflix Monthly', 'netflix', null)).toBe(false);
        });

        it('should return false for null field value', () => {
            expect(matchOperator(RuleConditionOperatorEnum.NOT_CONTAINS, null, 'test', null)).toBe(false);
        });
    });

    describe('MATCHES_REGEX', () => {
        it('should match valid regex pattern', () => {
            expect(matchOperator(RuleConditionOperatorEnum.MATCHES_REGEX, 'Netflix 2024', 'Netflix \\d+', null)).toBe(true);
        });

        it('should not match non-matching pattern', () => {
            expect(matchOperator(RuleConditionOperatorEnum.MATCHES_REGEX, 'Spotify', '^Netflix', null)).toBe(false);
        });

        it('should be case-insensitive', () => {
            expect(matchOperator(RuleConditionOperatorEnum.MATCHES_REGEX, 'netflix', 'NETFLIX', null)).toBe(true);
        });

        it('should return false for regex exceeding max length', () => {
            const longPattern = 'a'.repeat(201);
            expect(matchOperator(RuleConditionOperatorEnum.MATCHES_REGEX, 'a', longPattern, null)).toBe(false);
        });

        it('should return false for nested quantifiers (ReDoS prevention)', () => {
            expect(matchOperator(RuleConditionOperatorEnum.MATCHES_REGEX, 'aaa', '(a+)+', null)).toBe(false);
        });

        it('should return false for invalid regex syntax', () => {
            expect(matchOperator(RuleConditionOperatorEnum.MATCHES_REGEX, 'test', '[invalid', null)).toBe(false);
        });

        it('should return false for null field value', () => {
            expect(matchOperator(RuleConditionOperatorEnum.MATCHES_REGEX, null, 'test', null)).toBe(false);
        });
    });

    describe('GREATER_THAN', () => {
        it('should return true when field value is greater', () => {
            expect(matchOperator(RuleConditionOperatorEnum.GREATER_THAN, 100, '50', null)).toBe(true);
        });

        it('should return false when field value is equal', () => {
            expect(matchOperator(RuleConditionOperatorEnum.GREATER_THAN, 50, '50', null)).toBe(false);
        });

        it('should return false when field value is less', () => {
            expect(matchOperator(RuleConditionOperatorEnum.GREATER_THAN, 10, '50', null)).toBe(false);
        });

        it('should return false for string field values', () => {
            expect(matchOperator(RuleConditionOperatorEnum.GREATER_THAN, 'abc', '50', null)).toBe(false);
        });

        it('should return false for null field value', () => {
            expect(matchOperator(RuleConditionOperatorEnum.GREATER_THAN, null, '50', null)).toBe(false);
        });
    });

    describe('LESS_THAN', () => {
        it('should return true when field value is less', () => {
            expect(matchOperator(RuleConditionOperatorEnum.LESS_THAN, 10, '50', null)).toBe(true);
        });

        it('should return false when field value is equal', () => {
            expect(matchOperator(RuleConditionOperatorEnum.LESS_THAN, 50, '50', null)).toBe(false);
        });

        it('should return false when field value is greater', () => {
            expect(matchOperator(RuleConditionOperatorEnum.LESS_THAN, 100, '50', null)).toBe(false);
        });

        it('should return false for null field value', () => {
            expect(matchOperator(RuleConditionOperatorEnum.LESS_THAN, null, '50', null)).toBe(false);
        });
    });

    describe('BETWEEN', () => {
        it('should return true when value is within range', () => {
            expect(matchOperator(RuleConditionOperatorEnum.BETWEEN, 50, '10', '100')).toBe(true);
        });

        it('should return true when value equals lower bound', () => {
            expect(matchOperator(RuleConditionOperatorEnum.BETWEEN, 10, '10', '100')).toBe(true);
        });

        it('should return true when value equals upper bound', () => {
            expect(matchOperator(RuleConditionOperatorEnum.BETWEEN, 100, '10', '100')).toBe(true);
        });

        it('should return false when value is below range', () => {
            expect(matchOperator(RuleConditionOperatorEnum.BETWEEN, 5, '10', '100')).toBe(false);
        });

        it('should return false when value is above range', () => {
            expect(matchOperator(RuleConditionOperatorEnum.BETWEEN, 150, '10', '100')).toBe(false);
        });

        it('should return false when secondary value is null', () => {
            expect(matchOperator(RuleConditionOperatorEnum.BETWEEN, 50, '10', null)).toBe(false);
        });

        it('should return false when secondary value is empty', () => {
            expect(matchOperator(RuleConditionOperatorEnum.BETWEEN, 50, '10', '')).toBe(false);
        });

        it('should return false for string field values', () => {
            expect(matchOperator(RuleConditionOperatorEnum.BETWEEN, 'abc', '10', '100')).toBe(false);
        });

        it('should return false for null field value', () => {
            expect(matchOperator(RuleConditionOperatorEnum.BETWEEN, null, '10', '100')).toBe(false);
        });
    });

    describe('IN', () => {
        it('should match value in comma-separated list', () => {
            expect(matchOperator(RuleConditionOperatorEnum.IN, 'EXPENSE', 'EXPENSE,INCOME,TRANSFER', null)).toBe(true);
        });

        it('should match case-insensitively', () => {
            expect(matchOperator(RuleConditionOperatorEnum.IN, 'expense', 'EXPENSE,INCOME', null)).toBe(true);
        });

        it('should trim whitespace around values', () => {
            expect(matchOperator(RuleConditionOperatorEnum.IN, 'EXPENSE', 'EXPENSE , INCOME , TRANSFER', null)).toBe(true);
        });

        it('should not match value not in list', () => {
            expect(matchOperator(RuleConditionOperatorEnum.IN, 'ADJUSTMENT', 'EXPENSE,INCOME', null)).toBe(false);
        });

        it('should match single item list', () => {
            expect(matchOperator(RuleConditionOperatorEnum.IN, 'EXPENSE', 'EXPENSE', null)).toBe(true);
        });

        it('should return false for null field value', () => {
            expect(matchOperator(RuleConditionOperatorEnum.IN, null, 'EXPENSE,INCOME', null)).toBe(false);
        });
    });
});

describe('evaluateRuleCondition', () => {
    it('should evaluate TITLE field', () => {
        const input = buildInput({ title: 'NETFLIX' });
        const condition = {
            field: RuleConditionFieldEnum.TITLE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: 'netflix',
            secondaryValue: null
        };

        expect(evaluateRuleCondition(condition, input)).toBe(true);
    });

    it('should evaluate COMMENT field', () => {
        const input = buildInput({ comment: 'Monthly subscription' });
        const condition = {
            field: RuleConditionFieldEnum.COMMENT,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: 'subscription',
            secondaryValue: null
        };

        expect(evaluateRuleCondition(condition, input)).toBe(true);
    });

    it('should evaluate AMOUNT field', () => {
        const input = buildInput({ amount: 15.99 });
        const condition = {
            field: RuleConditionFieldEnum.AMOUNT,
            operator: RuleConditionOperatorEnum.GREATER_THAN,
            value: '10',
            secondaryValue: null
        };

        expect(evaluateRuleCondition(condition, input)).toBe(true);
    });

    it('should evaluate ACCOUNT_ID from fromAccountId', () => {
        const input = buildInput({ fromAccountId: 5, toAccountId: null });
        const condition = {
            field: RuleConditionFieldEnum.ACCOUNT_ID,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: '5',
            secondaryValue: null
        };

        expect(evaluateRuleCondition(condition, input)).toBe(true);
    });

    it('should evaluate ACCOUNT_ID from toAccountId when fromAccountId is null', () => {
        const input = buildInput({ fromAccountId: null, toAccountId: 3 });
        const condition = {
            field: RuleConditionFieldEnum.ACCOUNT_ID,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: '3',
            secondaryValue: null
        };

        expect(evaluateRuleCondition(condition, input)).toBe(true);
    });

    it('should evaluate MCC_CODE from first entry', () => {
        const input = buildInput({
            entries: [{ type: TransactionEntryTypeEnum.CREDIT, categoryId: 1, accountId: 1, amount: 10, mccCategoryId: 1, mccCode: '5411' }]
        });
        const condition = {
            field: RuleConditionFieldEnum.MCC_CODE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: '5411',
            secondaryValue: null
        };

        expect(evaluateRuleCondition(condition, input)).toBe(true);
    });

    it('should return false for MCC_CODE when entries are empty', () => {
        const input = buildInput({ entries: [] });
        const condition = {
            field: RuleConditionFieldEnum.MCC_CODE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: '5411',
            secondaryValue: null
        };

        expect(evaluateRuleCondition(condition, input)).toBe(false);
    });

    it('should evaluate TRANSACTION_TYPE field', () => {
        const input = buildInput({ type: TransactionTypeEnum.EXPENSE });
        const condition = {
            field: RuleConditionFieldEnum.TRANSACTION_TYPE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: TransactionTypeEnum.EXPENSE,
            secondaryValue: null
        };

        expect(evaluateRuleCondition(condition, input)).toBe(true);
    });

    it('should evaluate EXTERNAL_SOURCE field', () => {
        const input = buildInput({ externalSource: ExternalSourceEnum.MONOBANK });
        const condition = {
            field: RuleConditionFieldEnum.EXTERNAL_SOURCE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: ExternalSourceEnum.MONOBANK,
            secondaryValue: null
        };

        expect(evaluateRuleCondition(condition, input)).toBe(true);
    });

    it('should return false for EXTERNAL_SOURCE when null', () => {
        const input = buildInput({ externalSource: null });
        const condition = {
            field: RuleConditionFieldEnum.EXTERNAL_SOURCE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: ExternalSourceEnum.MONOBANK,
            secondaryValue: null
        };

        expect(evaluateRuleCondition(condition, input)).toBe(false);
    });

    it('should evaluate AMOUNT with BETWEEN operator', () => {
        const input = buildInput({ amount: 50 });
        const condition = {
            field: RuleConditionFieldEnum.AMOUNT,
            operator: RuleConditionOperatorEnum.BETWEEN,
            value: '10',
            secondaryValue: '100'
        };

        expect(evaluateRuleCondition(condition, input)).toBe(true);
    });

    it('should return false for AMOUNT BETWEEN when out of range', () => {
        const input = buildInput({ amount: 200 });
        const condition = {
            field: RuleConditionFieldEnum.AMOUNT,
            operator: RuleConditionOperatorEnum.BETWEEN,
            value: '10',
            secondaryValue: '100'
        };

        expect(evaluateRuleCondition(condition, input)).toBe(false);
    });
});
