import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { KeyboardDoneAccessory } from '../../../@generic/component/keyboard-done-accessory/keyboard-done-accessory';
import { ScaledIcon } from '../../../@generic/component/scaled-icon/scaled-icon';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useInstallmentAmountLabel } from '../../hook/use-installment-amount-label.hook';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { InstallmentSplitInterface } from '../../interface/installment-split.interface';
import type { UseControllerReturn } from 'react-hook-form';

interface Props {
    readonly instrumentSymbol: string;
    readonly split: Pick<InstallmentSplitInterface, 'baseAmount' | 'feeAmount' | 'feePercent' | 'isCustomTotal'>;
    readonly onEditingChange: (isEditing: boolean) => void;
}

const COLLAPSED_STATE = { expanded: false };
const EXPANDED_STATE = { expanded: true };
const PERCENT_BASE = 100;

export const ConvertToInstallmentFee = ({ instrumentSymbol, split, onEditingChange }: Props) => {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const [isExpanded, setIsExpanded] = useState(false);
    const formatAmount = useInstallmentAmountLabel();
    const { control } = useFormContext<ConvertToInstallmentFormValues>();

    const handleToggleExpanded = () => {
        onEditingChange(!isExpanded);
        setIsExpanded(!isExpanded);
    };

    const formattedFee = formatAmount(split.feeAmount, instrumentSymbol, true);

    if (!isExpanded) {
        const formattedPercent = intl.formatNumber(split.feePercent / PERCENT_BASE, { style: 'percent', maximumFractionDigits: 2 });
        const [feeValue, feeAccessibilityLabel] = isPositiveNumber(split.feePercent)
            ? [`${formattedPercent} · ${formattedFee}`, t`Fee ${formattedPercent}, ${formattedFee}`]
            : [t`No fee`, t`Fee, no fee`];
        const collapsedHint = split.isCustomTotal ? t`Splits your total into the purchase and a fee` : t`Adds a fee to the plan total`;

        return (
            <HapticPressable
                className="min-h-14 flex-row items-center gap-x-xs rounded-[28px] bg-surface-fill px-3xl active:opacity-80"
                onPress={handleToggleExpanded}
                accessibilityRole="button"
                accessibilityLabel={feeAccessibilityLabel}
                accessibilityHint={collapsedHint}
                accessibilityState={COLLAPSED_STATE}
                testID={ConvertToInstallmentModalSelector.FeeButton}
            >
                <Text className="flex-1 text-md font-medium text-primary">
                    <Trans>Fee</Trans>
                </Text>
                <Text className="shrink text-right text-md text-secondary-foreground tabular-nums">{feeValue}</Text>
                <ScaledIcon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
            </HapticPressable>
        );
    }

    const formattedBase = formatAmount(split.baseAmount, instrumentSymbol);

    const render = ({ field: { value, onChange } }: UseControllerReturn<ConvertToInstallmentFormValues, 'feePercent'>) => (
        <AmountInput
            value={value}
            onChangeValue={onChange}
            onBlur={handleToggleExpanded}
            autoFocus
            selectTextOnFocus
            borderless
            placeholder="0"
            inputAccessoryViewID={ConvertToInstallmentModalSelector.FeeKeyboardDone}
            inputClassName="h-auto min-h-[44px] min-w-[44px] px-0 text-right text-md font-semibold text-primary tabular-nums"
            accessibilityLabel={t`Fee, percent`}
            accessibilityHint={t`Percent of the plan total before the fee`}
            testID={ConvertToInstallmentModalSelector.FeeInput}
        />
    );

    return (
        <View className="min-h-14 justify-center gap-y-xxs rounded-[28px] bg-surface-fill px-3xl py-md" accessibilityState={EXPANDED_STATE}>
            <View className="flex-row flex-wrap items-center justify-between gap-x-md">
                <Text className="text-md font-medium text-primary">
                    <Trans>Fee</Trans>
                </Text>
                <View className="-my-[10px] flex-row items-center">
                    <Controller control={control} name="feePercent" render={render} />
                    <Text className="text-md font-semibold text-primary">%</Text>
                </View>
            </View>
            <View className="flex-row flex-wrap items-baseline justify-between gap-x-md">
                <Text className="shrink text-sm text-secondary-foreground tabular-nums">
                    <Trans>of {formattedBase} before the fee</Trans>
                </Text>
                <Text className="ml-auto text-right text-sm text-secondary-foreground tabular-nums">{formattedFee}</Text>
            </View>
            <KeyboardDoneAccessory nativeID={ConvertToInstallmentModalSelector.FeeKeyboardDone} />
        </View>
    );
};
