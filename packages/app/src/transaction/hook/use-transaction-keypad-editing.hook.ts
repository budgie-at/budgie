import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

export const useTransactionKeypadEditing = (initiallyEditing: boolean) => {
    const { t } = useLingui();
    const [isEditingAmount, setIsEditingAmount] = useState(initiallyEditing);
    const toggleKeypad = () => void setIsEditingAmount(previous => !previous);
    const startEditingAmount = () => void setIsEditingAmount(true);

    return {
        isEditingAmount,
        toggleKeypad,
        startEditingAmount,
        amountAccessoryIcon: isEditingAmount ? UserIconNameEnum.KeyboardOff : UserIconNameEnum.Pencil,
        amountAccessibilityHint: isEditingAmount ? t`Done` : t`Enter an amount`
    };
};
