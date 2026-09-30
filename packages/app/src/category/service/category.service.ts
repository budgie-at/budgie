import { CategoryRepository, Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import type { CategoryCreateEntityInterface, CategoryEntityInterface, UserIconType } from '@budgie/contracts';

export class CategoryService extends Context.Service<CategoryService>()('@budgie/app/CategoryService', {
    make: Effect.gen(function* () {
        const categoryRepository = yield* CategoryRepository;

        return {
            updateIcon: Effect.fn('CategoryService.updateIcon')(function* (categoryId: number, icon: UserIconType) {
                yield* categoryRepository.updateById(categoryId, { icon });
            }),
            bulkCreate: Effect.fn('CategoryService.bulkCreate')(function* (
                inputs: CategoryCreateEntityInterface[],
                batchSize: number = 100
            ) {
                const results: CategoryEntityInterface[] = [];
                for (let i = 0; i < inputs.length; i += batchSize) {
                    const batch = inputs.slice(i, i + batchSize);

                    results.push(...(yield* Db.transaction(categoryRepository.bulkCreate(batch))));
                }

                return results.reduce<Record<string, CategoryEntityInterface>>(
                    (acc, category) => ({ ...acc, [category.title]: category }),
                    {}
                );
            }),
            countTransactionEntries: Effect.fn('CategoryService.countTransactionEntries')(function* (categoryId: number) {
                return yield* categoryRepository.countTransactionEntries(categoryId);
            }),
            mergeInto: Effect.fn('CategoryService.mergeInto')(function* (fromCategoryId: number, toCategoryId: number) {
                yield* categoryRepository.reassignTransactionEntries(fromCategoryId, toCategoryId);
                yield* categoryRepository.deleteById(fromCategoryId);
            }),
            deleteById: Effect.fn('CategoryService.deleteById')(function* (categoryId: number) {
                yield* categoryRepository.deleteById(categoryId);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(CategoryService, CategoryService.make).pipe(Layer.provide(CategoryRepository.layer));
}
