import {
    RuleConditionFieldEnum,
    RuleConditionOperatorEnum,
    RuleCreateInputInterface,
    TransactionTypeEnum
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { useSearchAccountsSortedQuery } from '../../../account/query/use-search-accounts-sorted.query';
import { RuleActionBottomSheetSelector } from '../rule-action-bottom-sheet-selector/rule-action-bottom-sheet-selector';
import { RuleIconSlot } from '../rule-icon-slot/rule-icon-slot';

interface Props {
    readonly index: number;
}

export const RuleActionAccountSelector = ({ index }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const accountId = useWatch({ control, name: `actions.${index}.accountId` });
    const conditions = useWatch({ control, name: 'conditions' });
    const { accounts } = useSearchAccountsSortedQuery('');

    const isExpenseTypeCondition = conditions.some(
        condition =>
            condition.field === RuleConditionFieldEnum.TRANSACTION_TYPE &&
            condition.operator === RuleConditionOperatorEnum.EQUALS &&
            condition.value === TransactionTypeEnum.EXPENSE
    );

    const label = isExpenseTypeCondition ? t`Transfer To Account` : t`Transfer From Account`;

    const selectedAccount = accounts.find(account => account.id === accountId);
    const options = accounts.map(account => ({
        value: account.id,
        label: account.title,
        iconSlot: <RuleIconSlot icon={account.icon} />
    }));

    const renderSelector = ({
        field: { value, onChange }
    }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.accountId`>) => (
        <RuleActionBottomSheetSelector
            value={value}
            onChange={onChange}
            options={options}
            label={label}
            sheetTitle={t`Select Account`}
            displayValue={selectedAccount?.title ?? t`Select Account`}
        />
    );

    return <Controller control={control} name={`actions.${index}.accountId`} render={renderSelector} />;
};
