import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Keyboard, View } from 'react-native';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { IconDisplayCardSize } from '../../type/icon-display-card-size.type';
import { IconDisplayCard } from '../icon-display-card/icon-display-card';
import { IconSelectorBottomSheet } from '../icon-selector-bottom-sheet/icon-selector-bottom-sheet';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly size: IconDisplayCardSize;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (icon: UserIconNameEnum) => void;
}

export const IconSelector = ({ onSelect, icon, size, variant }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { t } = useLingui();

    const openIconSelector = () => {
        ref.current?.open();
        Keyboard.dismiss();
    };

    const description = size === 'sm' ? '' : t`Tap to change icon`;

    const hints = {
        sm: '',
        md: t`Change`,
        lg: t`Browse`
    };

    return (
        <View>
            <IconDisplayCard
                size={size}
                icon={icon}
                variant={variant}
                onPress={openIconSelector}
                description={description}
                hint={hints[size]}
            />

            <IconSelectorBottomSheet variant={variant} onSelect={onSelect} ref={ref} selectedIcon={icon} />
        </View>
    );
};
