import { AccountTypeEnum, TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn, UseFormSetValue, useWatch } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { EmptyFn } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountSelector } from '../../../account/component/account-selector/account-selector';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TransactionFormAmount } from '../transaction-form-amount/transaction-form-amount';
import { TransactionFormCategory } from '../transaction-form-category/transaction-form-category';
import { TransactionFormComment } from '../transaction-form-comment/transaction-form-comment';
import { TransactionFormLayout } from '../transaction-form-layout/transaction-form-layout';
import { TransactionFormMetadataFields } from '../transaction-form-meta-fields/transaction-form-meta-fields';

const EXCLUDED_ACCOUNT_TYPES = [AccountTypeEnum.DEBT];

interface Props {
    readonly onSubmit: EmptyFn;
    readonly onDelete?: EmptyFn;
    readonly control: Control<TransactionCreateInputInterface>;
    readonly icon: IconName;
    readonly setValue: UseFormSetValue<TransactionCreateInputInterface>;
    readonly title: string;
    readonly buttonText: string;
    readonly variant: ColorPaletteVariant;
    readonly transactionType: TransactionTypeEnum;
    readonly accountFieldName: 'toAccountId' | 'fromAccountId';
}

export const LiabilityTransactionForm = (props: Props) => {
    const { onSubmit, transactionType, setValue, control, icon, buttonText, title, variant, accountFieldName, onDelete } = props;
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const accountId = useWatch({ control, name: accountFieldName });
    const entries = useWatch({ control, name: 'entries' });
    const { account } = useGetAccountByIdQuery(accountId ?? 0);
    const instrumentSymbol = account?.instrument.symbol ?? defaultInstrument.symbol;

    const handleAccountChange = (newAccountId: number) => {
        setValue(accountFieldName, newAccountId);
        entries.forEach((_, index) => {
            setValue(`entries.${index}.accountId`, newAccountId);
        });
    };

    const renderAccountSelector = ({
        field: { value },
        fieldState: { error, invalid }
    }: UseControllerReturn<TransactionCreateInputInterface, typeof accountFieldName>) => {
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

    return (
        <TransactionFormLayout
            title={title}
            variant={variant}
            icon={icon}
            onSubmit={onSubmit}
            onDelete={onDelete}
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

                    <TransactionFormCategory
                        transactionType={transactionType}
                        accountId={accountId ?? 0}
                        setValue={setValue}
                        control={control}
                        variant={variant}
                    />

                    <TransactionFormMetadataFields variant={variant} control={control} />

                    <TransactionFormComment control={control} />
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </TransactionFormLayout>
    );
};
