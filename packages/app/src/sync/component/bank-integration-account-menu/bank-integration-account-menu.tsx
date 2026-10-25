import { UserIconNameEnum } from '@budgie/contracts';
import { ExternalAccountService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { useEffectAction } from '../../../@generic/hook/use-effect-action.hook';
import { usePopoverMenuAnchor } from '../../../@generic/hook/use-popover-menu-anchor.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
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
    const [runMarkExternal, isMarkingExternal] = useEffectAction(t`Could not mark account as external`);

    const handleDetailsPress = () =>
        void closeMenu(() => void router.navigate({ pathname: '/account/[id]/details', params: { id: String(accountId) } }));
    const handleEditPress = () =>
        void closeMenu(() => void router.navigate({ pathname: '/account/[id]/update', params: { id: String(accountId) } }));
    const handleArchivePress = () => void closeMenu(() => void handleArchive());
    const handleMarkExternal = async () => {
        const confirmed = await confirmAlert({
            title: t`Mark as External?`,
            message: t`This account will be archived and its transfers will become income and expenses on your other accounts. This cannot be undone.`,
            confirmText: t`Mark External`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (!confirmed) {
            return;
        }

        runMarkExternal(Effect.flatMap(ExternalAccountService, externalAccountService => externalAccountService.markExternal(accountId)));
    };
    const handleExternalPress = () => void closeMenu(() => void handleMarkExternal());

    const isBusy = isLoading || isMarkingExternal;

    return (
        <View>
            <View collapsable={false}>
                <HapticPressable
                    className="items-center justify-center"
                    onPress={handleToggleMenu}
                    hitSlop={12}
                    disabled={isBusy}
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
                        icon={UserIconNameEnum.ArrowUpRight}
                        label={t`External account`}
                        onPress={handleExternalPress}
                        {...testID(rowTestID, TestIDPartEnum.MENU, TestIDPartEnum.EXTERNAL)}
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
