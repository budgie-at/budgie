import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ScaledIcon } from '../../../@generic/component/scaled-icon/scaled-icon';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { useInstallmentAmountLabel } from '../../hook/use-installment-amount-label.hook';
import { ConvertToInstallmentTotalInput } from '../convert-to-installment-total-input/convert-to-installment-total-input';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { InstallmentSplitInterface } from '../../interface/installment-split.interface';

interface Props {
    readonly instrumentSymbol: string;
    readonly split: Pick<InstallmentSplitInterface, 'planTotal' | 'feeAmount' | 'isCustomTotal'>;
}

export const ConvertToInstallmentTotal = ({ instrumentSymbol, split }: Props) => {
    const { t } = useLingui();
    const [isEditing, setIsEditing] = useState(false);
    const formatAmount = useInstallmentAmountLabel();
    const { setValue } = useFormContext<ConvertToInstallmentFormValues>();
    const { planTotal, feeAmount, isCustomTotal } = split;

    const handleToggleEditing = () => {
        setIsEditing(previous => !previous);
    };

    const handleResetTotal = () => {
        setValue('totalAmount', null, { shouldDirty: true, shouldValidate: true });
    };

    const formattedTotal = formatAmount(planTotal, instrumentSymbol);
    const formattedFee = formatAmount(feeAmount, instrumentSymbol);
    const accessibilityLabel = isPositiveNumber(feeAmount)
        ? t`Plan total ${formattedTotal}, includes ${formattedFee} fee`
        : t`Plan total ${formattedTotal}`;

    if (isEditing) {
        return (
            <ConvertToInstallmentTotalInput planTotal={planTotal} instrumentSymbol={instrumentSymbol} onEndEditing={handleToggleEditing} />
        );
    }

    return (
        <View className="flex-row flex-wrap items-center justify-center gap-x-md">
            <HapticPressable
                className="min-h-[44px] flex-row items-center gap-x-xs active:opacity-60"
                onPress={handleToggleEditing}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={t`Edits the total of the plan`}
                testID={ConvertToInstallmentModalSelector.TotalButton}
            >
                <Text className="text-md font-medium text-primary tabular-nums">
                    <Trans>Total {formattedTotal}</Trans>
                </Text>
                <ScaledIcon icon={UserIconNameEnum.Pencil} size={14} className="text-secondary-foreground" />
            </HapticPressable>
            {isCustomTotal ? (
                <Pressable
                    className="min-h-[44px] flex-row items-center gap-x-xs px-md active:opacity-60"
                    onPress={handleResetTotal}
                    accessibilityRole="button"
                    accessibilityHint={t`Goes back to the total worked out from the payments and fee`}
                >
                    <ScaledIcon icon={UserIconNameEnum.RotateCcw} size={12} className="text-secondary-foreground" />
                    <Text className="text-sm font-medium text-primary">
                        <Trans>Reset total</Trans>
                    </Text>
                </Pressable>
            ) : null}
        </View>
    );
};
