import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { getTransactionKeypadLayout } from '../utils/get-transaction-keypad-layout.util';

export const useTransactionKeypadEditing = (initiallyEditing: boolean) => {
    const { t } = useLingui();
    const { fontScale } = useWindowDimensions();
    const [isEditingAmount, setIsEditingAmount] = useState(initiallyEditing);
    const layout = getTransactionKeypadLayout(fontScale);
    const toggleKeypad = () => void setIsEditingAmount(previous => !previous);
    const startEditingAmount = () => void setIsEditingAmount(true);

    return {
        isEditingAmount,
        toggleKeypad,
        startEditingAmount,
        footerHeight: isEditingAmount ? layout.keypadStyle.maxHeight : layout.confirmRowStyle.maxHeight,
        amountAccessoryIcon: isEditingAmount ? UserIconNameEnum.ChevronDown : UserIconNameEnum.Pencil,
        amountAccessibilityHint: isEditingAmount ? t`Done` : t`Enter an amount`
    };
};
