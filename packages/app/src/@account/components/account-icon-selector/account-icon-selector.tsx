import { useRef } from 'react';
import { Keyboard, Pressable } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { IconSelectorBottomSheet } from '../../../@generic/components/icon-selector-bottom-sheet/icon-selector-bottom-sheet';
import { ICONS, IconName } from '../../../@generic/constant/icons.constant';

interface Props {
    icon: IconName;
    onSelect: (icon: IconName) => void;
}

export const AccountIconSelector = ({ onSelect, icon }: Props) => {
    const ref = useRef<{ open: EmptyFn }>(null);

    const openIconSelector = () => {
        ref.current?.open();
        Keyboard.dismiss();
    };

    return (
        <>
            <Pressable onPress={openIconSelector}>
                <CircleIcon className={'rounded-[16px] bg-default-background/5'} size={'3xl'} variant={'default'} icon={ICONS[icon]} />
            </Pressable>

            <IconSelectorBottomSheet onSelect={onSelect} ref={ref} selectedIcon={icon} />
        </>
    );
};
