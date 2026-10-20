import { ClipPath, Defs, G, Path } from 'react-native-svg';

import { isDefined } from '@rnw-community/shared';

import { ReiconGlyphTagEnum } from '../../enum/reicon-glyph-tag.enum';
import { isEnumValue } from '../../type-guard/is-enum-value.type-guard';

import type { ReiconGlyphElementInterface } from '../../interface/reicon-glyph-element.interface';
import type { NumberProp } from 'react-native-svg';

interface Props {
    readonly element: ReiconGlyphElementInterface;
    readonly strokeWidth?: NumberProp;
}

export const ReiconGlyphElement = ({ element, strokeWidth }: Props) => {
    const { tag, attributes, children = [] } = element;
    const hasStrokeWidthOverride = isDefined(strokeWidth) && isDefined(attributes['strokeWidth']);
    const glyphStrokeWidth = hasStrokeWidthOverride ? strokeWidth : attributes['strokeWidth'];
    const glyphTag = isEnumValue(tag, ReiconGlyphTagEnum) ? tag : null;
    const childElements = children.map((child, index) => (
        <ReiconGlyphElement key={`${child.tag}-${index}`} element={child} strokeWidth={strokeWidth} />
    ));

    switch (glyphTag) {
        case ReiconGlyphTagEnum.PATH:
            return <Path {...attributes} strokeWidth={glyphStrokeWidth} />;
        case ReiconGlyphTagEnum.GROUP:
            return (
                <G {...attributes} strokeWidth={glyphStrokeWidth}>
                    {childElements}
                </G>
            );
        case ReiconGlyphTagEnum.DEFS:
            return <Defs>{childElements}</Defs>;
        case ReiconGlyphTagEnum.CLIP_PATH:
            return <ClipPath id={attributes['id']}>{childElements}</ClipPath>;
        default:
            return null;
    }
};
