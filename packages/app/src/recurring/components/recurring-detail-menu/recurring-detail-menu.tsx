import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { ActionsMenuContext } from '../../../@generic/context/actions-menu.context';
import { usePopoverMenuAnchor } from '../../../@generic/hook/use-popover-menu-anchor.hook';
import { isPossibleRecurringSeries } from '../../utils/is-possible-recurring-series.util';
import { RecurringDetailSelector } from '../recurring-detail-content/recurring-detail.selector';
import { RecurringDetailMarkRecurringMenuItem } from '../recurring-detail-mark-recurring-menu-item/recurring-detail-mark-recurring-menu-item';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

interface Props {
    readonly series: RecurringSeriesListItemInterface;
}

export const RecurringDetailMenu = ({ series }: Props) => {
    const { t } = useLingui();
    const { anchor, frameRef, closeMenu, handleCloseComplete, handleToggleMenu, isMenuOpen } = usePopoverMenuAnchor();

    if (!isPossibleRecurringSeries(series)) {
        return null;
    }

    return (
        <View ref={frameRef} collapsable={false}>
            <HapticPressable
                accessibilityRole="button"
                accessibilityLabel={t`More actions`}
                className="min-h-[44px] min-w-[44px] items-center justify-center active:scale-100 active:opacity-70"
                onPress={handleToggleMenu}
                testID={RecurringDetailSelector.MenuButton}
            >
                <Icon icon={UserIconNameEnum.Ellipsis} size={24} className="text-primary" />
            </HapticPressable>

            <PopoverMenu isOpen={isMenuOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor}>
                <ActionsMenuContext value={closeMenu}>
                    <View className="min-w-[240px] py-sm">
                        <RecurringDetailMarkRecurringMenuItem seriesId={series.id} />
                    </View>
                </ActionsMenuContext>
            </PopoverMenu>
        </View>
    );
};
