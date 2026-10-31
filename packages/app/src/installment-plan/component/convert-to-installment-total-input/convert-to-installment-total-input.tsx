import { AmountField, AmountFieldInput, AmountFieldPrefix } from '@budgie/amount-input';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { KeyboardDoneAccessory } from '../../../@generic/component/keyboard-done-accessory/keyboard-done-accessory';
import { useAmountFormat } from '../../../@generic/hook/use-amount-format.hook';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';

interface Props {
    readonly planTotal: number;
    readonly instrumentSymbol: string;
    readonly onEndEditing: () => void;
}

const HUGGING_INPUT_STYLE = { flexGrow: 0 };

export const ConvertToInstallmentTotalInput = ({ planTotal, instrumentSymbol, onEndEditing }: Props) => {
    const { t } = useLingui();
    const [typedTotal, setTypedTotal] = useState(() => convertFromMicroUnits(planTotal));
    const { setValue } = useFormContext<ConvertToInstallmentFormValues>();
    const amountFormat = useAmountFormat(2);

    const handleChangeValue = (value: number) => {
        setTypedTotal(value);
        setValue('totalAmount', value, { shouldDirty: true, shouldValidate: true });
    };

    return (
        <>
            <AmountField fontSize={24} className="min-h-[44px] w-full justify-center">
                <View className="flex-1" />
                <AmountFieldPrefix className="font-medium text-secondary-foreground">{instrumentSymbol}</AmountFieldPrefix>
                <AmountFieldInput
                    value={typedTotal}
                    format={amountFormat}
                    onChangeValue={handleChangeValue}
                    onEndEditing={onEndEditing}
                    autoFocus
                    selectTextOnFocus
                    textAlign="center"
                    inputAccessoryViewID={ConvertToInstallmentModalSelector.TotalKeyboardDone}
                    className="font-medium text-primary"
                    accessibilityLabel={t`Plan total`}
                    accessibilityHint={t`The exact amount you will pay, fee included`}
                    testID={ConvertToInstallmentModalSelector.TotalInput}
                    style={HUGGING_INPUT_STYLE}
                />
                <View className="flex-1" />
            </AmountField>
            <KeyboardDoneAccessory nativeID={ConvertToInstallmentModalSelector.TotalKeyboardDone} />
        </>
    );
};
