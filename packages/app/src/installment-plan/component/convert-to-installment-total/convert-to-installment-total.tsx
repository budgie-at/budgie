import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Pressable } from 'react-native';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { INSTALLMENT_TOTAL_HERO_FONT_SIZE } from '../../constant/installment-total-hero-font-size.constant';
import { ConvertToInstallmentTotalInput } from '../convert-to-installment-total-input/convert-to-installment-total-input';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { ConvertToInstallmentModalParamsInterface } from '../../interface/convert-to-installment-modal-params.interface';

interface Props {
    readonly params: Pick<ConvertToInstallmentModalParamsInterface, 'amount' | 'instrumentSymbol'>;
}

export const ConvertToInstallmentTotal = ({ params }: Props) => {
    const { t } = useLingui();
    const [, hapticImpact] = useVibration();
    const [isEditing, setIsEditing] = useState(false);
    const formatDigits = useFormatDigits(useAtomValue(decimalPlacesAtom));
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

    if (isEditing) {
        return <ConvertToInstallmentTotalInput instrumentSymbol={params.instrumentSymbol} onEndEditing={handleEndEditing} />;
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
                fontSize={INSTALLMENT_TOTAL_HERO_FONT_SIZE}
                maxFontSize={INSTALLMENT_TOTAL_HERO_FONT_SIZE}
                {...(reducedMotion && { hasAnimation: false })}
            >
                {totalAmount}
            </ProtectedMoney>
        </Pressable>
    );
};
