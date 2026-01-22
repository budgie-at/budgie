import { LanguageEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { GenerateOptionsInterface } from '../context/llm.context';
import { CategoryMappingCacheInterface } from '../interface/category-mapping-cache.interface';
import { ExpenseTypeMappingInterface } from '../interface/expense-type-mapping.interface';
import { computeCategoriesHash } from '../util/compute-categories-hash.util';

import { categoryMappingStorageService } from './category-mapping-storage.service';

export interface CategoryForMappingInterface {
    id: number;
    title: string;
    isSystemCategory: boolean;
}

interface LlmProviderInterface {
    sendMessage: (message: string, options?: GenerateOptionsInterface) => Promise<string>;
}

const CATEGORY_MAX_TOKENS = 64;
const MAX_KEYWORDS = 10;

/* eslint-disable lingui/no-unlocalized-strings, no-console, no-await-in-loop */
class CategoryMappingService {
    private generationPromise: Promise<ExpenseTypeMappingInterface[]> | null = null;

    async getMapping(
        categories: CategoryForMappingInterface[],
        language: LanguageEnum,
        llm: LlmProviderInterface
    ): Promise<ExpenseTypeMappingInterface[]> {
        const expenseCategories = categories.filter(category => !category.isSystemCategory);
        const currentHash = computeCategoriesHash(expenseCategories);
        const cachedMapping = await this.tryGetCachedMapping(language, currentHash);

        if (isDefined(cachedMapping)) {
            return cachedMapping;
        }

        return this.startOrAwaitGeneration(expenseCategories, language, currentHash, llm);
    }

    async invalidateCache(): Promise<void> {
        await categoryMappingStorageService.clearCache();
    }

    private async tryGetCachedMapping(language: LanguageEnum, currentHash: string): Promise<ExpenseTypeMappingInterface[] | null> {
        const cache = await categoryMappingStorageService.getCache();

        if (isDefined(cache) && cache.language === language && cache.categoriesHash === currentHash) {
            return cache.mapping;
        }

        return null;
    }

    private async startOrAwaitGeneration(
        categories: CategoryForMappingInterface[],
        language: LanguageEnum,
        hash: string,
        llm: LlmProviderInterface
    ): Promise<ExpenseTypeMappingInterface[]> {
        if (isDefined(this.generationPromise)) {
            return this.generationPromise;
        }

        this.generationPromise = this.generateAndCacheMapping(categories, language, hash, llm);

        try {
            return await this.generationPromise;
        } finally {
            this.generationPromise = null;
        }
    }

    private async generateAndCacheMapping(
        categories: CategoryForMappingInterface[],
        language: LanguageEnum,
        hash: string,
        llm: LlmProviderInterface
    ): Promise<ExpenseTypeMappingInterface[]> {
        const mapping = await this.analyzeCategories(categories, llm);

        const cache: CategoryMappingCacheInterface = {
            version: 1,
            language,
            categoriesHash: hash,
            mapping,
            createdAt: Date.now()
        };

        await categoryMappingStorageService.setCache(cache);

        return mapping;
    }

    private async analyzeCategories(
        categories: CategoryForMappingInterface[],
        llm: LlmProviderInterface
    ): Promise<ExpenseTypeMappingInterface[]> {
        const results: ExpenseTypeMappingInterface[] = [];

        for (const category of categories) {
            const mapping = await this.analyzeSingleCategory(category, llm);
            results.push(mapping);
            console.log('[CategoryMappingService] Analyzed:', category.title, '->', mapping.keywords.slice(0, 5));
        }

        return results;
    }

    private async analyzeSingleCategory(
        category: CategoryForMappingInterface,
        llm: LlmProviderInterface
    ): Promise<ExpenseTypeMappingInterface> {
        const prompt = `Category: "${category.title}". List 5-10 expense types. Reply with comma-separated words only:`;

        try {
            const response = await llm.sendMessage(prompt, { maxNewTokens: CATEGORY_MAX_TOKENS });
            const keywords = this.parseKeywordsResponse(response, category.title);

            if (isNotEmptyArray(keywords)) {
                return { type: keywords[0], categoryId: category.id, keywords };
            }
        } catch {
            // Fallback to category title on error
        }

        return this.createFallbackForCategory(category);
    }

    private parseKeywordsResponse(response: string, categoryTitle: string): string[] {
        const words = response
            .toLowerCase()
            .split(/[,\n]+/u)
            .map(word => word.trim().replace(/[^a-z]/gu, ''))
            .filter(word => word.length > 1 && word.length <= 20);

        const uniqueWords = [...new Set(words)].slice(0, MAX_KEYWORDS);
        const titleKeyword = categoryTitle.toLowerCase().replace(/[^a-z0-9]/gu, '');

        if (!uniqueWords.includes(titleKeyword) && titleKeyword.length > 0) {
            uniqueWords.unshift(titleKeyword);
        }

        return uniqueWords.slice(0, MAX_KEYWORDS);
    }

    private createFallbackForCategory(category: CategoryForMappingInterface): ExpenseTypeMappingInterface {
        const titleKeyword = category.title.toLowerCase().replace(/[^a-z0-9]/gu, '');

        return { type: titleKeyword, categoryId: category.id, keywords: [titleKeyword, category.title.toLowerCase()] };
    }
}
/* eslint-enable lingui/no-unlocalized-strings, no-console, no-await-in-loop */

export const categoryMappingService = new CategoryMappingService();
