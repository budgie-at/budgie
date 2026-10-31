import { CategorizeInboxLabelKindEnum } from '@budgie/categorization';
import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { useSearchTagsQuery } from '../../../tag/query/use-search-tags.query';
import { UNTAGGED_TAG_ID_PARAM } from '../../../transaction/constant/untagged-tag-id-param.constant';
import { buildUncategorizedRouteParams } from '../../../transaction/utils/build-uncategorized-route-params.util';
import { tagEvidenceAtom, untaggedRowsAtom } from '../../constant/categorize-inbox-atoms.constant';
import { useCategorizeInboxLabels } from '../../hook/use-categorize-inbox-labels.hook';
import { CategorizeInboxProvider } from '../categorize-inbox-provider/categorize-inbox-provider';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';
import type { CategorizeInboxStrategyInterface } from '../../interface/categorize-inbox-strategy.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
    readonly children: ReactNode;
}

export const CategorizeInboxTagProvider = ({ params, children }: Props) => {
    const { t } = useLingui();
    const [openTagsSelector] = useTagsSelectorModal();
    const { tags } = useSearchTagsQuery();
    const labelsById = useCategorizeInboxLabels((tags ?? []).map(tag => ({ id: tag.id, title: tag.title, icon: UserIconNameEnum.Tag })));

    const strategy: CategorizeInboxStrategyInterface = {
        labelKind: CategorizeInboxLabelKindEnum.TAG,
        labelsById,
        rowsAtom: untaggedRowsAtom,
        evidenceAtom: tagEvidenceAtom,
        pickLabels: (description, suggestedLabelIds, onPicked) =>
            void openTagsSelector({ description, suggestedTagIds: suggestedLabelIds }, onPicked),
        pickFollowUpTagIds: null,
        buildRuleActions: tagIds => ({ categoryId: null, tagIds }),
        buildListRouteParams: filters => ({
            ...buildUncategorizedRouteParams(filters, null),
            tagId: UNTAGGED_TAG_ID_PARAM,
            ...(filters.types?.length === 1 && { type: filters.types[0] })
        }),
        pageTitle: t`Add tags`,
        emptyDescription: t`Every transaction has a tag.`,
        moreLabels: t`More tags`,
        writeFailed: t`Could not tag transactions`,
        assignAs: tagTitle => t`Tag as ${tagTitle}`,
        assignedCount: rowCount => t({ message: plural(rowCount, { one: 'Tagged # transaction', other: 'Tagged # transactions' }) }),
        doneThisSession: taggedCount =>
            t({ message: plural(taggedCount, { one: '# tagged this session', other: '# tagged this session' }) })
    };

    return (
        <CategorizeInboxProvider params={params} strategy={strategy}>
            {children}
        </CategorizeInboxProvider>
    );
};
