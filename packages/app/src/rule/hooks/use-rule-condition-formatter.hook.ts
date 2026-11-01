import {
    ExternalSourceEnum,
    LanguageEnum,
    RuleConditionCreateInputInterface,
    RuleConditionFieldEnum,
    RuleConditionOperatorEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { isEnumValue } from '../../@generic/type-guard/is-enum-value.type-guard';
import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { useGetAllMccCategoriesQuery } from '../../mcc-category/query/use-get-all-mcc-categories.query';
import { TRANSACTION_TYPE } from '../../transaction/constant/transaction-type.constant';
import { EXTERNAL_SOURCE } from '../constant/external-source.constant';
import { RULE_CONDITION_FIELD } from '../constant/rule-condition-field.constant';
import { RULE_CONDITION_OPERATOR } from '../constant/rule-condition-operator.constant';
import { RULE_CONDITION_VALUE_MARKER } from '../constant/rule-condition-value-marker.constant';

import type { RuleConditionLabelInterface } from '../interface/rule-condition-label.interface';

const LIST_SEPARATOR = ',';
const EMPTY_VALUE = '…';
const QUOTES: Record<LanguageEnum, readonly [string, string]> = {
    [LanguageEnum.EN]: ['“', '”'],
    [LanguageEnum.FR]: ['«', '»'],
    [LanguageEnum.UK]: ['«', '»'],
    [LanguageEnum.DE]: ['„', '“'],
    [LanguageEnum.ES]: ['«', '»']
};

const splitListValue = (value: string) =>
    value
        .split(LIST_SEPARATOR)
        .map(part => part.trim())
        .filter(isNotEmptyString);

const formatAmount = (value: string, locale: string) =>
    isNotEmptyString(value.trim()) ? Number(value).toLocaleString(locale) : EMPTY_VALUE;

export const useRuleConditionFormatter = () => {
    const { t, i18n } = useLingui();
    const { accounts } = useSearchAccountsSortedQuery();
    const { mccCategories } = useGetAllMccCategoriesQuery();

    const translateParts = (parts: readonly string[], translateOne: (part: string) => string) =>
        isNotEmptyString(parts[0]) ? parts.map(translateOne).join(', ') : EMPTY_VALUE;

    const formatMcc = (parts: readonly string[]) =>
        translateParts(parts, part => mccCategories.find(({ mcc }) => mcc === part)?.shortDescription ?? part);

    const formatAccount = (parts: readonly string[]) => {
        if (parts.length > 1) {
            return t({ message: plural(parts.length, { one: '# account', other: '# accounts' }) });
        }

        return accounts.find(({ id }) => String(id) === parts[0])?.title ?? EMPTY_VALUE;
    };

    const [openQuote, closeQuote] = isEnumValue(i18n.locale, LanguageEnum) ? QUOTES[i18n.locale] : QUOTES[LanguageEnum.EN];

    const buildSentenceTemplate = (fieldLabel: string, operator: RuleConditionOperatorEnum) => {
        const value = RULE_CONDITION_VALUE_MARKER;
        const templates: Record<RuleConditionOperatorEnum, string> = {
            [RuleConditionOperatorEnum.EQUALS]: t`${fieldLabel} is ${value}`,
            [RuleConditionOperatorEnum.NOT_EQUALS]: t`${fieldLabel} is not ${value}`,
            [RuleConditionOperatorEnum.CONTAINS]: t`${fieldLabel} contains ${value}`,
            [RuleConditionOperatorEnum.NOT_CONTAINS]: t`${fieldLabel} does not contain ${value}`,
            [RuleConditionOperatorEnum.MATCHES_REGEX]: t`${fieldLabel} matches ${value}`,
            [RuleConditionOperatorEnum.GREATER_THAN]: t`${fieldLabel} is more than ${value}`,
            [RuleConditionOperatorEnum.LESS_THAN]: t`${fieldLabel} is less than ${value}`,
            [RuleConditionOperatorEnum.BETWEEN]: t`${fieldLabel} is between ${value}`,
            [RuleConditionOperatorEnum.IN]: t`${fieldLabel} is any of ${value}`
        };

        return templates[operator];
    };

    const buildListTemplate = (fieldLabel: string, operator: RuleConditionOperatorEnum) => {
        const value = RULE_CONDITION_VALUE_MARKER;
        const compactTemplates: Partial<Record<RuleConditionOperatorEnum, string>> = {
            [RuleConditionOperatorEnum.IN]: t`${fieldLabel} is ${value}`,
            [RuleConditionOperatorEnum.GREATER_THAN]: t`${fieldLabel} > ${value}`,
            [RuleConditionOperatorEnum.LESS_THAN]: t`${fieldLabel} < ${value}`
        };

        return compactTemplates[operator] ?? buildSentenceTemplate(fieldLabel, operator);
    };

    const resolveValue = (condition: Pick<RuleConditionCreateInputInterface, 'field' | 'operator' | 'value' | 'secondaryValue'>) => {
        const parts = splitListValue(condition.value);
        const fromAmount = formatAmount(condition.value, i18n.locale);
        const toAmount = formatAmount(condition.secondaryValue ?? '', i18n.locale);

        switch (condition.field) {
            case RuleConditionFieldEnum.AMOUNT:
                return condition.operator === RuleConditionOperatorEnum.BETWEEN ? t`${fromAmount} and ${toAmount}` : fromAmount;
            case RuleConditionFieldEnum.ACCOUNT_ID:
                return formatAccount(parts);
            case RuleConditionFieldEnum.MCC_CODE:
                return formatMcc(parts);
            case RuleConditionFieldEnum.TRANSACTION_TYPE:
                return translateParts(parts, part => (isEnumValue(part, TransactionTypeEnum) ? t(TRANSACTION_TYPE[part]) : part));
            case RuleConditionFieldEnum.EXTERNAL_SOURCE:
                return translateParts(parts, part => (isEnumValue(part, ExternalSourceEnum) ? t(EXTERNAL_SOURCE[part]) : part));
            case RuleConditionFieldEnum.TITLE:
            case RuleConditionFieldEnum.COMMENT:
            default:
                return isNotEmptyString(condition.value.trim()) ? `${openQuote}${condition.value}${closeQuote}` : EMPTY_VALUE;
        }
    };

    return (
        condition: Pick<RuleConditionCreateInputInterface, 'field' | 'operator' | 'value' | 'secondaryValue'>
    ): RuleConditionLabelInterface => {
        const value = resolveValue(condition);
        const fieldLabel = t(RULE_CONDITION_FIELD[condition.field].label);
        const operator = t(RULE_CONDITION_OPERATOR[condition.operator].phrase);
        const parts = splitListValue(condition.value);
        const firstValue = resolveValue({ ...condition, value: parts.at(0) ?? '' });
        const moreCount = parts.length - 1;
        const listOverflow = moreCount > 0 ? t({ message: plural(moreCount, { one: '+# more', other: '+# more' }) }) : null;

        return {
            fieldLabel,
            field: t(RULE_CONDITION_FIELD[condition.field].phrase),
            operator,
            value,
            listValue: moreCount > 0 ? firstValue : value,
            listOverflow,
            sentenceTemplate: buildSentenceTemplate(fieldLabel, condition.operator),
            listTemplate: buildListTemplate(fieldLabel, condition.operator),
            phraseTemplate: buildSentenceTemplate(t(RULE_CONDITION_FIELD[condition.field].phrase), condition.operator),
            hasValue: value !== EMPTY_VALUE && isNotEmptyString(condition.value.trim())
        };
    };
};
