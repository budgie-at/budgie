import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { UseControllerReturn } from 'react-hook-form';

interface Props {
    readonly instrumentSymbol: string;
}

const PERCENT_DIVISOR = 100;

export const ConvertToInstallmentFee = ({ instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const [isExpanded, setIsExpanded] = useState(false);
    const { control } = useFormContext<ConvertToInstallmentFormValues>();
    const [feePercent, totalAmount] = useWatch({ control, name: ['feePercent', 'totalAmount'] });

    const handleExpand = () => {
        setIsExpanded(true);
    };

    if (!isExpanded) {
        return (
            <HapticPressable className="self-start py-xs" onPress={handleExpand} testID={ConvertToInstallmentModalSelector.AddFeeButton}>
                <Text className="text-sm font-medium text-secondary-foreground">
                    <Trans>+ Add fee</Trans>
                </Text>
            </HapticPressable>
        );
    }

    const feeAmount = totalAmount - totalAmount / (1 + feePercent / PERCENT_DIVISOR);
    const formattedFeeAmount = formatDigits(feeAmount, instrumentSymbol);

    const render = ({ field: { value, onChange } }: UseControllerReturn<ConvertToInstallmentFormValues, 'feePercent'>) => (
        <AmountInput
            value={value}
            onChangeValue={onChange}
            autoFocus
            selectTextOnFocus
            inputClassName="w-20 text-right"
            testID={ConvertToInstallmentModalSelector.FeeInput}
        />
    );

    return (
        <View className="gap-y-xs">
            <View className="flex-row items-center gap-x-md">
                <Text className="text-sm text-primary">
                    <Trans>Fee</Trans>
                </Text>
                <Controller control={control} name="feePercent" render={render} />
                <Text className="text-sm text-primary">%</Text>
                {isPositiveNumber(feePercent) ? (
                    <ProtectedText className="flex-1 text-right text-sm text-secondary-foreground tabular-nums" numberOfLines={1}>
                        {t`includes fee ${formattedFeeAmount}`}
                    </ProtectedText>
                ) : null}
            </View>
            <Text className="text-xs text-secondary-foreground">
                <Trans>Usually 0% up to 4 months</Trans>
            </Text>
        </View>
    );
};
