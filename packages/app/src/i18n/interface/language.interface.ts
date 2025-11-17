import { LanguageEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';

export interface LanguageInterface {
    emoji: string;
    code: LanguageEnum;
    name: MessageDescriptor;
}
