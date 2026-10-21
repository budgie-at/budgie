import { ImpactFeedbackStyle } from 'expo-haptics';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { PopoverMenuAnchor } from '../../@generic/component/popover-menu/popover-menu';
import { useVibration } from '../../@generic/hook/use-vibration.hook';

export const useAccountCardMenu = () => {
    const [, hapticImpact] = useVibration();
    const cardRef = useRef<View>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<PopoverMenuAnchor>();

    const openMenu = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        cardRef.current?.measureInWindow((x, y, width, height) => {
            setMenuAnchor({ x, y, width, height });
            setIsMenuOpen(true);
        });
    };
    const closeMenu = () => void setIsMenuOpen(false);

    return { cardRef, isMenuOpen, menuAnchor, openMenu, closeMenu };
};
