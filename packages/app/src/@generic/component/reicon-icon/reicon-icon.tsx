import { ReiconIconNameEnum } from '@budgie/contracts';
import Svg, { Path } from 'react-native-svg';
import { withUniwind } from 'uniwind';

import { isDefined } from '@rnw-community/shared';

import REICON_GLYPHS from '../../constant/reicon-glyphs.json';
import { resolveReiconIcon } from '../../utils/resolve-reicon-icon.util';
import { IconSelector } from '../icon/icon.selector';

import type { UserIconNameEnum } from '@budgie/contracts';
import type { IconProps, IconWeight } from 'reicon-react-native';
import type { ApplyUniwind } from 'uniwind';

type Props = ApplyUniwind<Omit<IconProps, 'secondaryColor' | 'weight'>> &
    (
        | { readonly icon: UserIconNameEnum | ReiconIconNameEnum; readonly weight?: never }
        | { readonly icon: ReiconIconNameEnum.STAR; readonly weight: IconWeight }
    );

const StyledSvg = withUniwind(Svg);
const OUTLINE_GLYPHS: Partial<Record<ReiconIconNameEnum, readonly Readonly<Record<string, string | undefined>>[]>> = REICON_GLYPHS.outline;
const FILLED_GLYPHS: Partial<Record<ReiconIconNameEnum, readonly Readonly<Record<string, string | undefined>>[]>> = REICON_GLYPHS.filled;
const FALLBACK_GLYPH = OUTLINE_GLYPHS[ReiconIconNameEnum.HELP_CIRCLE] ?? [];

export const ReiconIcon = ({ icon, size = 24, weight, strokeWidth, testID, ...rest }: Props) => {
    const reiconIcon = resolveReiconIcon(icon);
    const filledGlyph = weight === 'Filled' ? FILLED_GLYPHS[reiconIcon] : null;
    const glyph = filledGlyph ?? OUTLINE_GLYPHS[reiconIcon];
    const paths = glyph ?? FALLBACK_GLYPH;
    const svgTestID = isDefined(glyph) ? testID : IconSelector.Fallback;

    return (
        <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest} testID={svgTestID}>
            {paths.map((path, index) => (
                <Path key={index} {...path} {...(isDefined(strokeWidth) && isDefined(path['strokeWidth']) && { strokeWidth })} />
            ))}
        </StyledSvg>
    );
};
