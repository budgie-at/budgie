import { UserIconType } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly icon: UserIconType;
    readonly variant: ColorPaletteVariant;
    readonly discVariant?: ColorPaletteVariant;
}

export const SettingsRowIcon = ({ icon, variant, discVariant = variant }: Props) => (
    <CircleIcon
        icon={icon}
        variant={variant}
        size={36}
        iconSize={18}
        radius={18}
        border={false}
        className={TONAL_DISC_BACKGROUND[discVariant]}
    />
);
