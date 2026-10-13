import { useRouter } from 'expo-router';

import { usePopoverMenuAnchor } from '../../../@generic/hook/use-popover-menu-anchor.hook';

export const useDepositAccountActionsMenu = (accountId: number, handleCloseDeposit: () => void) => {
    const router = useRouter();
    const { anchor, closeMenu, handleCloseComplete, handleToggleMenu, isMenuOpen } = usePopoverMenuAnchor();

    const handleEditPress = () => {
        closeMenu(() => void router.navigate({ pathname: '/account/[id]/update', params: { id: String(accountId) } }));
    };

    const handleCloseDepositPress = () => {
        closeMenu(handleCloseDeposit);
    };

    return {
        anchor,
        closeMenu,
        handleCloseComplete,
        handleCloseDepositPress,
        handleEditPress,
        handleToggleMenu,
        isMenuOpen
    };
};
