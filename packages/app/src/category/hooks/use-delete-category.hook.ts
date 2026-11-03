import { CategoryRepository } from '@budgie/contracts';
import { CategoryService } from '@budgie/ledger';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { callback, fn, succeed, sync } from 'effect/Effect';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { showSuccessToast } from '../../@generic/utils/show-success-toast/show-success-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { useCategorySelectorModal } from '../context/category-selector-modal.context';

import type { MutationTracker } from '../../@generic/type/mutation-tracker.type';
import type { CategoryEntityInterface } from '@budgie/contracts';

export const useDeleteCategory = () => {
    const { t } = useLingui();
    const language = useSetting('language');
    const [openCategorySelector] = useCategorySelectorModal();

    const moveAndDelete = fn('useDeleteCategory.moveAndDelete')(function* (
        source: Pick<CategoryEntityInterface, 'id' | 'title'>,
        count: number,
        trackMutation: MutationTracker
    ) {
        const categoryRepository = yield* CategoryRepository;
        const categoryService = yield* CategoryService;
        const sourceTitle = source.title;
        const targetId = yield* callback<number | null>(resume => {
            openCategorySelector(
                {
                    excludeCategoryIds: [source.id],
                    title: t`Move “${sourceTitle}” transactions to…`,
                    description: t({
                        message: plural(count, {
                            one: `# transaction`,
                            other: `# transactions`
                        })
                    }),
                    commitLabel: t`Move and delete`,
                    getCommitCopy: targetTitle => ({
                        summary: t({
                            message: plural(count, {
                                one: `# transaction moves to “${targetTitle}”. “${sourceTitle}” will be deleted.`,
                                other: `# transactions move to “${targetTitle}”. “${sourceTitle}” will be deleted.`
                            })
                        }),
                        accessibilityLabel: t({
                            message: plural(count, {
                                one: `Move # transaction to “${targetTitle}” and delete “${sourceTitle}”`,
                                other: `Move # transactions to “${targetTitle}” and delete “${sourceTitle}”`
                            })
                        })
                    })
                },
                selectedCategoryId => {
                    resume(succeed(selectedCategoryId));
                }
            );
        });

        if (!isDefined(targetId)) {
            return false;
        }

        yield* trackMutation(categoryService.mergeInto(source.id, targetId)).pipe(
            toastOnFailure(t`Could not delete category`, t`Please try again later`)
        );
        const [target] = yield* categoryRepository.findById(targetId, language);

        if (isDefined(target)) {
            const targetTitle = target.title;
            yield* sync(() => void showSuccessToast(t`“${sourceTitle}” deleted, transactions moved to “${targetTitle}”`));
        }

        return true;
    });

    return fn('useDeleteCategory.deleteCategory')(function* (id: number, trackMutation: MutationTracker) {
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
        yield* sync(() => void showSuccessToast(t`“${title}” deleted`));

        return true;
    });
};
