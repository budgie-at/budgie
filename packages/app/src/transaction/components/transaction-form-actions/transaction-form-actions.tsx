import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TransactionKeypadButton } from '../transaction-keypad-button/transaction-keypad-button';
import { TransactionKeypadConfirmButton } from '../transaction-keypad-confirm-button/transaction-keypad-confirm-button';

interface Props {
    readonly label: string;
    readonly isDisabled: boolean;
    readonly onConfirm: () => void;
    readonly onCancel?: () => void;
    readonly testID?: string;
}

export const TransactionFormActions = ({ label, isDisabled, onConfirm, onCancel, testID }: Props) => {
    const { t } = useLingui();
    const confirmButton = <TransactionKeypadConfirmButton label={label} isDisabled={isDisabled} onPress={onConfirm} testID={testID} />;

    if (!isDefined(onCancel)) {
        return confirmButton;
    }

    return (
        <View className="flex-row gap-md">
            <View className="w-[64px]">
                <TransactionKeypadButton icon={UserIconNameEnum.X} variant="action" accessibilityLabel={t`Cancel`} onPress={onCancel} />
            </View>
            <View className="flex-1">{confirmButton}</View>
        </View>
    );
};
