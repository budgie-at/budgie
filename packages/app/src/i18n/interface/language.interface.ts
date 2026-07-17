import { LanguageEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';

export interface LanguageInterface {
    code: LanguageEnum;
    name: MessageDescriptor;
}
