import { useLingui } from '@lingui/react/macro';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { TransactionActionsMenuItemInterface } from '../../interface/transaction-actions-menu-item.interface';

interface Props {
    readonly items: readonly TransactionActionsMenuItemInterface[];
}

export const TransactionInfoConvertRow = ({ items }: Props) => {
    const { t } = useLingui();
    const handlePress = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                { options: [t`Cancel`, ...items.map(item => item.label)], cancelButtonIndex: 0 },
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
                t`Convert…`,
                void 0,
                items.map(item => ({ text: item.label, onPress: item.onPress })),
                { cancelable: true }
            );
        }
    };

    return <TransactionInfoActionRow label={t`Convert…`} onPress={handlePress} testID={TransactionInfoPageSelector.ConvertButton} />;
};
