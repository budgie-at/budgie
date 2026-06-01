import {
    RuleConditionCreateInputInterface,
    RuleConditionFieldEnum,
    RuleConditionOperatorEnum,
    RuleCreateInputInterface,
    TransactionTypeEnum
} from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { isEnumValue } from '../../../@generic/type-guard/is-enum-value.type-guard';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { RuleSelectorField } from '../rule-selector-field/rule-selector-field';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

const hasTransactionTypeCondition = (conditions: RuleConditionCreateInputInterface[], transactionType: TransactionTypeEnum): boolean =>
    conditions.some(
        condition =>
            condition.field === RuleConditionFieldEnum.TRANSACTION_TYPE &&
            condition.operator === RuleConditionOperatorEnum.EQUALS &&
            isEnumValue(condition.value, TransactionTypeEnum) &&
            condition.value === transactionType
    );

const resolveTransferCopy = (hasExpenseCondition: boolean, hasIncomeCondition: boolean) => {
    if (hasExpenseCondition && !hasIncomeCondition) {
        return { label: msg`Transfer To Account`, hint: msg`Matched expenses are converted into a transfer to this account.` };
    }

    if (hasIncomeCondition && !hasExpenseCondition) {
        return { label: msg`Transfer From Account`, hint: msg`Matched income is converted into a transfer from this account.` };
    }

    return {
        label: msg`Transfer Account`,
        hint: msg`Only expense and income transactions are converted: expenses transfer to this account, income transfers from it. Other types are left unchanged.`
    };
};

export const RuleActionAccountSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const [openAccountSelector] = useAccountSelectorModal();

    const accountId = useWatch({ control, name: `actions.${index}.accountId` });
    const conditions = useWatch({ control, name: 'conditions' });
    const { account } = useGetAccountByIdQuery(accountId ?? 0);

    const hasExpenseCondition = hasTransactionTypeCondition(conditions, TransactionTypeEnum.EXPENSE);
    const hasIncomeCondition = hasTransactionTypeCondition(conditions, TransactionTypeEnum.INCOME);
    const { label, hint } = resolveTransferCopy(hasExpenseCondition, hasIncomeCondition);

    const renderSelector = ({ field: { onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.accountId`>) => {
        const handleOpen = async () => {
            const selectedAccountId = await openAccountSelector({ initialAccountId: accountId ?? null, onlyActive: false });

            if (isDefined(selectedAccountId)) {
                onChange(selectedAccountId);
            }
        };

        return (
            <RuleSelectorField
                label={t(label)}
                value={account?.title ?? t`Select Account`}
                hint={t(hint)}
                onPress={handleOpen}
                testID={testID}
            />
        );
    };

    return <Controller control={control} name={`actions.${index}.accountId`} render={renderSelector} />;
};
