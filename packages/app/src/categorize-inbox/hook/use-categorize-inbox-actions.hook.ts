import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { CategorizeInboxListItemKindEnum } from '../enum/categorize-inbox-list-item-kind.enum';
import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';

import { useCategorizeInboxAssign } from './use-categorize-inbox-assign.hook';
import { useCategorizeInboxCategories } from './use-categorize-inbox-categories.hook';
import { useCategorizeInboxSession } from './use-categorize-inbox-session.hook';
import { useCategorizeInboxVisibility } from './use-categorize-inbox-visibility.hook';
import { useCategorizeInboxWrites } from './use-categorize-inbox-writes.hook';

import type { CategorizeInboxActionsInterface } from '../interface/categorize-inbox-actions.interface';
import type { CategorizeInboxDataInterface } from '../interface/categorize-inbox-data.interface';

export const useCategorizeInboxActions = (inbox: CategorizeInboxDataInterface): CategorizeInboxActionsInterface => {
    const categoriesById = useCategorizeInboxCategories();
    const protectAmount = useProtectedAmountLabel();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const { defaultInstrument } = useSettingsContext();

    const [expandedClusterKey, setExpandedClusterKey] = useState<string | null>(null);
    const [initialRowCount, setInitialRowCount] = useState(inbox.rows.length);
    const visibility = useCategorizeInboxVisibility(inbox.rows);
    const { items, remainingCount } = useCategorizeInboxSession(inbox, visibility.hiddenTransactionIds);
    const { undoAssignments, assign, undo } = useCategorizeInboxWrites(visibility);
    const { toClusterAssignment, assignCluster, assignRow, pickClusterCategory, pickRowCategory } = useCategorizeInboxAssign(
        assign,
        visibility.excludedTransactionIds
    );

    if (inbox.rows.length > initialRowCount) {
        setInitialRowCount(inbox.rows.length);
    }

    const acceptableAssignments = items
        .map(item => {
            const isConfidentCluster =
                item.kind === CategorizeInboxListItemKindEnum.CLUSTER && item.cluster.section === CategorizeInboxSectionEnum.CONFIDENT;
            const topCandidate = isConfidentCluster ? item.cluster.candidates.at(0) : null;

            return isConfidentCluster && isDefined(topCandidate) ? toClusterAssignment(item.cluster, topCandidate.categoryId) : null;
        })
        .filter(isDefined);

    return {
        items,
        expandedClusterKey,
        acceptableAssignments,
        undoAssignments,
        undo,
        remainingCount,
        categorizedCount: Math.max(0, initialRowCount - remainingCount),
        contextValue: {
            categoriesById,
            excludedTransactionIds: visibility.excludedTransactionIds,
            formatMicroAmount: (microAmount, instrumentSymbol) => protectAmount(convertFromMicroUnits(microAmount), instrumentSymbol),
            formatBaseMicroAmount: microAmount => protectAmount(convertFromMicroUnits(microAmount), defaultInstrument.symbol),
            formatDate: formatDayAndMonthAndYear,
            toggleExpanded: clusterKey => void setExpandedClusterKey(previous => (previous === clusterKey ? null : clusterKey)),
            toggleExcluded: visibility.toggleExcluded,
            assign,
            assignCluster,
            assignRow,
            pickClusterCategory,
            pickRowCategory
        }
    };
};
