import { LanguageEnum } from '@budgie/contracts';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { CategoryMappingCacheInterface } from '../interface/category-mapping-cache.interface';
import { ExpenseTypeMappingInterface } from '../interface/expense-type-mapping.interface';
import { buildAnalysisPrompt } from '../util/build-analysis-prompt.util';
import { computeCategoriesHash } from '../util/compute-categories-hash.util';

import { categoryMappingStorageService } from './category-mapping-storage.service';

interface CategoryForMappingInterface {
    id: number;
    title: string;
}

interface LlmProviderInterface {
    sendMessage: (message: string) => Promise<string>;
}

const FALLBACK_CATEGORY_ID = 1;

/* eslint-disable no-console, lingui/no-unlocalized-strings */
class CategoryMappingService {
    async getMapping(
        categories: CategoryForMappingInterface[],
        language: LanguageEnum,
        llm: LlmProviderInterface
    ): Promise<ExpenseTypeMappingInterface[]> {
        const currentHash = computeCategoriesHash(categories);
        const cache = await categoryMappingStorageService.getCache();

        if (this.isCacheValid(cache, language, currentHash)) {
            console.log('[CategoryMapping] Using cached mapping');

            return cache.mapping;
        }

        console.log('[CategoryMapping] Generating new mapping');

        return this.generateAndCacheMapping(categories, language, currentHash, llm);
    }

    async invalidateCache(): Promise<void> {
        await categoryMappingStorageService.clearCache();
    }

    mapTypeToCategory(type: string, mapping: ExpenseTypeMappingInterface[]): number {
        const normalizedType = type.toLowerCase().trim();
        const match = mapping.find(entry => entry.type === normalizedType);

        return match?.categoryId ?? FALLBACK_CATEGORY_ID;
    }

    private isCacheValid(
        cache: CategoryMappingCacheInterface | null,
        language: LanguageEnum,
        currentHash: string
    ): cache is CategoryMappingCacheInterface {
        if (!isDefined(cache)) {
            return false;
        }

        if (cache.language !== language) {
            return false;
        }

        if (cache.categoriesHash !== currentHash) {
            return false;
        }

        return true;
    }

    private async generateAndCacheMapping(
        categories: CategoryForMappingInterface[],
        language: LanguageEnum,
        hash: string,
        llm: LlmProviderInterface
    ): Promise<ExpenseTypeMappingInterface[]> {
        try {
            const prompt = buildAnalysisPrompt(categories, language);
            const response = await llm.sendMessage(prompt);
            const mapping = this.parseAnalysisResponse(response, categories);

            const cache: CategoryMappingCacheInterface = {
                version: 1,
                language,
                categoriesHash: hash,
                mapping,
                createdAt: Date.now()
            };

            await categoryMappingStorageService.setCache(cache);

            return mapping;
        } catch (err: unknown) {
            console.log('[CategoryMapping] Analysis failed:', getErrorMessage(err));

            return this.createFallbackMapping(categories);
        }
    }

    private parseAnalysisResponse(response: string, categories: CategoryForMappingInterface[]): ExpenseTypeMappingInterface[] {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/u);

            if (!isDefined(jsonMatch)) {
                throw new Error('No JSON array found');
            }

            const parsed = JSON.parse(jsonMatch[0]) as ExpenseTypeMappingInterface[];

            if (!Array.isArray(parsed)) {
                throw new Error('Response is not an array');
            }

            return parsed.filter(
                item => typeof item.type === 'string' && typeof item.categoryId === 'number' && Array.isArray(item.keywords)
            );
        } catch {
            console.log('[CategoryMapping] Parse failed, using fallback');

            return this.createFallbackMapping(categories);
        }
    }

    private createFallbackMapping(categories: CategoryForMappingInterface[]): ExpenseTypeMappingInterface[] {
        return categories.map(category => ({
            type: category.title.toLowerCase().replace(/[^a-z0-9]/gu, ''),
            categoryId: category.id,
            keywords: [category.title.toLowerCase()]
        }));
    }
}
/* eslint-enable no-console, lingui/no-unlocalized-strings */

export const categoryMappingService = new CategoryMappingService();
