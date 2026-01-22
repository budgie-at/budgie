import AsyncStorage from '@react-native-async-storage/async-storage';

import { isDefined } from '@rnw-community/shared';

import { CategoryMappingCacheInterface } from '../interface/category-mapping-cache.interface';

const STORAGE_KEY = 'category_mapping_v1';

class CategoryMappingStorageService {
    async getCache(): Promise<CategoryMappingCacheInterface | null> {
        const data = await AsyncStorage.getItem(STORAGE_KEY);

        if (!isDefined(data)) {
            return null;
        }

        return JSON.parse(data) as CategoryMappingCacheInterface;
    }

    async setCache(cache: CategoryMappingCacheInterface): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    }

    async clearCache(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEY);
    }
}

export const categoryMappingStorageService = new CategoryMappingStorageService();
