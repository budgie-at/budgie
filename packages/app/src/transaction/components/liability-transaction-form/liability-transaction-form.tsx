import { TransactionCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn, UseFormSetValue, useWatch } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { EmptyFn } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/components/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountSelector } from '../../../account/component/account-selector/account-selector';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TransactionFormAmount } from '../transaction-form-amount/transaction-form-amount';
import { TransactionFormCategory } from '../transaction-form-category/transaction-form-category';
import { TransactionFormLayout } from '../transaction-form-layout/transaction-form-layout';
import { TransactionFormMetadataFields } from '../transaction-form-meta-fields/transaction-form-meta-fields';

interface Props {
    readonly onSubmit: EmptyFn;
    readonly control: Control<TransactionCreateEntityInterface>;
    readonly icon: IconName;
    readonly setValue: UseFormSetValue<TransactionCreateEntityInterface>;
    readonly title: string;
    readonly buttonText: string;
    readonly variant: ColorPaletteVariant;
    readonly accountFieldName: 'toAccountId' | 'fromAccountId';
}

export const LiabilityTransactionForm = ({ onSubmit, setValue, control, icon, buttonText, title, variant, accountFieldName }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const accountId = useWatch({ control, name: accountFieldName });
    const { account } = useGetAccountByIdQuery(accountId ?? 0);
    const instrumentSymbol = account?.instrument.symbol ?? defaultInstrument.symbol;

    const handleAccountChange = (accountId: number) => {
        setValue(accountFieldName, accountId);
        setValue('entries.0.accountId', accountId);
    };

    const renderAccountSelector = ({
        field: { value },
        fieldState: { error, invalid }
    }: UseControllerReturn<TransactionCreateEntityInterface, typeof accountFieldName>) => {
        const status = invalid ? 'error' : 'default';

        return (
            <FormItem label={t`Account`} error={error?.message}>
                <AccountSelector
                    status={status}
                    variant={variant}
                    accountId={value}
                    onSelect={handleAccountChange}
                    emptyStateDescription={t`Create your first account to start tracking transactions`}
                />
            </FormItem>
        );
    };

    return (
        <TransactionFormLayout
            title={title}
            variant={variant}
            icon={icon}
            onSubmit={onSubmit}
            buttonText={buttonText}
            description={t`Select Category`}
        >
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="pb-7xl"
                showsVerticalScrollIndicator={false}
            >
                <TransactionFormAmount setValue={setValue} instrumentSymbol={instrumentSymbol} control={control} variant={variant} />

                <FormLayoutGroup>
                    <Controller render={renderAccountSelector} name={accountFieldName} control={control} />

                    <TransactionFormCategory setValue={setValue} control={control} variant={variant} />

                    <TransactionFormMetadataFields variant={variant} control={control} />
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </TransactionFormLayout>
    );
};
