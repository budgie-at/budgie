import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { tagRepository, transactionCategorizeInboxRepository } from '../../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../../@generic/hook/use-database-live-query.hook';
import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { UNTAGGED_TAG_ID_PARAM } from '../../../transaction/constant/untagged-tag-id-param.constant';
import { buildUncategorizedRouteParams } from '../../../transaction/utils/build-uncategorized-route-params.util';
import { CategorizeInboxLabelKindEnum } from '../../enum/categorize-inbox-label-kind.enum';
import { useCategorizeInboxLabels } from '../../hook/use-categorize-inbox-labels.hook';
import { CategorizeInboxPage } from '../categorize-inbox-page/categorize-inbox-page';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';
import type { CategorizeInboxStrategyInterface } from '../../interface/categorize-inbox-strategy.interface';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const CategorizeInboxTagPage = ({ params }: Props) => {
    const { t } = useLingui();
    const [openTagsSelector] = useTagsSelectorModal();
    const { data: tags } = useDatabaseLiveQuery(tagRepository.findAll());
    const labelsById = useCategorizeInboxLabels(tags.map(tag => ({ id: tag.id, title: tag.title, icon: UserIconNameEnum.Tag })));

    const strategy: CategorizeInboxStrategyInterface = {
        labelKind: CategorizeInboxLabelKindEnum.TAG,
        labelsById,
        findRows: filters => transactionCategorizeInboxRepository.findUntaggedRows(filters),
        findEvidence: () => transactionCategorizeInboxRepository.findTagEvidence(),
        pickLabels: (description, suggestedLabelIds) => openTagsSelector({ description, suggestedTagIds: suggestedLabelIds }),
        pickFollowUpTagIds: null,
        buildRuleActions: tagIds => ({ categoryId: null, tagIds }),
        buildListRouteParams: filters => ({
            ...buildUncategorizedRouteParams(filters, null),
            tagId: UNTAGGED_TAG_ID_PARAM,
            ...(filters.types?.length === 1 && { type: filters.types[0] })
        }),
        pageTitle: t`Add tags`,
        emptyDescription: t`Every transaction has a tag.`,
        selectLabel: t`Select tags`,
        moreLabels: t`More tags`,
        pickRowLabel: t`Pick tags for this transaction`,
        writeFailed: t`Could not tag transactions`,
        assignAs: tagTitle => t`Tag as ${tagTitle}`,
        assignedCount: rowCount => t({ message: plural(rowCount, { one: 'Tagged # transaction', other: 'Tagged # transactions' }) }),
        doneThisSession: taggedCount =>
            t({ message: plural(taggedCount, { one: '# tagged this session', other: '# tagged this session' }) })
    };

    return <CategorizeInboxPage params={params} strategy={strategy} />;
};
