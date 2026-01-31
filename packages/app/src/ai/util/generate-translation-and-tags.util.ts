import { TAG_GENERATION_SYSTEM_PROMPT, buildTagGenerationUserPrompt } from './build-tag-generation-prompt.util';
import { TRANSLATION_SYSTEM_PROMPT, buildTranslationUserPrompt } from './build-translation-prompt.util';

interface LlmGenerate {
    generate: (system: string, user: string) => Promise<string>;
}

interface TranslationAndTagsResult {
    titleEn: string;
    titleTags: string;
}

export const generateTranslationAndTags = async (llm: LlmGenerate, title: string): Promise<TranslationAndTagsResult> => {
    const translationPrompt = buildTranslationUserPrompt(title);
    const titleEn = await llm.generate(TRANSLATION_SYSTEM_PROMPT, translationPrompt);
    const trimmedTitleEn = titleEn.trim().toLowerCase();

    const tagsPrompt = buildTagGenerationUserPrompt(trimmedTitleEn);
    const tags = await llm.generate(TAG_GENERATION_SYSTEM_PROMPT, tagsPrompt);
    const trimmedTags = tags.trim().toLowerCase();

    return { titleEn: trimmedTitleEn, titleTags: trimmedTags };
};
