import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { categoryRepository } from '../../@generic/drizzle/db/db';

import type { CategoryCreateEntityInterface, CategoryEntityInterface } from '@budgie/contracts';

class CategoryService {
    readonly bulkCreate = Effect.fn('CategoryService.bulkCreate')(function* (
        inputs: CategoryCreateEntityInterface[],
        batchSize: number = 100
    ) {
        const results: CategoryEntityInterface[] = [];
        for (let i = 0; i < inputs.length; i += batchSize) {
            const batch = inputs.slice(i, i + batchSize);

            results.push(...(yield* Db.transaction(categoryRepository.bulkCreate(batch))));
        }

        return results.reduce<Record<string, CategoryEntityInterface>>((acc, category) => ({ ...acc, [category.title]: category }), {});
    });

    readonly countTransactionEntries = Effect.fn('CategoryService.countTransactionEntries')(function* (categoryId: number) {
        return yield* categoryRepository.countTransactionEntries(categoryId);
    });

    readonly mergeInto = Effect.fn('CategoryService.mergeInto')(function* (fromCategoryId: number, toCategoryId: number) {
        yield* categoryRepository.reassignTransactionEntries(fromCategoryId, toCategoryId);
        yield* categoryRepository.deleteById(fromCategoryId);
    });

    readonly deleteById = Effect.fn('CategoryService.deleteById')(function* (categoryId: number) {
        yield* categoryRepository.deleteById(categoryId);
    });
}

export const categoryService = new CategoryService();
