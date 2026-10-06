import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { isPositiveNumber } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { UseControllerReturn } from 'react-hook-form';

interface Props {
    readonly instrumentSymbol: string;
}

const PERCENT_DIVISOR = 100;

export const ConvertToInstallmentFee = ({ instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const [isExpanded, setIsExpanded] = useState(false);
    const { intl } = useI18nContext();
    const formatDigits = useDisplayFormatDigits();
    const { control } = useFormContext<ConvertToInstallmentFormValues>();
    const [feePercent, totalAmount] = useWatch({ control, name: ['feePercent', 'totalAmount'] });

    const handleExpand = () => {
        setIsExpanded(true);
    };

    const formattedFeePercent = intl.formatNumber(feePercent / PERCENT_DIVISOR, { style: 'percent', maximumFractionDigits: 2 });

    if (!isExpanded) {
        return (
            <HapticPressable
                className="self-center rounded-full bg-secondary-background px-xl py-sm"
                onPress={handleExpand}
                accessibilityRole="button"
                accessibilityHint={t`Adds the fee of the plan`}
                testID={ConvertToInstallmentModalSelector.FeeButton}
            >
                <Text className="text-sm font-medium text-secondary-foreground">{t`Fee ${formattedFeePercent}`}</Text>
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
            minimumDecimalPlaces={2}
            selectTextOnFocus
            borderless
            placeholder="0"
            inputClassName="h-auto w-16 px-0 text-right text-md font-semibold text-primary"
            accessibilityLabel={t`Fee, percent`}
            testID={ConvertToInstallmentModalSelector.FeeInput}
        />
    );

    return (
        <Animated.View entering={FadeIn} layout={LinearTransition} className="gap-y-xs">
            <View className="flex-row items-center gap-x-xs rounded-3xl bg-secondary-background px-3xl py-lg">
                <Text className="flex-1 text-md font-semibold text-primary">
                    <Trans>Fee</Trans>
                </Text>
                <Controller control={control} name="feePercent" render={render} />
                <Text className="text-md font-semibold text-primary">%</Text>
            </View>
            <View className="flex-row items-center gap-x-md px-3xl">
                <Text className="flex-1 text-xs text-secondary-foreground">
                    <Trans>Usually 0% up to 4 months</Trans>
                </Text>
                {isPositiveNumber(feePercent) ? (
                    <ProtectedText className="text-xs font-medium text-secondary-foreground tabular-nums" numberOfLines={1}>
                        {t`includes fee ${formattedFeeAmount}`}
                    </ProtectedText>
                ) : null}
            </View>
        </Animated.View>
    );
};
