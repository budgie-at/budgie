import { CategoryEntityInterface } from '@budgie/contracts';

import { isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { buildTransactionContext } from '../../embedding/util/build-transaction-context.util';
import { TranslationResultInterface } from '../interface/translation-result.interface';

import { BaseLlmService } from './base-llm.service';

export interface CategorySuggestionParamsInterface {
    transactionTitle: string;
    mccDescription: string | null;
    comment: string;
    categories: CategoryEntityInterface[];
}

const MAX_TAGS = 3;
const MAX_SUGGESTIONS = 3;

export class CategoryLlmService extends BaseLlmService {
    async translate(title: string): Promise<TranslationResultInterface> {
        return this.generateTranslationAndTags(title);
    }

    async suggestCategories(params: CategorySuggestionParamsInterface): Promise<CategoryEntityInterface[]> {
        const { transactionTitle, mccDescription, comment, categories } = params;

        const userCategories = this.filterUserCategories(categories);
        if (isEmptyArray(userCategories)) {
            return [];
        }

        const systemPrompt = this.buildSuggestionPrompt(userCategories);
        const context = buildTransactionContext(transactionTitle, mccDescription, comment);
        const response = await this.llm.generate(systemPrompt, context);
        const categoryIds = this.parseSuggestionResponse(response, categories, MAX_SUGGESTIONS);

        return categoryIds.map(id => categories.find(category => category.id === id)).filter(isDefined);
    }

    private filterUserCategories(categories: CategoryEntityInterface[]): CategoryEntityInterface[] {
        return categories.filter(category => !category.isSystemCategory && !category.isDefault);
    }

    private buildSuggestionPrompt(userCategories: CategoryEntityInterface[]): string {
        const categoryList = userCategories.map(category => `${category.id}=${this.getCategoryLabel(category)}`).join(', ');

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
