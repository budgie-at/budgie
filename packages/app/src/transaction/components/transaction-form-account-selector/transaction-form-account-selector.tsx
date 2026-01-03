import { AccountTypeEnum, TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn, UseFormSetValue } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountSelector } from '../../../account/component/account-selector/account-selector';

const EXCLUDED_ACCOUNT_TYPES = [AccountTypeEnum.DEBT];

interface Props {
    readonly control: Control<TransactionCreateInputInterface>;
    readonly setValue: UseFormSetValue<TransactionCreateInputInterface>;
    readonly entries: TransactionEntryCreateInputInterface[];
    readonly variant: ColorPaletteVariant;
    readonly fieldName: 'fromAccountId' | 'toAccountId';
}

export const TransactionFormAccountSelector = ({ control, setValue, entries, variant, fieldName }: Props) => {
    const { t } = useLingui();

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
        const status = invalid ? 'error' : 'default';

        return (
            <FormItem label={t`Account`} error={error?.message}>
                <AccountSelector
                    status={status}
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
