import { UserIconNameEnum } from '@budgie/contracts';
import { useRef } from 'react';
import { Keyboard, View } from 'react-native';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { IconSelectorBottomSheet } from '../icon-selector-bottom-sheet/icon-selector-bottom-sheet';
import { IconSelectorCardBig } from '../icon-selector-card-big/icon-selector-card-big';
import { IconSelectorCardSmall } from '../icon-selector-card-small/icon-selector-card-small';
import { IconSelectorCardMedium } from '../icon-selector-card-medium/icon-selector-card-medium';

interface Props {
    readonly size: 'sm' | 'md' | 'lg';
    readonly icon: UserIconNameEnum;
    readonly onSelect: (icon: UserIconNameEnum) => void;
}

export const IconSelector = ({ onSelect, icon, size = 'sm' }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const openIconSelector = () => {
        ref.current?.open();
        Keyboard.dismiss();
    };

    return (
        <View>
            {size === 'sm' ? <IconSelectorCardSmall icon={icon} onPress={openIconSelector} /> : null}
            {size === 'md' ? <IconSelectorCardMedium icon={icon} onPress={openIconSelector} /> : null}
            {size === 'lg' ? <IconSelectorCardBig icon={icon} onPress={openIconSelector} /> : null}

            <IconSelectorBottomSheet variant="default" onSelect={onSelect} ref={ref} selectedIcon={icon} />
        </View>
    );
};
