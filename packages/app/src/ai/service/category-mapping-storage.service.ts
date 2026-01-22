import Storage from 'expo-sqlite/kv-store';

import { isDefined } from '@rnw-community/shared';

import { CategoryMappingCacheInterface } from '../interface/category-mapping-cache.interface';

const STORAGE_KEY = 'category_mapping_v1';

class CategoryMappingStorageService {
    async getCache(): Promise<CategoryMappingCacheInterface | null> {
        const data = await Storage.getItem(STORAGE_KEY);

        if (!isDefined(data)) {
            return null;
        }

        return JSON.parse(data) as CategoryMappingCacheInterface;
    }

    async setCache(cache: CategoryMappingCacheInterface): Promise<void> {
        await Storage.setItem(STORAGE_KEY, JSON.stringify(cache));
    }

    async clearCache(): Promise<void> {
        await Storage.removeItem(STORAGE_KEY);
    }
}

export const categoryMappingStorageService = new CategoryMappingStorageService();
