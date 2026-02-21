import { LlmInterface } from '../../@generic/interface/llm.interface';
import { containsNonLatin } from '../../embedding/util/contains-non-latin.util';
import { TAG_GENERATION_SYSTEM_PROMPT, TRANSLATION_SYSTEM_PROMPT, TRANSLATION_TEMPERATURE } from '../constant/translation-prompt.constant';
import { TranslationResultInterface } from '../interface/translation-result.interface';

export class TranslationLlmService {
    constructor(private readonly llm: LlmInterface) {}

    async translate(title: string): Promise<TranslationResultInterface> {
        const trimmedTitleEn = await this.translateToEnglish(title);

        const tags = await this.llm.generate(TAG_GENERATION_SYSTEM_PROMPT, trimmedTitleEn, { temperature: TRANSLATION_TEMPERATURE });
        const trimmedTags = tags.trim().toLowerCase();

        return { titleEn: trimmedTitleEn, titleTags: trimmedTags };
    }

    private async translateToEnglish(title: string): Promise<string> {
        if (!containsNonLatin(title)) {
            return title.trim().toLowerCase();
        }

        const titleEn = await this.llm.generate(TRANSLATION_SYSTEM_PROMPT, title, { temperature: TRANSLATION_TEMPERATURE });

        return titleEn.trim().toLowerCase();
    }
}
