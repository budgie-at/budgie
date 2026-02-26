import { CategoryCreateEntityInterface, CategoryEntityInterface, transactionAsync } from '@budgie/contracts';

import { categoryRepository, db } from '../../@generic/drizzle/db/db';

class CategoryService {
    async bulkCreate(inputs: CategoryCreateEntityInterface[], batchSize = 100): Promise<Record<string, CategoryEntityInterface>> {
        const results: CategoryEntityInterface[] = [];
        for (let i = 0; i < inputs.length; i += batchSize) {
            const batch = inputs.slice(i, i + batchSize);

            // eslint-disable-next-line no-await-in-loop
            results.push(...(await transactionAsync(db, async tx => categoryRepository.bulkCreate(batch, tx))));
        }

        return results.reduce<Record<string, CategoryEntityInterface>>((acc, category) => ({ ...acc, [category.title]: category }), {});
    }

    async countTransactionEntries(categoryId: number): Promise<number> {
        return categoryRepository.countTransactionEntries(categoryId);
    }

    async mergeInto(fromCategoryId: number, toCategoryId: number): Promise<void> {
        await categoryRepository.reassignTransactionEntries(fromCategoryId, toCategoryId);
        await categoryRepository.deleteById(fromCategoryId);
    }

    async deleteById(categoryId: number): Promise<void> {
        await categoryRepository.deleteById(categoryId);
    }
}

export const categoryService = new CategoryService();
