import { CategorizeInboxLabelKindEnum, TransactionCategorizeInboxRepository, categorizeInboxEngineService } from '@budgie/categorization';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useNonSystemCategoriesQuery } from '../../../category/query/use-non-system-categories.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { AnalyticsTransactionsModeEnum } from '../../../transaction/enum/analytics-transactions-mode.enum';
import { buildUncategorizedRouteParams } from '../../../transaction/utils/build-uncategorized-route-params.util';
import { categoryEvidenceAtom, uncategorizedRowsAtom } from '../../constant/categorize-inbox-atoms.constant';
import { useCategorizeInboxLabels } from '../../hook/use-categorize-inbox-labels.hook';
import { CategorizeInboxPage } from '../categorize-inbox-page/categorize-inbox-page';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';
import type { CategorizeInboxStrategyInterface } from '../../interface/categorize-inbox-strategy.interface';
import type { CategorizeInboxAssignmentInterface } from '@budgie/categorization';

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
            await appRuntime.runPromise(Effect.flatMap(TransactionCategorizeInboxRepository, repository => repository.findTagEvidence())),
            defaultInstrument.id,
            CategorizeInboxLabelKindEnum.TAG
        );

        return openTagsSelector({
            suggestedTagIds: categorizeInboxEngineService.suggestLabelIds(assignment.rows, tagContext),
            description: assignment.displayTitle
        });
    };

    const strategy: CategorizeInboxStrategyInterface = {
        labelKind: CategorizeInboxLabelKindEnum.CATEGORY,
        labelsById,
        rowsAtom: uncategorizedRowsAtom,
        evidenceAtom: categoryEvidenceAtom,
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
        assignedCount: rowCount =>
            t({ message: plural(rowCount, { one: 'Categorized # transaction', other: 'Categorized # transactions' }) }),
        doneThisSession: categorizedCount =>
            t({ message: plural(categorizedCount, { one: '# categorized this session', other: '# categorized this session' }) })
    };

    return <CategorizeInboxPage params={params} strategy={strategy} />;
};
