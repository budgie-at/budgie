import { CategorizeInboxLabelKindEnum, CategorizeInboxService } from '@budgie/categorization';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useNonSystemCategoriesQuery } from '../../../category/query/use-non-system-categories.query';
import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { AnalyticsTransactionsModeEnum } from '../../../transaction/enum/analytics-transactions-mode.enum';
import { buildUncategorizedRouteParams } from '../../../transaction/utils/build-uncategorized-route-params.util';
import { categoryEvidenceAtom, uncategorizedRowsAtom } from '../../constant/categorize-inbox-atoms.constant';
import { useCategorizeInboxLabels } from '../../hook/use-categorize-inbox-labels.hook';
import { CategorizeInboxProvider } from '../categorize-inbox-provider/categorize-inbox-provider';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../../transaction/interface/analytics-transactions-route-params.interface';
import type { CategorizeInboxStrategyInterface } from '../../interface/categorize-inbox-strategy.interface';
import type { CategorizeInboxAssignmentInterface } from '@budgie/categorization';
import type { ReactNode } from 'react';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
    readonly children: ReactNode;
}

export const CategorizeInboxCategoryProvider = ({ params, children }: Props) => {
    const { t } = useLingui();
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const [openCategorySelector] = useCategorySelectorModal();
    const [openTagsSelector] = useTagsSelectorModal();
    const { categories } = useNonSystemCategoriesQuery();
    const labelsById = useCategorizeInboxLabels(categories);

    const handlePickLabels = (description: string, _suggestedLabelIds: number[], onPicked: (labelIds: number[] | null) => void): void => {
        openCategorySelector({ description }, categoryId => {
            onPicked(isDefined(categoryId) ? [categoryId] : null);
        });
    };

    const handlePickFollowUpTagIds = (
        assignment: Pick<CategorizeInboxAssignmentInterface, 'displayTitle' | 'rows'>,
        onPicked: (tagIds: number[] | null) => void
    ): void => {
        void appRuntime.runPromise(
            Effect.flatMap(CategorizeInboxService, categorizeInboxService =>
                categorizeInboxService.suggestFollowUpTagIds(assignment.rows, defaultInstrumentId)
            ).pipe(
                Effect.flatMap(suggestedTagIds =>
                    Effect.sync(() => {
                        openTagsSelector({ suggestedTagIds, description: assignment.displayTitle }, onPicked);
                    })
                )
            )
        );
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
        moreLabels: t`More categories`,
        writeFailed: t`Could not categorize transactions`,
        assignAs: categoryTitle => t`Categorize as ${categoryTitle}`,
        assignedCount: rowCount =>
            t({ message: plural(rowCount, { one: 'Categorized # transaction', other: 'Categorized # transactions' }) }),
        doneThisSession: categorizedCount =>
            t({ message: plural(categorizedCount, { one: '# categorized this session', other: '# categorized this session' }) })
    };

    return (
        <CategorizeInboxProvider params={params} strategy={strategy}>
            {children}
        </CategorizeInboxProvider>
    );
};
