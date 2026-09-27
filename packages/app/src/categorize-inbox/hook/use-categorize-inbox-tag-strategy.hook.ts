import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { tagRepository, transactionCategorizeInboxRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useTagsSelectorModal } from '../../tag/context/tags-selector-modal.context';
import { UNTAGGED_TAG_ID_PARAM } from '../../transaction/constant/untagged-tag-id-param.constant';
import { buildUncategorizedRouteParams } from '../../transaction/utils/build-uncategorized-route-params.util';
import { CategorizeInboxLabelKindEnum } from '../enum/categorize-inbox-label-kind.enum';
import { categorizeInboxService } from '../service/categorize-inbox.service';

import { useCategorizeInboxLabels } from './use-categorize-inbox-labels.hook';

import type { CategorizeInboxStrategyInterface } from '../interface/categorize-inbox-strategy.interface';

export const useCategorizeInboxTagStrategy = (): CategorizeInboxStrategyInterface => {
    const { t } = useLingui();
    const [openTagsSelector] = useTagsSelectorModal();

    const { data: tags } = useDatabaseLiveQuery(tagRepository.findAll());
    const labelsById = useCategorizeInboxLabels(tags.map(tag => ({ id: tag.id, title: tag.title, icon: UserIconNameEnum.Tag })));

    return {
        labelsById,
        followUp: null,
        findRows: filters => transactionCategorizeInboxRepository.findUntaggedRows(filters),
        findEvidence: () => transactionCategorizeInboxRepository.findTagEvidence(),
        assignMany: assignments => categorizeInboxService.assign(CategorizeInboxLabelKindEnum.TAG, assignments),
        undo: assignments => categorizeInboxService.undo(CategorizeInboxLabelKindEnum.TAG, assignments),
        pickLabels: (description, suggestedLabelIds) => openTagsSelector({ description, initialTagIds: suggestedLabelIds }),
        buildRuleActions: tagIds => ({ categoryId: null, tagIds }),
        buildListRouteParams: filters => ({
            ...buildUncategorizedRouteParams(filters, null),
            tagId: UNTAGGED_TAG_ID_PARAM,
            ...(filters.types?.length === 1 && { type: filters.types[0] })
        }),
        copy: {
            pageTitle: t`Add tags`,
            emptyDescription: t`Every transaction has a tag.`,
            selectLabel: t`Select tags`,
            moreLabels: t`More tags`,
            pickRowLabel: t`Pick tags for this transaction`,
            writeFailed: t`Could not tag transactions`,
            assignAs: tagTitle => t`Tag as ${tagTitle}`,
            assignedTo: (displayTitle, tagTitle) => t`Tagged ${displayTitle} → ${tagTitle}`,
            assignedCount: rowCount => t({ message: plural(rowCount, { one: 'Tagged # transaction', other: 'Tagged # transactions' }) }),
            doneThisSession: taggedCount =>
                t({ message: plural(taggedCount, { one: '# tagged this session', other: '# tagged this session' }) })
        }
    };
};
