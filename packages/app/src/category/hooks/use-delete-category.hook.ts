import { CategoryRepository } from '@budgie/contracts';
import { CategoryService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { showSuccessToast } from '../../@generic/utils/show-success-toast/show-success-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { useSetting } from '../../settings/hook/use-setting.hook';

import { useMoveAndDeleteCategory } from './use-move-and-delete-category.hook';

import type { MutationTracker } from '../../@generic/type/mutation-tracker.type';

export const useDeleteCategory = () => {
    const { t } = useLingui();
    const language = useSetting('language');
    const moveAndDelete = useMoveAndDeleteCategory();

    return Effect.fn('useDeleteCategory.deleteCategory')(function* (id: number, trackMutation: MutationTracker) {
        const categoryRepository = yield* CategoryRepository;
        const categoryService = yield* CategoryService;
        const [category] = yield* categoryRepository.findById(id, language);

        if (!isDefined(category)) {
            return false;
        }

        const count = yield* categoryService.countTransactionEntries(id);

        if (isPositiveNumber(count)) {
            return yield* moveAndDelete(category, count, trackMutation);
        }

        const { title } = category;
        const isConfirmed = yield* confirmAlert({
            title: t`Delete “${title}”?`,
            confirmText: t`Delete`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (!isConfirmed) {
            return false;
        }

        yield* trackMutation(categoryService.deleteById(id)).pipe(toastOnFailure(t`Could not delete category`, t`Please try again later`));
        yield* Effect.sync(() => void showSuccessToast(t`“${title}” deleted`));

        return true;
    });
};
