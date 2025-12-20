import { useLingui } from '@lingui/react/macro';
import { Control, UseFormSetValue } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { EmptyFn } from '@rnw-community/shared';

import { IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TransactionCreateInputInterface } from '../../schema/transaction-create-input.schema';
import { TransactionFormAmountBase } from '../transaction-form-amount/transaction-form-amount-base';
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

    const handleAmountChange = (amount: number) => {
        setValue('amount', amount);
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
                    instrumentSymbol={defaultInstrument.symbol}
                    onAmountChange={handleAmountChange}
                />

                <TransactionFormMetadataFields variant={variant} control={control} />
            </KeyboardAwareScrollView>
        </TransactionFormLayout>
    );
};
