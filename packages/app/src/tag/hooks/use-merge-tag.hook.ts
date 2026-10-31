import { TagRepository } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { showSuccessToast } from '../../@generic/utils/show-success-toast/show-success-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { type TagsSelectorResult, useTagsSelectorModal } from '../context/tags-selector-modal.context';
import { TagService } from '../service/tag.service';

export const useMergeTag = () => {
    const { t } = useLingui();
    const [openTagsSelector] = useTagsSelectorModal();

    const pickTarget = (sourceId: number, sourceTitle: string, count: number) => {
        const description = t({
            message: plural(count, {
                0: `“${sourceTitle}” is not on any transactions. Pick a tag to merge it into, and “${sourceTitle}” is removed.`,
                one: `“${sourceTitle}” is on # transaction. It gets the tag you pick, and “${sourceTitle}” is removed.`,
                other: `“${sourceTitle}” is on # transactions. They get the tag you pick, and “${sourceTitle}” is removed.`
            })
        });

        return Effect.callback<TagsSelectorResult>(resume => {
            openTagsSelector({ excludeTagIds: [sourceId], description, singleSelect: true }, selectedTagIds => {
                resume(Effect.succeed(selectedTagIds));
            });
        });
    };

    return Effect.fn('useMergeTag.mergeTag')(function* (sourceId: number) {
        const tagRepository = yield* TagRepository;
        const tagService = yield* TagService;
        const [source] = yield* tagRepository.findByIds([sourceId]);

        if (!isDefined(source)) {
            return null;
        }

        const targetIds = yield* pickTarget(sourceId, source.title, yield* tagService.countTransactions(sourceId));
        const targetId = isNotEmptyArray(targetIds) ? targetIds[0] : null;

        if (!isDefined(targetId)) {
            return null;
        }

        const sourceTitle = source.title;

        return yield* tagService.mergeInto(sourceId, targetId).pipe(
            toastOnFailure(t`Could not merge tag`, t`Please try again later`),
            Effect.tap(target => {
                const targetTitle = target?.title;

                return isDefined(targetTitle)
                    ? Effect.sync(() => void showSuccessToast(t`“${sourceTitle}” merged into “${targetTitle}”`))
                    : Effect.void;
            })
        );
    });
};
