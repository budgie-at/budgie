import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, UseFormSetValue, useWatch } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { EmptyFn } from '@rnw-community/shared';

import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
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
    readonly title: string;
    readonly buttonText: string;
    readonly variant: ColorPaletteVariant;
}

export const TransferTransactionForm = ({ onSubmit, icon, control, setValue, title, buttonText, variant }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const fromAccountId = useWatch({
        control,
        name: 'fromAccountId'
    });
    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);

    const handleAmountChange = (amount: number) => {
        setValue('entries.0.amount', amount);
        setValue('entries.1.amount', amount);
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
