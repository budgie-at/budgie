import { CategoryRepository } from '@budgie/contracts';
import { CategoryService } from '@budgie/ledger';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { showSuccessToast } from '../../@generic/utils/show-success-toast/show-success-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { useCategorySelectorModal } from '../context/category-selector-modal.context';

import type { MutationTracker } from '../../@generic/type/mutation-tracker.type';
import type { CategoryEntityInterface } from '@budgie/contracts';

export const useMoveAndDeleteCategory = () => {
    const { t } = useLingui();
    const language = useSetting('language');
    const [openCategorySelector] = useCategorySelectorModal();

    return Effect.fn('useMoveAndDeleteCategory.moveAndDelete')(function* (
        source: Pick<CategoryEntityInterface, 'id' | 'title'>,
        count: number,
        trackMutation: MutationTracker
    ) {
        const categoryRepository = yield* CategoryRepository;
        const categoryService = yield* CategoryService;
        const sourceTitle = source.title;
        const targetId = yield* Effect.callback<number | null>(resume => {
            openCategorySelector(
                {
                    excludeCategoryIds: [source.id],
                    title: t`Move “${sourceTitle}” transactions to…`,
                    description: t({
                        message: plural(count, {
                            one: `Its # transaction moves to the category you pick, and “${sourceTitle}” is deleted.`,
                            other: `Its # transactions move to the category you pick, and “${sourceTitle}” is deleted.`
                        })
                    }),
                    variant: 'primary',
                    commitLabel: t`Move and delete`,
                    getCommitSummary: targetTitle =>
                        t({
                            message: plural(count, {
                                one: `# transaction → “${targetTitle}”. “${sourceTitle}” will be deleted.`,
                                other: `# transactions → “${targetTitle}”. “${sourceTitle}” will be deleted.`
                            })
                        })
                },
                selectedCategoryId => {
                    resume(Effect.succeed(selectedCategoryId));
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
            yield* Effect.sync(() => void showSuccessToast(t`“${sourceTitle}” deleted, transactions moved to “${targetTitle}”`));
        }

        return true;
    });
};
