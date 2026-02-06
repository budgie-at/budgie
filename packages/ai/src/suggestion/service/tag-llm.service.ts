import { TranslationResultInterface } from '../interface/translation-result.interface';

import { BaseLlmService } from './base-llm.service';

export class TagLlmService extends BaseLlmService {
    async translate(title: string): Promise<TranslationResultInterface> {
        return this.generateTranslationAndTags(title);
    }
}
