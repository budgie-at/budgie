import { useRouter } from 'expo-router';

import { EmptyFn } from '@rnw-community/shared';

import { usePopoverMenuAnchor } from '../../../@generic/hook/use-popover-menu-anchor.hook';

export const useAccountActionsMenu = (accountId: number, handleCloseDeposit: EmptyFn, handleArchive: EmptyFn) => {
    const router = useRouter();
    const { anchor, closeMenu, handleCloseComplete, handleToggleMenu, isMenuOpen } = usePopoverMenuAnchor();

    const handleEditPress = () => {
        closeMenu(() => void router.navigate({ pathname: '/account/[id]/update', params: { id: String(accountId) } }));
    };

    const handleCloseDepositPress = () => {
        closeMenu(handleCloseDeposit);
    };

    const handleArchivePress = () => {
        closeMenu(handleArchive);
    };

    return {
        anchor,
        closeMenu,
        handleArchivePress,
        handleCloseComplete,
        handleCloseDepositPress,
        handleEditPress,
        handleToggleMenu,
        isMenuOpen
    };
};
