import { useState } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useCategorizeInboxStrategy } from '../context/categorize-inbox-strategy.context';
import { CategorizeInboxListItemKindEnum } from '../enum/categorize-inbox-list-item-kind.enum';
import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';
import { categorizeInboxEngineService } from '../service/categorize-inbox-engine.service';

import { useCategorizeInboxSession } from './use-categorize-inbox-session.hook';
import { useCategorizeInboxVisibility } from './use-categorize-inbox-visibility.hook';
import { useCategorizeInboxWrites } from './use-categorize-inbox-writes.hook';

import type { CategorizeInboxActionsInterface } from '../interface/categorize-inbox-actions.interface';
import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxClusterInterface } from '../interface/categorize-inbox-cluster.interface';
import type { CategorizeInboxDataInterface } from '../interface/categorize-inbox-data.interface';
import type { CategorizeInboxRowInterface } from '@budgie/contracts';

export const useCategorizeInboxActions = (inbox: CategorizeInboxDataInterface): CategorizeInboxActionsInterface => {
    const protectAmount = useProtectedAmountLabel();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const { defaultInstrument } = useSettingsContext();
    const { pickLabels } = useCategorizeInboxStrategy();

    const [expandedClusterKey, setExpandedClusterKey] = useState<string | null>(null);
    const visibility = useCategorizeInboxVisibility(inbox.rows);
    const { items, remainingCount, categorizedCount } = useCategorizeInboxSession(inbox, visibility.hiddenTransactionIds);
    const { lastWrite, assign, applyFollowUp, undo } = useCategorizeInboxWrites(visibility);

    const toClusterAssignment = (cluster: CategorizeInboxClusterInterface, labelId: number): CategorizeInboxAssignmentInterface | null =>
        categorizeInboxEngineService.buildAssignment(
            cluster,
            cluster.rows.filter(row => !visibility.excludedTransactionIds.has(row.transactionId)),
            labelId
        );

    const toRowAssignment = (row: CategorizeInboxRowInterface, labelId: number): CategorizeInboxAssignmentInterface | null =>
        categorizeInboxEngineService.buildAssignment(
            { key: String(row.transactionId), displayTitle: row.title, ruleConditionValue: '' },
            [row],
            labelId
        );

    const assignLabels = (labelIds: number[], toLabelAssignment: (labelId: number) => CategorizeInboxAssignmentInterface | null): void => {
        const assignments = labelIds.map(toLabelAssignment).filter(isDefined);

        if (isNotEmptyArray(assignments)) {
            assign(assignments);
        }
    };

    const handlePickClusterLabels = async (cluster: CategorizeInboxClusterInterface): Promise<void> => {
        const labelIds = await pickLabels(
            cluster.displayTitle,
            cluster.candidates.map(candidate => candidate.labelId)
        );

        if (isDefined(labelIds)) {
            assignLabels(labelIds, labelId => toClusterAssignment(cluster, labelId));
        }
    };

    const handlePickRowLabels = async (row: CategorizeInboxRowInterface): Promise<void> => {
        const labelIds = await pickLabels(row.title, []);

        if (isDefined(labelIds)) {
            assignLabels(labelIds, labelId => toRowAssignment(row, labelId));
        }
    };

    const acceptableAssignments = items
        .map(item => {
            const isConfidentCluster =
                item.kind === CategorizeInboxListItemKindEnum.CLUSTER && item.cluster.section === CategorizeInboxSectionEnum.CONFIDENT;
            const topCandidate = isConfidentCluster ? item.cluster.candidates.at(0) : null;

            return isConfidentCluster && isDefined(topCandidate) ? toClusterAssignment(item.cluster, topCandidate.labelId) : null;
        })
        .filter(isDefined);

    return {
        items,
        expandedClusterKey,
        acceptableAssignments,
        lastWrite,
        undo,
        remainingCount,
        categorizedCount,
        contextValue: {
            excludedTransactionIds: visibility.excludedTransactionIds,
            expandedClusterKey,
            hasAppliedFollowUp: isNotEmptyArray(lastWrite?.followUpAssignments),
            formatMicroAmount: (microAmount, instrumentSymbol) => protectAmount(convertFromMicroUnits(microAmount), instrumentSymbol),
            formatBaseMicroAmount: microAmount => protectAmount(convertFromMicroUnits(microAmount), defaultInstrument.symbol),
            formatDate: formatDayAndMonthAndYear,
            toggleExpanded: clusterKey => void setExpandedClusterKey(previous => (previous === clusterKey ? null : clusterKey)),
            toggleExcluded: visibility.toggleExcluded,
            assign,
            applyFollowUp,
            assignCluster: (cluster, labelId) =>
                void assignLabels([labelId], clusterLabelId => toClusterAssignment(cluster, clusterLabelId)),
            assignRow: (row, labelId) => void assignLabels([labelId], rowLabelId => toRowAssignment(row, rowLabelId)),
            pickClusterLabels: handlePickClusterLabels,
            pickRowLabels: handlePickRowLabels
        }
    };
};
