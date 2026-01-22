import * as SecureStore from 'expo-secure-store';

import { isDefined } from '@rnw-community/shared';

import { CategoryMappingCacheInterface } from '../interface/category-mapping-cache.interface';

const STORAGE_KEY = 'category_mapping_v1';

class CategoryMappingStorageService {
    async getCache(): Promise<CategoryMappingCacheInterface | null> {
        const data = await SecureStore.getItemAsync(STORAGE_KEY);

        if (!isDefined(data)) {
            return null;
        }

        return JSON.parse(data) as CategoryMappingCacheInterface;
    }

    async setCache(cache: CategoryMappingCacheInterface): Promise<void> {
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(cache));
    }

    async clearCache(): Promise<void> {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
}

export const categoryMappingStorageService = new CategoryMappingStorageService();
