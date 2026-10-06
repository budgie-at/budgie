import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Pressable } from 'react-native';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { ConvertToInstallmentModalParamsInterface } from '../../interface/convert-to-installment-modal-params.interface';
import type { UseControllerReturn } from 'react-hook-form';

interface Props {
    readonly params: Pick<ConvertToInstallmentModalParamsInterface, 'amount' | 'instrumentSymbol'>;
}

const HERO_FONT_SIZE = 48;
const heroInputStyle = { fontSize: HERO_FONT_SIZE, textAlign: 'center' } as const;

export const ConvertToInstallmentTotal = ({ params }: Props) => {
    const { t } = useLingui();
    const [, hapticImpact] = useVibration();
    const [isEditing, setIsEditing] = useState(false);
    const formatDigits = useDisplayFormatDigits();
    const isAmountProtected = useIsAmountProtected();
    const reducedMotion = useReducedMotion();
    const { control } = useFormContext<ConvertToInstallmentFormValues>();
    const totalAmount = useWatch({ control, name: 'totalAmount' });

    const handleStartEditing = () => {
        hapticImpact(ImpactFeedbackStyle.Light);
        setIsEditing(true);
    };

    const handleEndEditing = () => {
        setIsEditing(!isAmountProtected);
    };

    const formattedTotal = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatDigits(totalAmount, params.instrumentSymbol);

    const render = ({ field: { value, onChange } }: UseControllerReturn<ConvertToInstallmentFormValues, 'totalAmount'>) => (
        <AmountInput
            value={value}
            onChangeValue={onChange}
            onEndEditing={handleEndEditing}
            autoFocus
            selectTextOnFocus
            borderless
            valuePrefix={`${params.instrumentSymbol} `}
            inputClassName="h-20 w-full px-0 font-extralight text-primary"
            style={heroInputStyle}
            accessibilityLabel={t`Total`}
            testID={ConvertToInstallmentModalSelector.TotalInput}
        />
    );

    if (isEditing) {
        return <Controller control={control} name="totalAmount" render={render} />;
    }

    return (
        <Pressable
            className="active:scale-xs h-20 w-full justify-center"
            onPress={handleStartEditing}
            accessibilityRole="button"
            accessibilityLabel={formattedTotal}
            accessibilityHint={t`Edits the total of the plan`}
            testID={ConvertToInstallmentModalSelector.TotalButton}
        >
            <ProtectedMoney
                instrumentSymbol={params.instrumentSymbol}
                fontSize={HERO_FONT_SIZE}
                maxFontSize={HERO_FONT_SIZE}
                {...(reducedMotion && { hasAnimation: false })}
            >
                {totalAmount}
            </ProtectedMoney>
        </Pressable>
    );
};
