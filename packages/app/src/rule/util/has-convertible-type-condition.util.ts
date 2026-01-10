import {
    RuleConditionCreateInputInterface,
    RuleConditionFieldEnum,
    RuleConditionOperatorEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isEnumValue } from '../../@generic/type-guard/is-enum-value.type-guard';

const CONVERTIBLE_TRANSACTION_TYPES: TransactionTypeEnum[] = [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME];

export const hasConvertibleTypeCondition = (conditions: RuleConditionCreateInputInterface[]): boolean =>
    conditions.some(
        ({ field, operator, value }) =>
            field === RuleConditionFieldEnum.TRANSACTION_TYPE &&
            operator === RuleConditionOperatorEnum.EQUALS &&
            isEnumValue(value, TransactionTypeEnum) &&
            CONVERTIBLE_TRANSACTION_TYPES.includes(value)
    );
