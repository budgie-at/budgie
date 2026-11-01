import Svg, { Circle, Path } from 'react-native-svg';
import { withUniwind } from 'uniwind';

import { RuleGlyphEnum } from '../../enum/rule-glyph.enum';

interface Props {
    readonly glyph: RuleGlyphEnum;
    readonly size: number;
    readonly className?: string;
}

const StyledSvg = withUniwind(Svg);
const STROKE = { stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
const EQUAL_PATH = 'm5.5,9.5h13m-13,5h13';
const NOT_EQUAL_SLASH = 'm15.5,5-7,14';
const LENS_HANDLE = 'm19.5,19.5-4.2-4.2';
const LENS_SLASH = 'm7,15,8-8';

export const RuleGlyph = ({ glyph, size, className }: Props) => {
    const isEquality = glyph === RuleGlyphEnum.EQUAL || glyph === RuleGlyphEnum.NOT_EQUAL;
    const isNegated = glyph === RuleGlyphEnum.NOT_EQUAL || glyph === RuleGlyphEnum.NOT_CONTAINS;
    const slashPath = isEquality ? NOT_EQUAL_SLASH : LENS_SLASH;

    return (
        <StyledSvg width={size} height={size} viewBox="0 0 24 24" className={className}>
            {isEquality ? <Path {...STROKE} d={EQUAL_PATH} /> : <Circle {...STROKE} cx={11} cy={11} r={6.5} />}
            {isEquality ? null : <Path {...STROKE} d={LENS_HANDLE} />}
            {isNegated ? <Path {...STROKE} d={slashPath} /> : null}
        </StyledSvg>
    );
};
