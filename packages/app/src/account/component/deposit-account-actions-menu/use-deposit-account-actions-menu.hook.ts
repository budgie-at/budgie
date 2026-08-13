import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { EmptyFn, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';

import type { GestureResponderEvent } from 'react-native';

const TRIGGER_SIZE = 40;

export const useDepositAccountActionsMenu = (accountId: number, isLoading: boolean, handleCloseDeposit: () => Promise<void>) => {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchor, setAnchor] = useState<PopoverMenuAnchor>();
    const pendingActionRef = useRef<EmptyFn | null>(null);

    const closeMenu = (afterClose?: EmptyFn) => {
        if (!isMenuOpen) {
            return;
        }

        pendingActionRef.current = afterClose ?? null;
        setIsMenuOpen(false);
    };

    const handleCloseComplete = () => {
        if (isDefined(pendingActionRef.current)) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }
    };

    const handleToggleMenu = (event: GestureResponderEvent) => {
        if (isLoading) {
            return;
        }

        if (isMenuOpen) {
            closeMenu();

            return;
        }

        const { pageX, pageY } = event.nativeEvent;
        const hasValidAnchor = Number.isFinite(pageX) && Number.isFinite(pageY) && isPositiveNumber(pageX) && isPositiveNumber(pageY);

        if (hasValidAnchor) {
            setAnchor({ x: pageX - TRIGGER_SIZE / 2, y: pageY - TRIGGER_SIZE / 2, width: TRIGGER_SIZE, height: TRIGGER_SIZE });
        } else {
            setAnchor(void 0);
        }

        setIsMenuOpen(true);
    };

    const handleEditPress = () => {
        closeMenu(() => void router.navigate({ pathname: '/account/[id]/update', params: { id: String(accountId) } }));
    };

    const handleCloseDepositPress = () => {
        closeMenu(() => void handleCloseDeposit());
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
