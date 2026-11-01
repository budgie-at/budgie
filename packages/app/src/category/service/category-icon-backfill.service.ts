import { CategoryIconSourceEnum, CategoryRepository } from '@budgie/contracts';
import { CategoryService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { iconSearchService } from '../../@generic/service/icon-search.service';
import { getCategoryIconTerms } from '../utils/get-category-icon-terms.util';

export class CategoryIconBackfillService extends Context.Service<CategoryIconBackfillService>()('@budgie/app/CategoryIconBackfillService', {
    make: Effect.gen(function* () {
        const categoryRepository = yield* CategoryRepository;
        const categoryService = yield* CategoryService;

        return {
            applyConfidentIcons: Effect.fn('CategoryIconBackfillService.applyConfidentIcons')(function* () {
                const categories = (yield* categoryRepository.findAllNonSystem()).filter(
                    category => !category.isDefault && category.iconSource === CategoryIconSourceEnum.AUTO
                );

                if (isEmptyArray(categories)) {
                    return;
                }

                const entries = yield* iconSearchService.load();

                yield* Effect.forEach(
                    categories,
                    category => {
                        const icon = iconSearchService.findConfidentIcon(entries, getCategoryIconTerms(category));

                        return isDefined(icon) && icon !== category.icon
                            ? categoryService.updateIcon(category.id, icon, CategoryIconSourceEnum.AUTO)
                            : Effect.void;
                    },
                    { discard: true }
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(CategoryIconBackfillService, CategoryIconBackfillService.make).pipe(
        Layer.provide([CategoryRepository.layer, CategoryService.layer])
    );
}
