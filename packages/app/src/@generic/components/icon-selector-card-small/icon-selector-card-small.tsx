import { UserIconNameEnum } from '@budgie/contracts';

import { EmptyFn } from '@rnw-community/shared';

import { ICONS } from '../../constant/icons.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly className?: string;
    readonly onPress: EmptyFn;
    readonly variant?: ColorPaletteVariant;
}

export const IconSelectorCardSmall = ({ className, icon, onPress, variant = 'default' }: Props) => (
    <HapticPressable onPress={onPress} className={className}>
        <CircleIcon size="3xl" icon={ICONS[icon]} variant={variant} className="rounded-5xl" />
    </HapticPressable>
);
