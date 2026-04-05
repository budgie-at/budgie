/* eslint-disable lingui/no-unlocalized-strings */
import { RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';

import { selectSuggestCondition } from './select-suggest-condition.util';

describe('selectSuggestCondition', () => {
    it('should return TITLE CONTAINS for clean title with 3+ chars', () => {
        const result = selectSuggestCondition('NETFLIX', null);

        expect(result).toEqual({
            field: RuleConditionFieldEnum.TITLE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: 'NETFLIX',
            secondaryValue: null
        });
    });

    it('should clean title before using it', () => {
        const result = selectSuggestCondition('NETFLIX.COM 04/02 #8821 USD 15.99', null);

        expect(result).toEqual({
            field: RuleConditionFieldEnum.TITLE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: 'NETFLIX',
            secondaryValue: null
        });
    });

    it('should return MCC_CODE EQUALS when title is empty', () => {
        const result = selectSuggestCondition('', '5411');

        expect(result).toEqual({
            field: RuleConditionFieldEnum.MCC_CODE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: '5411',
            secondaryValue: null
        });
    });

    it('should return MCC_CODE EQUALS for generic title "POS PURCHASE"', () => {
        const result = selectSuggestCondition('POS PURCHASE', '5411');

        expect(result).toEqual({
            field: RuleConditionFieldEnum.MCC_CODE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: '5411',
            secondaryValue: null
        });
    });

    it('should return MCC_CODE EQUALS for generic title "PAYMENT"', () => {
        const result = selectSuggestCondition('PAYMENT', '5411');

        expect(result).toEqual({
            field: RuleConditionFieldEnum.MCC_CODE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: '5411',
            secondaryValue: null
        });
    });

    it('should return null when both title and MCC are empty', () => {
        expect(selectSuggestCondition('', null)).toBeNull();
    });

    it('should return null for generic title without MCC', () => {
        expect(selectSuggestCondition('POS', null)).toBeNull();
    });

    it('should treat title with generic substring as generic', () => {
        const result = selectSuggestCondition('DEBIT CARD', '6011');

        expect(result).toEqual({
            field: RuleConditionFieldEnum.MCC_CODE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: '6011',
            secondaryValue: null
        });
    });

    it('should prefer title over MCC when title is specific', () => {
        const result = selectSuggestCondition('STARBUCKS COFFEE', '5814');

        expect(result).toEqual({
            field: RuleConditionFieldEnum.TITLE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: 'STARBUCKS COFFEE',
            secondaryValue: null
        });
    });

    it('should handle title that becomes too short after cleaning', () => {
        const result = selectSuggestCondition('AB', '5411');

        expect(result).toEqual({
            field: RuleConditionFieldEnum.MCC_CODE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: '5411',
            secondaryValue: null
        });
    });

    it('should return TITLE for multi-word specific title', () => {
        const result = selectSuggestCondition('WHOLE FOODS MARKET', null);

        expect(result).toEqual({
            field: RuleConditionFieldEnum.TITLE,
            operator: RuleConditionOperatorEnum.CONTAINS,
            value: 'WHOLE FOODS MARKET',
            secondaryValue: null
        });
    });

    it('should return MCC for title "WITHDRAWAL"', () => {
        const result = selectSuggestCondition('WITHDRAWAL', '6011');

        expect(result).toEqual({
            field: RuleConditionFieldEnum.MCC_CODE,
            operator: RuleConditionOperatorEnum.EQUALS,
            value: '6011',
            secondaryValue: null
        });
    });
});
