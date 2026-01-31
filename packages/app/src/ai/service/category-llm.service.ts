import { CategoryEntityInterface, CurrencyEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';
import { COMMON_CURRENCIES, FALLBACK_CATEGORY_ID } from '../constant/llm-categorization.constant';
import { LlmInterface } from '../context/llm.context';
import { parseLlmJsonResponse } from '../util/parse-llm-json-response.util';

export interface CategoryTranslationResult {
    titleEn: string;
    titleTags: string;
}

interface CategorySuggestionParams {
    transactionTitle: string;
    mccDescription: string | null;
    comment: string;
    categories: CategoryEntityInterface[];
}

interface TransactionExtractionParams {
    text: string;
    categories: CategoryEntityInterface[];
}

export interface ExtractedTransaction {
    categoryId: number;
    amount: number;
    currency: CurrencyEnum | null;
}

interface CategoryLlmErrorHandler {
    (category: CategoryEntityInterface, error: unknown): void;
}

const MAX_TAGS = 3;
const MAX_SUGGESTIONS = 3;

/* eslint-disable lingui/no-unlocalized-strings */
const TRANSLATION_SYSTEM_PROMPT = `Translate to English. Return ONLY the translation, 1-3 words.

Examples:
бухло -> alcohol
Дитина -> children
квартира -> apartment
їжа -> food
ІЖА -> food
такси -> taxi
подарунки -> gifts
розваги -> entertainment
здоров'я -> health
зарплата -> salary
фріланс -> freelance
дивіденди -> dividends
відсотки -> interest
ТРАНСПОРТ -> transport
Кава -> coffee`;

const TAG_GENERATION_SYSTEM_PROMPT = `Generate search keywords. Return ONLY comma-separated English words.

Examples:
food -> food, groceries, meals, eating, restaurant, dining, supermarket
transport -> transport, taxi, uber, bus, metro, ride, commute, lyft
children -> children, kids, baby, childcare, toys, school, daycare
alcohol -> alcohol, drinks, booze, liquor, beer, wine, bar, pub
entertainment -> entertainment, movies, games, cinema, theater, concert
health -> health, medical, doctor, pharmacy, hospital, medicine
salary -> salary, wages, paycheck, income, employment, job, work
freelance -> freelance, consulting, gig, contract, self-employed, client
dividends -> dividends, stocks, shares, investment, portfolio, returns
coffee -> coffee, cafe, espresso, latte, starbucks, barista`;
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

    async suggestCategories(params: CategorySuggestionParams): Promise<CategoryEntityInterface[]> {
        const { transactionTitle, mccDescription, comment, categories } = params;

        const userCategories = this.filterUserCategories(categories);
        if (userCategories.length === 0) {
            return [];
        }

        const systemPrompt = this.buildSuggestionPrompt(userCategories);
        const context = this.buildTransactionContext(transactionTitle, mccDescription, comment);
        const response = await this.llm.generate(systemPrompt, context);
        const categoryIds = this.parseSuggestionResponse(response, categories);

        return categoryIds.map(id => categories.find(category => category.id === id)).filter(isDefined);
    }

    async extractTransactionsFromText(params: TransactionExtractionParams): Promise<ExtractedTransaction[]> {
        const { text, categories } = params;

        const userCategories = this.filterUserCategories(categories);
        if (userCategories.length === 0) {
            return [];
        }

        const systemPrompt = this.buildExtractionPrompt(userCategories);
        const response = await this.llm.generate(systemPrompt, text);
        const parsed = parseLlmJsonResponse(response);

        return parsed.map(item => ({
            categoryId: this.resolveCategoryId(item.categoryId, categories),
            amount: item.amount,
            currency: item.currency
        }));
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

    private buildTransactionContext(title: string, mccDescription: string | null, comment: string): string {
        const parts: string[] = [];

        /* eslint-disable lingui/no-unlocalized-strings -- LLM prompt labels */
        if (isNotEmptyString(title)) {
            parts.push(`Transaction: ${title}`);
        }

        if (isNotEmptyString(mccDescription)) {
            parts.push(`Type: ${mccDescription}`);
        }

        if (isNotEmptyString(comment)) {
            parts.push(`Note: ${comment}`);
        }

        return parts.join(' | ');
        /* eslint-enable lingui/no-unlocalized-strings */
    }

    private parseSuggestionResponse(response: string, categories: Pick<CategoryEntityInterface, 'id'>[]): number[] {
        const trimmed = response.trim();

        return trimmed
            .split(',')
            .map(part => parseInt(part.trim(), 10))
            .filter(id => !isNaN(id) && id !== 0)
            .map(id => (categories.some(category => category.id === id) ? id : null))
            .filter(isDefined)
            .slice(0, MAX_SUGGESTIONS);
    }

    private getCategoryLabel(category: CategoryEntityInterface): string {
        const title = category.titleEn ?? category.title;
        const tags = this.getFirstTags(category.titleTags);

        if (tags.length === 0) {
            return title;
        }

        return `${title} (${tags.join(', ')})`;
    }

    private getFirstTags(titleTags: string | null): string[] {
        if (!isNotEmptyString(titleTags)) {
            return [];
        }

        return titleTags
            .split(',')
            .map(tag => tag.trim())
            .filter(isNotEmptyString)
            .slice(0, MAX_TAGS);
    }

    private buildExtractionPrompt(userCategories: CategoryEntityInterface[]): string {
        const categoryList = userCategories.map(category => `${category.id}=${this.getCategoryLabel(category)}`).join(', ');
        const currencies = COMMON_CURRENCIES.join(', ');

        /* eslint-disable lingui/no-unlocalized-strings */
        return `Extract expenses from text. Return JSON array.

CATEGORIES: ${categoryList}

CURRENCIES: ${currencies}

FORMAT: [{"categoryId":N,"amount":N,"currency":"XXX"}]

RULES:
- ONE amount = ONE entry (never duplicate the same amount)
- Pick the BEST matching category for each expense
- Multiple entries ONLY when multiple amounts are mentioned
- categoryId = NUMBER from list
- currency = 3-letter code or null

Example: "coffee 5 usd, taxi 10" -> [{"categoryId":1,"amount":5,"currency":"USD"},{"categoryId":2,"amount":10,"currency":null}]
Example: "pizza at restaurant 10" -> [{"categoryId":3,"amount":10,"currency":null}] (ONE entry, not two)`;
        /* eslint-enable lingui/no-unlocalized-strings */
    }

    private resolveCategoryId(categoryId: number | string, categories: CategoryEntityInterface[]): number {
        if (typeof categoryId === 'number') {
            return categoryId;
        }

        const normalized = categoryId.toLowerCase().trim();
        const match = categories.find(category => category.title.toLowerCase() === normalized);

        return match?.id ?? FALLBACK_CATEGORY_ID;
    }
}
