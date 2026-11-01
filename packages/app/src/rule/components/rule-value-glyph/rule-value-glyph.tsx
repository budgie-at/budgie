import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly variant: ColorPaletteVariant;
}

export const RuleValueGlyph = ({ icon, variant }: Props) => (
    <CircleIcon
        icon={icon}
        variant={variant}
        size={26}
        iconSize={14}
        radius={13}
        border={false}
        className={TONAL_DISC_BACKGROUND[variant]}
    />
);
