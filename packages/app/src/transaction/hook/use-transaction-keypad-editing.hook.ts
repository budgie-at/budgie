import { useLingui } from '@lingui/react/macro';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';

import { useIsAccessibilityTextSize } from '../../@generic/hook/use-is-accessibility-text-size.hook';

export const useTransactionKeypadEditing = (initiallyEditing: boolean) => {
    const { t } = useLingui();
    const navigation = useNavigation();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const [isEditingAmount, setIsEditingAmount] = useState(initiallyEditing && !isAccessibilityTextSize);
    useEffect(() => navigation.addListener('blur', () => void setIsEditingAmount(false)), [navigation]);
    const toggleKeypad = () => void setIsEditingAmount(previous => !previous);
    const startEditingAmount = () => void setIsEditingAmount(true);

    const dismissKeypad = () => void setIsEditingAmount(false);

    return {
        isEditingAmount,
        toggleKeypad,
        dismissKeypad,
        startEditingAmount,
        amountAccessibilityHint: isEditingAmount ? t`Done` : t`Enter an amount`
    };
};
