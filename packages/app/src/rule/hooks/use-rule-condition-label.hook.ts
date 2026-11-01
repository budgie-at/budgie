import {
    ExternalSourceEnum,
    RuleConditionCreateInputInterface,
    RuleConditionFieldEnum,
    RuleConditionOperatorEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { isEnumValue } from '../../@generic/type-guard/is-enum-value.type-guard';
import { useGetAccountByIdQuery } from '../../account/query/use-get-account-by-id.query';
import { useGetAllMccCategoriesQuery } from '../../mcc-category/query/use-get-all-mcc-categories.query';
import { TRANSACTION_TYPE } from '../../transaction/constant/transaction-type.constant';
import { EXTERNAL_SOURCE } from '../constant/external-source.constant';
import { RULE_CONDITION_FIELD } from '../constant/rule-condition-field.constant';
import { RULE_CONDITION_OPERATOR } from '../constant/rule-condition-operator.constant';

import type { RuleConditionLabelInterface } from '../interface/rule-condition-label.interface';

const LIST_SEPARATOR = ',';
const EMPTY_VALUE = '…';

const splitListValue = (value: string) =>
    value
        .split(LIST_SEPARATOR)
        .map(part => part.trim())
        .filter(isNotEmptyString);

const formatAmount = (value: string) => (isNotEmptyString(value.trim()) ? Number(value).toLocaleString() : EMPTY_VALUE);

export const useRuleConditionLabel = (
    condition: Pick<RuleConditionCreateInputInterface, 'field' | 'operator' | 'value' | 'secondaryValue'>
): RuleConditionLabelInterface => {
    const { t } = useLingui();
    const { field, operator, value, secondaryValue } = condition;
    const parts = splitListValue(value);
    const accountId = field === RuleConditionFieldEnum.ACCOUNT_ID ? Number(parts[0]) : 0;
    const { account } = useGetAccountByIdQuery(isPositiveNumber(accountId) ? accountId : 0);
    const { mccCategories } = useGetAllMccCategoriesQuery();

    const fromAmount = formatAmount(value);
    const toAmount = formatAmount(secondaryValue ?? '');

    const translateParts = (translateOne: (part: string) => string) =>
        isNotEmptyString(parts[0]) ? parts.map(translateOne).join(', ') : EMPTY_VALUE;

    const resolveValue = (): string => {
        switch (field) {
            case RuleConditionFieldEnum.AMOUNT:
                return operator === RuleConditionOperatorEnum.BETWEEN ? t`${fromAmount} and ${toAmount}` : fromAmount;
            case RuleConditionFieldEnum.ACCOUNT_ID:
                return parts.length > 1
                    ? t({ message: plural(parts.length, { one: '# account', other: '# accounts' }) })
                    : (account?.title ?? EMPTY_VALUE);
            case RuleConditionFieldEnum.MCC_CODE: {
                const mccCategory = parts.length === 1 ? (mccCategories.find(({ mcc }) => mcc === parts[0]) ?? null) : null;

                return isDefined(mccCategory) ? `${mccCategory.mcc} · ${mccCategory.shortDescription}` : translateParts(part => part);
            }
            case RuleConditionFieldEnum.TRANSACTION_TYPE:
                return translateParts(part => (isEnumValue(part, TransactionTypeEnum) ? t(TRANSACTION_TYPE[part]) : part));
            case RuleConditionFieldEnum.EXTERNAL_SOURCE:
                return translateParts(part => (isEnumValue(part, ExternalSourceEnum) ? t(EXTERNAL_SOURCE[part]) : part));
            case RuleConditionFieldEnum.TITLE:
            case RuleConditionFieldEnum.COMMENT:
            default:
                return isNotEmptyString(value.trim()) ? `“${value}”` : EMPTY_VALUE;
        }
    };

    const resolvedValue = resolveValue();

    return {
        fieldLabel: t(RULE_CONDITION_FIELD[field].label),
        field: t(RULE_CONDITION_FIELD[field].phrase),
        operator: t(RULE_CONDITION_OPERATOR[operator].phrase),
        value: resolvedValue,
        hasValue: resolvedValue !== EMPTY_VALUE && isNotEmptyString(value.trim())
    };
};
