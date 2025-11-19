import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Keyboard, View } from 'react-native';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { IconDisplayCardSize } from '../../type/icon-display-card-size.type';
import { IconDisplayCard } from '../icon-display-card/icon-display-card';
import { IconSelectorBottomSheet } from '../icon-selector-bottom-sheet/icon-selector-bottom-sheet';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly size: IconDisplayCardSize;
    readonly onSelect: (icon: UserIconNameEnum) => void;
}

export const IconSelector = ({ onSelect, icon, size }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { t } = useLingui();

    const openIconSelector = () => {
        ref.current?.open();
        Keyboard.dismiss();
    };

    const description = size === 'md' ? t`Tap to change icon` : '';

    const hints = {
        sm: '',
        md: t`Change`,
        lg: t`Browse`
    }

    return (
        <View>
            <IconDisplayCard
                size={size}
                icon={icon}
                onPress={openIconSelector}
                variant="default"
                description={description}
                hint={hints[size]}
            />

            <IconSelectorBottomSheet variant="default" onSelect={onSelect} ref={ref} selectedIcon={icon} />
        </View>
    );
};
