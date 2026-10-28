import { CategoryService } from '@budgie/ledger';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { useCategorySelectorModal } from '../context/category-selector-modal.context';

export const useDeleteCategory = () => {
    const { t } = useLingui();
    const [openCategorySelector] = useCategorySelectorModal();

    const deleteCategory = Effect.fn('useDeleteCategory.deleteCategory')(function* (id: number) {
        const categoryService = yield* CategoryService;
        const count = yield* categoryService.countTransactionEntries(id);

        if (!isPositiveNumber(count)) {
            yield* categoryService.deleteById(id).pipe(toastOnFailure(t`Could not delete category`, t`Please try again later`));

            return;
        }

        const description = t({
            message: plural(count, {
                one: 'This category has # transaction. Select another category to reassign it to.',
                other: 'This category has # transactions. Select another category to reassign them to.'
            })
        });
        const targetCategoryId = yield* Effect.callback<number | null>(resume => {
            openCategorySelector({ excludeCategoryIds: [id], description, variant: 'primary' }, selectedCategoryId => {
                resume(Effect.succeed(selectedCategoryId));
            });
        });

        if (isDefined(targetCategoryId)) {
            yield* categoryService
                .mergeInto(id, targetCategoryId)
                .pipe(toastOnFailure(t`Could not reassign category`, t`Please try again later`));
        }
    });

    return deleteCategory;
};
