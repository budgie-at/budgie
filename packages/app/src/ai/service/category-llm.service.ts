import { CategoryEntityInterface } from '@budgie/contracts';

import { categoryRepository } from '../../@generic/drizzle/db/db';
import { LlmInterface } from '../context/llm.context';

export interface CategoryTranslationResult {
    titleEn: string;
    titleTags: string;
}

interface CategoryLlmErrorHandler {
    (category: CategoryEntityInterface, error: unknown): void;
}

/* eslint-disable lingui/no-unlocalized-strings */
const TRANSLATION_SYSTEM_PROMPT = `Translate the expense category name to English.
Return ONLY the English translation, nothing else.
Keep it short (1-3 words).

Examples:
"бухло" -> alcohol
"Дитина" -> children
"квартира" -> apartment
"їжа" -> food
"такси" -> taxi
"подарунки" -> gifts
"розваги" -> entertainment
"здоров'я" -> health`;

const TAG_GENERATION_SYSTEM_PROMPT = `Generate search keywords for this expense category.
Return ONLY comma-separated English words, no explanations.
Include: the word itself, synonyms, related terms, common merchants.

Examples:
"food" -> food, groceries, meals, eating, restaurant, dining, supermarket
"transport" -> transport, taxi, uber, bus, metro, ride, commute, lyft
"children" -> children, kids, baby, childcare, toys, school, daycare
"alcohol" -> alcohol, drinks, booze, liquor, beer, wine, bar, pub
"entertainment" -> entertainment, movies, games, cinema, theater, concert
"health" -> health, medical, doctor, pharmacy, hospital, medicine`;
/* eslint-enable lingui/no-unlocalized-strings */

export class CategoryLlmService {
    constructor(private readonly llm: LlmInterface) {}

    async regenerateOne(categoryId: number, title: string): Promise<CategoryTranslationResult> {
        const result = await this.generateTranslationAndTags(title);
        await this.saveTranslation(categoryId, result);

        return result;
    }

    async regenerateAll(onError?: CategoryLlmErrorHandler): Promise<void> {
        const categories = await categoryRepository.findAllNonSystem();

        /* eslint-disable no-await-in-loop -- Sequential processing to avoid overwhelming LLM */
        for (const category of categories) {
            try {
                const result = await this.generateTranslationAndTags(category.title);
                await this.saveTranslation(category.id, result);
            } catch (error: unknown) {
                onError?.(category, error);
            }
        }
        /* eslint-enable no-await-in-loop */
    }

    private async generateTranslationAndTags(title: string): Promise<CategoryTranslationResult> {
        const titleEn = await this.llm.generate(TRANSLATION_SYSTEM_PROMPT, title);
        const trimmedTitleEn = titleEn.trim().toLowerCase();

        const tags = await this.llm.generate(TAG_GENERATION_SYSTEM_PROMPT, trimmedTitleEn);
        const trimmedTags = tags.trim().toLowerCase();

        return { titleEn: trimmedTitleEn, titleTags: trimmedTags };
    }

    private async saveTranslation(categoryId: number, result: CategoryTranslationResult): Promise<void> {
        await categoryRepository.updateTranslation(categoryId, result.titleEn, result.titleTags);
    }
}
