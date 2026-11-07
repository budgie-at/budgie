import type { SiriMetadataKeyEnum } from '../enum/siri-metadata-key.enum';
import type { InstrumentEntityInterface, LanguageEnum } from '@budgie/contracts';
import type { I18n } from '@lingui/core';

export interface SiriAnswerContextInterface {
    readonly i18n: I18n;
    readonly language: LanguageEnum;
    readonly instrument: Pick<InstrumentEntityInterface, 'id' | 'symbol'>;
    readonly numberFormat: Intl.NumberFormat;
    readonly dateFormat: Intl.DateTimeFormat;
    readonly now: Date;
    readonly isLocked: boolean;
    readonly metadata: Partial<Record<SiriMetadataKeyEnum, string>>;
}
