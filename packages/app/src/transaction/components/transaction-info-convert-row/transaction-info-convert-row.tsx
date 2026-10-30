import { useLingui } from '@lingui/react/macro';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { TransactionActionsMenuItemInterface } from '../../interface/transaction-actions-menu-item.interface';

interface Props {
    readonly message?: string;
    readonly items: readonly TransactionActionsMenuItemInterface[];
}

export const TransactionInfoConvertRow = ({ items, message }: Props) => {
    const { t } = useLingui();
    const handlePress = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                { message, options: [t`Cancel`, ...items.map(item => item.label)], cancelButtonIndex: 0 },
                index => {
                    if (index > 0) {
                        const item = items.at(index - 1);
                        if (isDefined(item)) {
                            item.onPress();
                        }
                    }
                }
            );
        } else {
            Alert.alert(
                t`More Actions…`,
                message,
                items.map(item => ({ text: item.label, onPress: item.onPress })),
                { cancelable: true }
            );
        }
    };

    return <TransactionInfoActionRow label={t`More Actions…`} onPress={handlePress} testID={TransactionInfoPageSelector.ConvertButton} />;
};
