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

export const useMergeCategory = () => {
    const { t } = useLingui();
    const language = useSetting('language');
    const [openCategorySelector] = useCategorySelectorModal();

    const pickTarget = (sourceId: number, sourceTitle: string, count: number) => {
        const description = t({
            message: plural(count, {
                0: `“${sourceTitle}” has no transactions. Pick a category to merge it into, and “${sourceTitle}” is removed.`,
                one: `“${sourceTitle}” has # transaction. It moves to the category you pick, and “${sourceTitle}” is removed.`,
                other: `“${sourceTitle}” has # transactions. They move to the category you pick, and “${sourceTitle}” is removed.`
            })
        });

        return Effect.callback<number | null>(resume => {
            openCategorySelector({ excludeCategoryIds: [sourceId], description, variant: 'primary' }, selectedCategoryId => {
                resume(Effect.succeed(selectedCategoryId));
            });
        });
    };

    return Effect.fn('useMergeCategory.mergeCategory')(function* (sourceId: number) {
        const categoryRepository = yield* CategoryRepository;
        const categoryService = yield* CategoryService;
        const [source] = yield* categoryRepository.findById(sourceId, language);

        if (!isDefined(source)) {
            return null;
        }

        const targetId = yield* pickTarget(sourceId, source.title, yield* categoryService.countTransactionEntries(sourceId));

        if (!isDefined(targetId)) {
            return null;
        }

        yield* categoryService.mergeInto(sourceId, targetId).pipe(toastOnFailure(t`Could not merge category`, t`Please try again later`));
        const [target] = yield* categoryRepository.findById(targetId, language);

        if (isDefined(target)) {
            const sourceTitle = source.title;
            const targetTitle = target.title;
            yield* Effect.sync(() => void showSuccessToast(t`“${sourceTitle}” merged into “${targetTitle}”`));
        }

        return target;
    });
};
