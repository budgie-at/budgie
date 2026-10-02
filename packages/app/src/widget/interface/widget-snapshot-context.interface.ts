import type { LanguageEnum } from '@budgie/contracts';
import type { I18n } from '@lingui/core';

export interface WidgetSnapshotContextInterface {
    readonly i18n: I18n;
    readonly language: LanguageEnum;
    readonly locale: string;
    readonly decimalPlaces: number;
    readonly isMasked: boolean;
}
