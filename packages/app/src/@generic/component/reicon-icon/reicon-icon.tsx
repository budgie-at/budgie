import { ReiconIconNameEnum } from '@budgie/contracts';
import Svg from 'react-native-svg';
import { withUniwind } from 'uniwind';

import { isDefined } from '@rnw-community/shared';

import REICON_GLYPHS from '../../constant/reicon-glyphs.json';
import { resolveReiconIcon } from '../../utils/resolve-reicon-icon.util';
import { IconSelector } from '../icon/icon.selector';
import { ReiconGlyphElement } from '../reicon-glyph-element/reicon-glyph-element';

import type { ReiconGlyphElementInterface } from '../../interface/reicon-glyph-element.interface';
import type { UserIconNameEnum } from '@budgie/contracts';
import type { IconProps } from 'reicon-react-native';
import type { ApplyUniwind } from 'uniwind';

interface Props extends ApplyUniwind<Omit<IconProps, 'secondaryColor'>> {
    readonly icon: UserIconNameEnum | ReiconIconNameEnum;
}

const StyledSvg = withUniwind(Svg);
const OUTLINE_GLYPHS: Partial<Record<ReiconIconNameEnum, readonly ReiconGlyphElementInterface[]>> = REICON_GLYPHS.outline;
const FILLED_GLYPHS: Partial<Record<ReiconIconNameEnum, readonly ReiconGlyphElementInterface[]>> = REICON_GLYPHS.filled;
const FALLBACK_GLYPH = OUTLINE_GLYPHS[ReiconIconNameEnum.HELP_CIRCLE] ?? [];

export const ReiconIcon = ({ icon, size = 24, weight, strokeWidth, testID, ...rest }: Props) => {
    const reiconIcon = resolveReiconIcon(icon);
    const filledGlyph = weight === 'Filled' ? FILLED_GLYPHS[reiconIcon] : null;
    const glyph = filledGlyph ?? OUTLINE_GLYPHS[reiconIcon];
    const isFallback = !isDefined(glyph);
    const elements = glyph ?? FALLBACK_GLYPH;
    const svgTestID = isFallback ? IconSelector.Fallback : testID;

    return (
        <StyledSvg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest} testID={svgTestID}>
            {elements.map((element, index) => (
                <ReiconGlyphElement key={`${element.tag}-${index}`} element={element} strokeWidth={strokeWidth} />
            ))}
        </StyledSvg>
    );
};
