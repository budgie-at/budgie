import type { RuleGlyphEnum } from '../enum/rule-glyph.enum';
import type { UserIconNameEnum } from '@budgie/contracts';
import type { MessageDescriptor } from '@lingui/core';

export interface RuleOptionMetaInterface {
    readonly label: MessageDescriptor;
    readonly phrase: MessageDescriptor;
    readonly description: MessageDescriptor;
    readonly icon: UserIconNameEnum;
    readonly glyph?: RuleGlyphEnum;
    readonly shortLabel?: MessageDescriptor;
}
