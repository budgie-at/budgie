import { AccountTypeEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Control, UseFormClearErrors, UseFormSetError, UseFormSetValue, useWatch } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { EmptyFn } from '@rnw-community/shared';

import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TransactionFormAmountBase } from '../transaction-form-amount/transaction-form-amount-base';
import { TransactionFormComment } from '../transaction-form-comment/transaction-form-comment';
import { TransactionFormLayout } from '../transaction-form-layout/transaction-form-layout';
import { TransactionFormMetadataFields } from '../transaction-form-meta-fields/transaction-form-meta-fields';

import { TransferTransactionFormAccounts } from './transfer-transaction-form-accounts';

interface Props {
    readonly icon: IconName;
    readonly onSubmit: EmptyFn;
    readonly control: Control<TransactionCreateInputInterface>;
    readonly setValue: UseFormSetValue<TransactionCreateInputInterface>;
    readonly setError: UseFormSetError<TransactionCreateInputInterface>;
    readonly clearErrors: UseFormClearErrors<TransactionCreateInputInterface>;
    readonly title: string;
    readonly buttonText: string;
    readonly variant: ColorPaletteVariant;
}

export const TransferTransactionForm = (props: Props) => {
    const { onSubmit, icon, control, setValue, setError, clearErrors, title, buttonText, variant } = props;
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const [fromAccountId, amount] = useWatch({
        control,
        name: ['fromAccountId', 'amount']
    });
    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const { balance } = useAccountBalanceQuery(fromAccountId ?? 0);

    const isDebtAccount = account?.type === AccountTypeEnum.DEBT;
    const amountInMicroUnits = convertToMicroUnits(amount);
    const exceedsDebtBalance = isDebtAccount && amountInMicroUnits > balance;

    useEffect(() => {
        if (exceedsDebtBalance) {
            setError('amount', { type: 'custom', message: t`Amount exceeds debt account balance` });
        } else {
            clearErrors('amount');
        }
    }, [exceedsDebtBalance, setError, clearErrors, t]);

    const handleAmountChange = (newAmount: number) => {
        setValue('amount', newAmount);
        setValue('entries.0.amount', newAmount);
        setValue('entries.1.amount', newAmount);
    };

    return (
        <TransactionFormLayout
            icon={icon}
            title={title}
            variant={variant}
            onSubmit={onSubmit}
            buttonText={buttonText}
            description={t`Move Money`}
        >
            <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="pb-7xl"
                showsVerticalScrollIndicator={false}
            >
                <TransferTransactionFormAccounts variant={variant} control={control} setValue={setValue} />

                <TransactionFormAmountBase
                    variant={variant}
                    control={control}
                    instrumentSymbol={account?.instrument.symbol ?? defaultInstrument.symbol}
                    onAmountChange={handleAmountChange}
                />

                <FormLayoutGroup>
                    <TransactionFormMetadataFields variant={variant} control={control} />

                    <TransactionFormComment control={control} />
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </TransactionFormLayout>
    );
};
