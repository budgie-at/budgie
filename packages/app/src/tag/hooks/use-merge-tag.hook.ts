import { TagRepository } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { showSuccessToast } from '../../@generic/utils/show-success-toast/show-success-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { type TagsSelectorResult, useTagsSelectorModal } from '../context/tags-selector-modal.context';
import { TagService } from '../service/tag.service';

import type { MutationTracker } from '../../@generic/type/mutation-tracker.type';

export const useMergeTag = () => {
    const { t } = useLingui();
    const [openTagsSelector] = useTagsSelectorModal();

    const pickTarget = (sourceId: number, sourceTitle: string, count: number) => {
        const title = t`Merge “${sourceTitle}” into…`;
        const description = t({
            message: plural(count, {
                0: `“${sourceTitle}” is not on any transactions. It is removed after the merge.`,
                one: `Its # transaction gets the tag you pick, and “${sourceTitle}” is removed.`,
                other: `Its # transactions get the tag you pick, and “${sourceTitle}” is removed.`
            })
        });

        const getCommitSummary = (targetTitle: string) =>
            t({
                message: plural(count, {
                    0: `“${sourceTitle}” merges into “${targetTitle}” and will be removed.`,
                    one: `# transaction → “${targetTitle}”. “${sourceTitle}” will be removed.`,
                    other: `# transactions → “${targetTitle}”. “${sourceTitle}” will be removed.`
                })
            });

        return Effect.callback<TagsSelectorResult>(resume => {
            openTagsSelector(
                { excludeTagIds: [sourceId], title, description, singleSelect: true, commitLabel: t`Merge`, getCommitSummary },
                selectedTagIds => {
                    resume(Effect.succeed(selectedTagIds));
                }
            );
        });
    };

    return Effect.fn('useMergeTag.mergeTag')(function* (sourceId: number, trackMutation: MutationTracker) {
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

        return yield* trackMutation(tagService.mergeInto(sourceId, targetId)).pipe(
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
