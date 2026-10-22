import { ImpactFeedbackStyle } from 'expo-haptics';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { PopoverMenuAnchor } from '../../@generic/component/popover-menu/popover-menu';
import { useVibration } from '../../@generic/hook/use-vibration.hook';

export const useAccountCardMenu = () => {
    const [, hapticImpact] = useVibration();
    const cardRef = useRef<View>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<PopoverMenuAnchor>();
    const pendingActionRef = useRef<EmptyFn | null>(null);

    const openMenu = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        cardRef.current?.measureInWindow((x, y, width, height) => {
            setMenuAnchor({ x, y, width, height });
            setIsMenuOpen(true);
        });
    };
    const closeMenu = (afterClose?: EmptyFn) => {
        pendingActionRef.current = afterClose ?? pendingActionRef.current;
        setIsMenuOpen(false);
    };
    const handleCloseComplete = () => {
        if (isDefined(pendingActionRef.current)) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }
    };

    return { cardRef, isMenuOpen, menuAnchor, openMenu, closeMenu, handleCloseComplete };
};
