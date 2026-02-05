import { CategoryEntityInterface } from '@budgie/contracts';

import { isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';

import { BaseLlmService, TranslationResultInterface } from './base-llm.service';

interface CategorySuggestionParams {
    transactionTitle: string;
    mccDescription: string | null;
    comment: string;
    categories: CategoryEntityInterface[];
}

interface CategoryLlmErrorHandler {
    (category: CategoryEntityInterface, error: unknown): void;
}

const MAX_TAGS = 3;
const MAX_SUGGESTIONS = 3;

export class CategoryLlmService extends BaseLlmService {
    async regenerateOne(categoryId: number, title: string): Promise<TranslationResultInterface> {
        const result = await this.generateTranslationAndTags(title);
        await this.saveTranslation(categoryId, result);

        return result;
    }

    async regenerateAll(onError?: CategoryLlmErrorHandler): Promise<void> {
        const categories = await categoryRepository.findAllNonSystem();

        for (const category of categories) {
            try {
                const result = await this.generateTranslationAndTags(category.title);
                await this.saveTranslation(category.id, result);
            } catch (error: unknown) {
                onError?.(category, error);
            }
        }
    }

    async suggestCategories(params: CategorySuggestionParams): Promise<CategoryEntityInterface[]> {
        const { transactionTitle, mccDescription, comment, categories } = params;

        const userCategories = this.filterUserCategories(categories);
        if (isEmptyArray(userCategories)) {
            return [];
        }

        const systemPrompt = this.buildSuggestionPrompt(userCategories);
        const context = this.buildTransactionContext(transactionTitle, mccDescription, comment);
        const response = await this.llm.generate(systemPrompt, context);
        const categoryIds = this.parseSuggestionResponse(response, categories, MAX_SUGGESTIONS);

        return categoryIds.map(id => categories.find(category => category.id === id)).filter(isDefined);
    }

    private async saveTranslation(categoryId: number, result: TranslationResultInterface): Promise<void> {
        await categoryRepository.updateTranslation(categoryId, result.titleEn, result.titleTags);
    }

    private filterUserCategories(categories: CategoryEntityInterface[]): CategoryEntityInterface[] {
        return categories.filter(category => !category.isSystemCategory && !category.isDefault);
    }

    private buildSuggestionPrompt(userCategories: CategoryEntityInterface[]): string {
        const categoryList = userCategories.map(category => `${category.id}=${this.getCategoryLabel(category)}`).join(', ');

        /* eslint-disable lingui/no-unlocalized-strings */
        return `Match the transaction to categories. Return up to 3 category IDs, best match first.

CATEGORIES: ${categoryList}

EXAMPLES:
Transaction: McDonalds | Type: Fast Food Restaurant -> 292
Transaction: Uber | Type: Taxicabs -> 364,288

RULES:
- Return comma-separated numbers (e.g., 292 or 292,387)
- Best match first, then alternatives
- Maximum 3 IDs
- If no match, return 0`;
        /* eslint-enable lingui/no-unlocalized-strings */
    }

    private getCategoryLabel(category: CategoryEntityInterface): string {
        const title = category.titleEn ?? category.title;

        if (!isNotEmptyString(category.titleTags)) {
            return title;
        }

        const tags = this.getFirstTags(category.titleTags);

        if (isEmptyArray(tags)) {
            return title;
        }

        return `${title} (${tags.join(', ')})`;
    }

    private getFirstTags(titleTags: string): string[] {
        return titleTags
            .split(',')
            .map(tag => tag.trim())
            .filter(isNotEmptyString)
            .slice(0, MAX_TAGS);
    }
}
