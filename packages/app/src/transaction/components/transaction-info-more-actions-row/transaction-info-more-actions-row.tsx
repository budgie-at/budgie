import { UserIconNameEnum } from '@budgie/contracts';
import { MenuView } from '@expo/ui/community/menu';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { TransactionInfoActionLabel } from '../transaction-info-action-label/transaction-info-action-label';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { TransactionActionsMenuItemInterface } from '../../interface/transaction-actions-menu-item.interface';
import type { MenuAction, NativeActionEvent } from '@expo/ui/community/menu';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly items: readonly TransactionActionsMenuItemInterface[];
}

export const TransactionInfoMoreActionsRow = ({ items }: Props) => {
    const { t } = useLingui();
    const [width, setWidth] = useState(0);
    const consequences = [...new Set(items.map(item => item.consequence).filter(isDefined))];
    const toAction = (item: TransactionActionsMenuItemInterface): MenuAction => ({ id: item.key, title: item.label });
    const actions: MenuAction[] = [
        ...items.filter(item => !isDefined(item.consequence)).map(toAction),
        ...consequences.map(consequence => ({
            id: consequence,
            title: consequence,
            displayInline: true,
            subactions: items.filter(item => item.consequence === consequence).map(toAction)
        }))
    ];
    const handleLayout = (event: LayoutChangeEvent) => void setWidth(event.nativeEvent.layout.width);
    const handlePressAction = (event: NativeActionEvent) => items.find(item => item.key === event.nativeEvent.event)?.onPress();
    const rowStyle = { width };

    return (
        <View onLayout={handleLayout}>
            <MenuView actions={actions} onPressAction={handlePressAction} testID={TransactionInfoPageSelector.ConvertButton}>
                <TransactionInfoActionLabel icon={UserIconNameEnum.CircleEllipsis} label={t`More Actions…`} style={rowStyle}>
                    <Icon icon={UserIconNameEnum.ChevronRight} size={20} className="text-secondary-foreground" />
                </TransactionInfoActionLabel>
            </MenuView>
        </View>
    );
};
