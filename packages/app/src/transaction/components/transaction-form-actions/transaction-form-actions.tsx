import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useWindowDimensions, View } from 'react-native';

import { TRANSACTION_LARGE_TEXT_SCALE } from '../../constant/transaction-large-text-scale.constant';
import { getTransactionKeypadLayout } from '../../utils/get-transaction-keypad-layout.util';
import { TransactionKeypadButton } from '../transaction-keypad-button/transaction-keypad-button';
import { TransactionKeypadConfirmButton } from '../transaction-keypad-confirm-button/transaction-keypad-confirm-button';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly isDisabled: boolean;
    readonly onConfirm: () => void;
    readonly onCancel: () => void;
    readonly testID?: string;
    readonly children?: ReactNode;
}

export const TransactionFormActions = ({ label, isDisabled, onConfirm, onCancel, testID, children }: Props) => {
    const { t } = useLingui();
    const { fontScale } = useWindowDimensions();
    const { confirmRowStyle } = getTransactionKeypadLayout(fontScale);
    const cancelButtonClassName = fontScale >= TRANSACTION_LARGE_TEXT_SCALE ? 'w-[52px]' : 'flex-1';

    return (
        <View className="flex-1 gap-md">
            {children}
            <View className="flex-1 flex-row gap-md" style={confirmRowStyle}>
                <View className={cancelButtonClassName}>
                    <TransactionKeypadButton icon={UserIconNameEnum.X} variant="cancel" accessibilityLabel={t`Cancel`} onPress={onCancel} />
                </View>
                <TransactionKeypadConfirmButton label={label} isDisabled={isDisabled} onPress={onConfirm} testID={testID} />
            </View>
        </View>
    );
};
