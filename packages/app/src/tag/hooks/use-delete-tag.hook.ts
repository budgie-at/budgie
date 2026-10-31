import { TagRepository } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { showSuccessToast } from '../../@generic/utils/show-success-toast/show-success-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { TagService } from '../service/tag.service';

export const useDeleteTag = () => {
    const { t } = useLingui();

    return Effect.fn('useDeleteTag.deleteTag')(function* (id: number) {
        const tagRepository = yield* TagRepository;
        const tagService = yield* TagService;
        const [tag] = yield* tagRepository.findByIds([id]);

        if (!isDefined(tag)) {
            return false;
        }

        const count = yield* tagService.countTransactions(id);
        const { title } = tag;
        const isConfirmed = yield* confirmAlert({
            title: t`Delete “${title}”?`,
            ...(isPositiveNumber(count) && {
                message: t({
                    message: plural(count, {
                        one: 'It will be removed from # transaction. The transaction stays.',
                        other: 'It will be removed from # transactions. The transactions stay.'
                    })
                })
            }),
            confirmText: t`Delete`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (!isConfirmed) {
            return false;
        }

        yield* tagService.deleteById(id).pipe(toastOnFailure(t`Could not delete tag`, t`Please try again later`));
        yield* Effect.sync(() => void showSuccessToast(t`“${title}” deleted`));

        return true;
    });
};
