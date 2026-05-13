import { RuleConditionFieldEnum, RuleConditionOperatorEnum, RuleCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
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

export const RuleActionAccountSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const [openAccountSelector] = useAccountSelectorModal();

    const accountId = useWatch({ control, name: `actions.${index}.accountId` });
    const conditions = useWatch({ control, name: 'conditions' });
    const { account } = useGetAccountByIdQuery(accountId ?? 0);

    const isExpenseTypeCondition = conditions.some(
        condition =>
            condition.field === RuleConditionFieldEnum.TRANSACTION_TYPE &&
            condition.operator === RuleConditionOperatorEnum.EQUALS &&
            isEnumValue(condition.value, TransactionTypeEnum) &&
            condition.value === TransactionTypeEnum.EXPENSE
    );

    const label = isExpenseTypeCondition ? t`Transfer To Account` : t`Transfer From Account`;

    const renderSelector = ({ field: { onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.accountId`>) => {
        const handleOpen = async () => {
            const selectedAccountId = await openAccountSelector({ initialAccountId: accountId ?? null });

            if (isDefined(selectedAccountId)) {
                onChange(selectedAccountId);
            }
        };

        return <RuleSelectorField label={label} value={account?.title ?? t`Select Account`} onPress={handleOpen} testID={testID} />;
    };

    return <Controller control={control} name={`actions.${index}.accountId`} render={renderSelector} />;
};
