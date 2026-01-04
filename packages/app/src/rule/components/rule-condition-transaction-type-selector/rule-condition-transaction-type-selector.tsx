import { TransactionTypeEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { RuleConditionValueEnumSelector } from '../rule-condition-value-enum-selector/rule-condition-value-enum-selector';

interface Props {
    readonly index: number;
}

const TRANSACTION_TYPE_OPTIONS = [
    { value: TransactionTypeEnum.EXPENSE, label: msg`Expense` },
    { value: TransactionTypeEnum.INCOME, label: msg`Income` },
    { value: TransactionTypeEnum.TRANSFER, label: msg`Transfer` },
    { value: TransactionTypeEnum.DEBT, label: msg`Debt` },
    { value: TransactionTypeEnum.ADJUSTMENT, label: msg`Adjustment` }
];

export const RuleConditionTransactionTypeSelector = ({ index }: Props) => {
    const { t } = useLingui();

    return (
        <RuleConditionValueEnumSelector
            index={index}
            options={TRANSACTION_TYPE_OPTIONS}
            sheetTitle={t`Select Transaction Type`}
            defaultLabel={t`Select type`}
        />
    );
};
