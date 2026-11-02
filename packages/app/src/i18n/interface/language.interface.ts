import { LanguageEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';

export interface LanguageInterface {
    readonly code: LanguageEnum;
    readonly name: MessageDescriptor;
    readonly nativeName: MessageDescriptor;
}
