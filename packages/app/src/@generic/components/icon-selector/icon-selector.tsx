import { UserIconNameEnum } from '@budgie/contracts';
import { useRef } from 'react';
import { Keyboard } from 'react-native';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { IconSelectorBottomSheet } from '../icon-selector-bottom-sheet/icon-selector-bottom-sheet';
import { IconSelectorCardBig } from '../icon-selector-card-big/icon-selector-card-big';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly onSelect: (icon: UserIconNameEnum) => void;
}

export const IconSelector = ({ onSelect, icon }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const openIconSelector = () => {
        ref.current?.open();
        Keyboard.dismiss();
    };

    return (
        <>
            <IconSelectorCardBig name={UserIconNameEnum.Home} icon={icon} onPress={openIconSelector} />

            <IconSelectorBottomSheet variant="default" onSelect={onSelect} ref={ref} selectedIcon={icon} />
        </>
    );
};
