import { CategoryRepository } from '@budgie/contracts';
import { CategoryService } from '@budgie/ledger';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { EntityOperationEnum } from '../../@generic/enum/entity-operation.enum';
import { showSuccessToast } from '../../@generic/utils/show-success-toast/show-success-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { useCategorySelectorModal } from '../context/category-selector-modal.context';

import type { MutationTracker } from '../../@generic/type/mutation-tracker.type';

export const useMergeCategory = () => {
    const { t } = useLingui();
    const language = useSetting('language');
    const [openCategorySelector] = useCategorySelectorModal();

    const getSelectorCopy = (operation: EntityOperationEnum, sourceTitle: string, count: number) =>
        operation === EntityOperationEnum.DELETE
            ? {
                  title: t({
                      message: plural(count, {
                          one: `Move # transaction from “${sourceTitle}”, then delete it`,
                          other: `Move # transactions from “${sourceTitle}”, then delete it`
                      })
                  }),
                  description: t`Pick the category they move to.`
              }
            : {
                  title: t`Merge “${sourceTitle}” into…`,
                  description: t({
                      message: plural(count, {
                          0: `“${sourceTitle}” has no transactions. It is removed after the merge.`,
                          one: `Its # transaction moves to the category you pick, and “${sourceTitle}” is removed.`,
                          other: `Its # transactions move to the category you pick, and “${sourceTitle}” is removed.`
                      })
                  })
              };

    const getSuccessMessage = (operation: EntityOperationEnum, sourceTitle: string, targetTitle: string) =>
        operation === EntityOperationEnum.DELETE
            ? t`“${sourceTitle}” deleted, transactions moved to “${targetTitle}”`
            : t`“${sourceTitle}” merged into “${targetTitle}”`;

    return Effect.fn('useMergeCategory.mergeCategory')(function* (
        sourceId: number,
        trackMutation: MutationTracker,
        operation: EntityOperationEnum = EntityOperationEnum.MERGE
    ) {
        const categoryRepository = yield* CategoryRepository;
        const categoryService = yield* CategoryService;
        const [source] = yield* categoryRepository.findById(sourceId, language);

        if (!isDefined(source)) {
            return null;
        }

        const selectorCopy = getSelectorCopy(operation, source.title, yield* categoryService.countTransactionEntries(sourceId));
        const targetId = yield* Effect.callback<number | null>(resume => {
            openCategorySelector({ excludeCategoryIds: [sourceId], ...selectorCopy, variant: 'primary' }, selectedCategoryId => {
                resume(Effect.succeed(selectedCategoryId));
            });
        });

        if (!isDefined(targetId)) {
            return null;
        }

        yield* trackMutation(categoryService.mergeInto(sourceId, targetId)).pipe(
            toastOnFailure(t`Could not merge category`, t`Please try again later`)
        );
        const [target] = yield* categoryRepository.findById(targetId, language);

        if (isDefined(target)) {
            yield* Effect.sync(() => void showSuccessToast(getSuccessMessage(operation, source.title, target.title)));
        }

        return target;
    });
};
