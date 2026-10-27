import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { type TagsSelectorResult, useTagsSelectorModal } from '../context/tags-selector-modal.context';
import { TagService } from '../service/tag.service';

export const useDeleteTag = () => {
    const { t } = useLingui();
    const [openTagsSelector] = useTagsSelectorModal();

    const deleteTag = Effect.fn('useDeleteTag.deleteTag')(function* (id: number) {
        const tagService = yield* TagService;
        const count = yield* tagService.countTransactions(id);

        if (!isPositiveNumber(count)) {
            return yield* tagService.deleteById(id).pipe(toastOnFailure(t`Could not delete tag`, t`Please try again later`));
        }

        const description = t({
            message: plural(count, {
                one: 'This tag has # transaction. Select another tag to reassign it to.',
                other: 'This tag has # transactions. Select another tag to reassign them to.'
            })
        });
        const targetTagIds = yield* Effect.callback<TagsSelectorResult>(resume => {
            openTagsSelector({ excludeTagIds: [id], description, singleSelect: true }, selectedTagIds => {
                resume(Effect.succeed(selectedTagIds));
            });
        });
        const targetTagId = isNotEmptyArray(targetTagIds) ? targetTagIds[0] : null;

        if (isDefined(targetTagId)) {
            yield* tagService.mergeInto(id, targetTagId).pipe(toastOnFailure(t`Could not reassign tag`, t`Please try again later`));
        }
    });

    return deleteTag;
};
