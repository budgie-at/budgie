import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { usePopoverMenuAnchor } from '../../../@generic/hook/use-popover-menu-anchor.hook';
import { testID } from '../../../@generic/utils/test-id.util';
import { useArchiveAccount } from '../../../account/hooks/use-archive-account.hook';

interface Props {
    readonly accountId: number;
    readonly rowTestID: string;
}

const TRIGGER_SIZE = 36;
const TRIGGER_ICON_SIZE = 20;

export const BankIntegrationAccountMenu = ({ accountId, rowTestID }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { anchor, closeMenu, handleCloseComplete, handleToggleMenu, isMenuOpen } = usePopoverMenuAnchor();
    const { handleArchive, isLoading } = useArchiveAccount(accountId, emptyFn);

    const handleDetailsPress = () =>
        void closeMenu(() => void router.navigate({ pathname: '/account/[id]/details', params: { id: String(accountId) } }));
    const handleEditPress = () =>
        void closeMenu(() => void router.navigate({ pathname: '/account/[id]/update', params: { id: String(accountId) } }));
    const handleArchivePress = () => void closeMenu(() => void handleArchive());

    return (
        <View>
            <View collapsable={false}>
                <HapticPressable
                    className="items-center justify-center"
                    onPress={handleToggleMenu}
                    hitSlop={12}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel={t`Account actions`}
                    {...testID(rowTestID, TestIDPartEnum.MENU)}
                >
                    <CircleIcon
                        icon={UserIconNameEnum.EllipsisVertical}
                        variant="ghost"
                        size={TRIGGER_SIZE}
                        iconSize={TRIGGER_ICON_SIZE}
                        border={false}
                    />
                </HapticPressable>
            </View>

            <PopoverMenu isOpen={isMenuOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor}>
                <View className="py-sm">
                    <PopoverMenuItem
                        icon={UserIconNameEnum.Info}
                        label={t`Details`}
                        onPress={handleDetailsPress}
                        {...testID(rowTestID, TestIDPartEnum.MENU, TestIDPartEnum.DETAILS)}
                    />
                    <PopoverMenuItem
                        icon={UserIconNameEnum.Pencil}
                        label={t`Edit`}
                        onPress={handleEditPress}
                        {...testID(rowTestID, TestIDPartEnum.MENU, TestIDPartEnum.EDIT)}
                    />
                    <PopoverMenuItem
                        icon={UserIconNameEnum.Archive}
                        label={t`Archive`}
                        onPress={handleArchivePress}
                        variant="destructive"
                        {...testID(rowTestID, TestIDPartEnum.MENU, TestIDPartEnum.ARCHIVE)}
                    />
                </View>
            </PopoverMenu>
        </View>
    );
};
