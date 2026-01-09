import { AccountTypeEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountSelector } from '../../../account/component/account-selector/account-selector';

const EXCLUDED_ACCOUNT_TYPES = [AccountTypeEnum.DEBT];

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly fieldName: 'fromAccountId' | 'toAccountId';
}

export const TransactionFormAccountSelector = ({ variant, fieldName }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const entries = useWatch({ control, name: 'entries' });

    const handleAccountChange = (newAccountId: number) => {
        setValue(fieldName, newAccountId);
        entries.forEach((_, index) => {
            setValue(`entries.${index}.accountId`, newAccountId);
        });
    };

    const renderAccountSelector = ({
        field: { value },
        fieldState: { error, invalid }
    }: UseControllerReturn<TransactionCreateInputInterface, typeof fieldName>) => {
        const cardVariant = invalid ? 'destructive' : 'primary';

        return (
            <FormItem label={t`Account`} error={error?.message}>
                <AccountSelector
                    cardVariant={cardVariant}
                    variant={variant}
                    accountId={value}
                    onSelect={handleAccountChange}
                    excludeAccountTypes={EXCLUDED_ACCOUNT_TYPES}
                    emptyStateDescription={t`Create your first account to start tracking transactions`}
                />
            </FormItem>
        );
    };

    return <Controller render={renderAccountSelector} name={fieldName} control={control} />;
};
