import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { RuleSelectorButton } from '../rule-selector-button/rule-selector-button';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleConditionAccountSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const [openAccountSelector] = useAccountSelectorModal();

    const value = useWatch({ control, name: `conditions.${index}.value` });
    const accountId = isPositiveNumber(Number(value)) ? Number(value) : 0;
    const { account } = useGetAccountByIdQuery(accountId);
    const displayLabel = account?.title ?? t`Select account`;

    const renderSelector = ({ field: { onChange } }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.value`>) => {
        const handleOpen = async () => {
            const selectedAccountId = await openAccountSelector({
                initialAccountId: isPositiveNumber(accountId) ? accountId : null,
                onlyActive: false
            });

            if (isDefined(selectedAccountId)) {
                onChange(String(selectedAccountId));
            }
        };

        return <RuleSelectorButton testID={testID} value={displayLabel} onPress={handleOpen} />;
    };

    return (
        <FormItem label={t`Value`}>
            <Controller control={control} name={`conditions.${index}.value`} render={renderSelector} />
        </FormItem>
    );
};
