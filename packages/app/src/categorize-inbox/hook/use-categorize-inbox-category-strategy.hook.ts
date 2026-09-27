import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { transactionCategorizeInboxRepository } from '../../@generic/drizzle/db/db';
import { useCategorySelectorModal } from '../../category/context/category-selector-modal.context';
import { useNonSystemCategoriesQuery } from '../../category/query/use-non-system-categories.query';
import { AnalyticsTransactionsModeEnum } from '../../transaction/enum/analytics-transactions-mode.enum';
import { buildUncategorizedRouteParams } from '../../transaction/utils/build-uncategorized-route-params.util';
import { CategorizeInboxLabelKindEnum } from '../enum/categorize-inbox-label-kind.enum';
import { categorizeInboxService } from '../service/categorize-inbox.service';

import { useCategorizeInboxLabels } from './use-categorize-inbox-labels.hook';
import { useCategorizeInboxTagFollowUp } from './use-categorize-inbox-tag-follow-up.hook';

import type { CategorizeInboxStrategyInterface } from '../interface/categorize-inbox-strategy.interface';

export const useCategorizeInboxCategoryStrategy = (): CategorizeInboxStrategyInterface => {
    const { t } = useLingui();
    const [openCategorySelector] = useCategorySelectorModal();

    const { categories } = useNonSystemCategoriesQuery();
    const labelsById = useCategorizeInboxLabels(categories);
    const followUp = useCategorizeInboxTagFollowUp();

    const handlePickLabels = async (description: string): Promise<number[] | null> => {
        const categoryId = await openCategorySelector({ description });

        return isDefined(categoryId) ? [categoryId] : null;
    };

    return {
        labelsById,
        followUp,
        findRows: filters => transactionCategorizeInboxRepository.findUncategorizedRows(filters),
        findEvidence: () => transactionCategorizeInboxRepository.findCategoryEvidence(),
        assignMany: assignments => categorizeInboxService.assign(CategorizeInboxLabelKindEnum.CATEGORY, assignments),
        undo: assignments => categorizeInboxService.undo(CategorizeInboxLabelKindEnum.CATEGORY, assignments),
        pickLabels: handlePickLabels,
        buildRuleActions: labelIds => ({ categoryId: labelIds.at(0) ?? null, tagIds: [] }),
        buildListRouteParams: filters => buildUncategorizedRouteParams(filters, AnalyticsTransactionsModeEnum.UNCATEGORIZED),
        copy: {
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
        }
    };
};
