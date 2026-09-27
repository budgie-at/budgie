import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { transactionCategorizeInboxRepository } from '../../../@generic/drizzle/db/db';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useNonSystemCategoriesQuery } from '../../../category/query/use-non-system-categories.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { AnalyticsTransactionsModeEnum } from '../../../transaction/enum/analytics-transactions-mode.enum';
import { buildUncategorizedRouteParams } from '../../../transaction/utils/build-uncategorized-route-params.util';
import { CategorizeInboxLabelKindEnum } from '../../enum/categorize-inbox-label-kind.enum';
import { useCategorizeInboxLabels } from '../../hook/use-categorize-inbox-labels.hook';
import { categorizeInboxEngineService } from '../../service/categorize-inbox-engine.service';
import { CategorizeInboxPage } from '../categorize-inbox-page/categorize-inbox-page';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';
import type { CategorizeInboxAssignmentInterface } from '../../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxStrategyInterface } from '../../interface/categorize-inbox-strategy.interface';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const CategorizeInboxCategoryPage = ({ params }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const [openCategorySelector] = useCategorySelectorModal();
    const [openTagsSelector] = useTagsSelectorModal();
    const { categories } = useNonSystemCategoriesQuery();
    const labelsById = useCategorizeInboxLabels(categories);

    const handlePickLabels = async (description: string): Promise<number[] | null> => {
        const categoryId = await openCategorySelector({ description });

        return isDefined(categoryId) ? [categoryId] : null;
    };

    const handlePickFollowUpTagIds = async (assignment: CategorizeInboxAssignmentInterface): Promise<number[] | null> => {
        const tagContext = categorizeInboxEngineService.buildContext(
            await transactionCategorizeInboxRepository.findTagEvidence(),
            defaultInstrument.id
        );

        return openTagsSelector({
            suggestedTagIds: categorizeInboxEngineService.suggestLabelIds(assignment.rows, tagContext),
            description: assignment.displayTitle
        });
    };

    const strategy: CategorizeInboxStrategyInterface = {
        labelKind: CategorizeInboxLabelKindEnum.CATEGORY,
        labelsById,
        findRows: filters => transactionCategorizeInboxRepository.findUncategorizedRows(filters),
        findEvidence: () => transactionCategorizeInboxRepository.findCategoryEvidence(),
        pickLabels: handlePickLabels,
        pickFollowUpTagIds: handlePickFollowUpTagIds,
        buildRuleActions: labelIds => ({ categoryId: labelIds.at(0) ?? null, tagIds: [] }),
        buildListRouteParams: filters => buildUncategorizedRouteParams(filters, AnalyticsTransactionsModeEnum.UNCATEGORIZED),
        pageTitle: t`Categorize`,
        emptyDescription: t`Every transaction has a category.`,
        selectLabel: t`Select category`,
        moreLabels: t`More categories`,
        pickRowLabel: t`Pick a category for this transaction`,
        writeFailed: t`Could not categorize transactions`,
        assignAs: categoryTitle => t`Categorize as ${categoryTitle}`,
        assignedTo: (displayTitle, categoryTitle) => t`Categorized ${displayTitle} → ${categoryTitle}`,
        assignedCount: rowCount =>
            t({ message: plural(rowCount, { one: 'Categorized # transaction', other: 'Categorized # transactions' }) }),
        doneThisSession: categorizedCount =>
            t({ message: plural(categorizedCount, { one: '# categorized this session', other: '# categorized this session' }) })
    };

    return <CategorizeInboxPage params={params} strategy={strategy} />;
};
