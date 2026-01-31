import { TagEntityInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { tagRepository } from '../../@generic/drizzle/db/db';
import { LlmInterface } from '../context/llm.context';

import { CategoryTranslationResult } from './category-llm.service';

interface TagSuggestionParams {
    transactionTitle: string;
    categoryName: string | null;
    mccDescription: string | null;
    comment: string;
    tags: TagEntityInterface[];
}

interface TagLlmErrorHandler {
    (tag: TagEntityInterface, error: unknown): void;
}

const TRANSLATION_TEMPERATURE = 0.7;
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

export class TagLlmService {
    constructor(private readonly llm: LlmInterface) {}

    async regenerateOne(tagId: number, title: string): Promise<CategoryTranslationResult> {
        const result = await this.generateTranslationAndTags(title);
        await this.saveTranslation(tagId, result);

        return result;
    }

    async regenerateAll(onError?: TagLlmErrorHandler): Promise<void> {
        const tags = await tagRepository.findAll();

        /* eslint-disable no-await-in-loop -- Sequential processing to avoid overwhelming LLM */
        for (const tag of tags) {
            try {
                const result = await this.generateTranslationAndTags(tag.title);
                await this.saveTranslation(tag.id, result);
            } catch (error: unknown) {
                onError?.(tag, error);
            }
        }
        /* eslint-enable no-await-in-loop */
    }

    async suggestTags(params: TagSuggestionParams): Promise<TagEntityInterface[]> {
        const { transactionTitle, categoryName, mccDescription, comment, tags } = params;

        if (tags.length === 0) {
            return [];
        }

        const systemPrompt = this.buildSuggestionPrompt(tags);
        const context = this.buildTransactionContext(transactionTitle, categoryName, mccDescription, comment);
        const response = await this.llm.generate(systemPrompt, context);
        const tagIds = this.parseSuggestionResponse(response, tags);

        return tagIds.map(id => tags.find(tag => tag.id === id)).filter(isDefined);
    }

    /* jscpd:ignore-start - Shared LLM service pattern with CategoryLlmService */
    private async generateTranslationAndTags(title: string): Promise<CategoryTranslationResult> {
        const titleEn = await this.llm.generate(TRANSLATION_SYSTEM_PROMPT, title, { temperature: TRANSLATION_TEMPERATURE });
        const trimmedTitleEn = titleEn.trim().toLowerCase();

        const tags = await this.llm.generate(TAG_GENERATION_SYSTEM_PROMPT, trimmedTitleEn, { temperature: TRANSLATION_TEMPERATURE });
        const trimmedTags = tags.trim().toLowerCase();

        return { titleEn: trimmedTitleEn, titleTags: trimmedTags };
    }

    private async saveTranslation(tagId: number, result: CategoryTranslationResult): Promise<void> {
        await tagRepository.updateTranslation(tagId, result.titleEn, result.titleTags);
    }

    private buildSuggestionPrompt(tags: TagEntityInterface[]): string {
        const tagList = tags.map(tag => `${tag.id}=${tag.titleEn ?? tag.title}`).join(', ');
        const exampleId = tags[0]?.id ?? 1;
        const exampleId2 = tags[1]?.id ?? 2;
        const exampleId3 = tags[2]?.id ?? 3;

        /* eslint-disable lingui/no-unlocalized-strings */
        return `Pick exactly 3 tag IDs that best match the transaction. Return ONLY numbers.

TAGS: ${tagList}

Always return 3 comma-separated IDs from TAGS above, best match first.
Example: ${exampleId},${exampleId2},${exampleId3}
If nothing matches at all: 0`;
        /* eslint-enable lingui/no-unlocalized-strings */
    }

    private buildTransactionContext(title: string, categoryName: string | null, mccDescription: string | null, comment: string): string {
        const parts: string[] = [];
        const hasTitle = isNotEmptyString(title);

        /* eslint-disable lingui/no-unlocalized-strings -- LLM prompt labels */
        if (hasTitle) {
            parts.push(`Transaction: ${title}`);
        }

        if (isNotEmptyString(categoryName)) {
            parts.push(`Category: ${categoryName}`);
        }

        if (isNotEmptyString(mccDescription)) {
            parts.push(`Type: ${mccDescription}`);
        }

        if (isNotEmptyString(comment)) {
            const commentLabel = hasTitle ? 'Note' : 'Transaction';
            parts.push(`${commentLabel}: ${comment}`);
        }

        return parts.join(' | ');
        /* eslint-enable lingui/no-unlocalized-strings */
    }

    private parseSuggestionResponse(response: string, tags: Pick<TagEntityInterface, 'id'>[]): number[] {
        const trimmed = response.trim();

        return trimmed
            .split(',')
            .map(part => parseInt(part.trim(), 10))
            .filter(id => !isNaN(id) && id !== 0)
            .map(id => (tags.some(tag => tag.id === id) ? id : null))
            .filter(isDefined)
            .slice(0, MAX_SUGGESTIONS);
    }

    /* jscpd:ignore-end */
}
