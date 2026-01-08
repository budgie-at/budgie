import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode, useRef } from 'react';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { IconSelectorBottomSheet } from '../icon-selector-bottom-sheet/icon-selector-bottom-sheet';

interface Props {
    readonly trigger: ReactNode;
    readonly icon: UserIconNameEnum;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (icon: UserIconNameEnum) => void;
}

export const IconSelector = ({ onSelect, icon, variant, trigger }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <HapticPressable onPress={handleOpen}>{trigger}</HapticPressable>

            <IconSelectorBottomSheet variant={variant} onSelect={onSelect} ref={ref} selectedIcon={icon} />
        </>
    );
};
