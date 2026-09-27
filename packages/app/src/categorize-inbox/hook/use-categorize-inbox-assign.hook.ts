import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useCategorizeInboxStrategy } from '../context/categorize-inbox-strategy.context';

import type { CategorizeInboxAssignInterface } from '../interface/categorize-inbox-assign.interface';
import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxClusterInterface } from '../interface/categorize-inbox-cluster.interface';
import type { CategorizeInboxRowInterface } from '@budgie/contracts';

export const useCategorizeInboxAssign = (
    assign: (assignments: CategorizeInboxAssignmentInterface[]) => void,
    excludedTransactionIds: ReadonlySet<number>
): CategorizeInboxAssignInterface => {
    const { pickLabels, followUp } = useCategorizeInboxStrategy();

    const toAssignment = (
        source: Pick<CategorizeInboxClusterInterface, 'key' | 'displayTitle' | 'ruleConditionValue'>,
        rows: CategorizeInboxRowInterface[],
        labelId: number
    ): CategorizeInboxAssignmentInterface | null =>
        isNotEmptyArray(rows)
            ? {
                  clusterKey: source.key,
                  displayTitle: source.displayTitle,
                  labelId,
                  transactionIds: rows.map(row => row.transactionId),
                  ruleConditionValue: source.ruleConditionValue,
                  followUpLabelIds: followUp?.suggestLabelIds(rows) ?? []
              }
            : null;

    const toClusterAssignment = (cluster: CategorizeInboxClusterInterface, labelId: number): CategorizeInboxAssignmentInterface | null =>
        toAssignment(
            cluster,
            cluster.rows.filter(row => !excludedTransactionIds.has(row.transactionId)),
            labelId
        );

    const toRowAssignment = (row: CategorizeInboxRowInterface, labelId: number): CategorizeInboxAssignmentInterface | null =>
        toAssignment({ key: String(row.transactionId), displayTitle: row.title, ruleConditionValue: '' }, [row], labelId);

    const assignLabels = (labelIds: number[], toLabelAssignment: (labelId: number) => CategorizeInboxAssignmentInterface | null): void => {
        const assignments = labelIds.map(toLabelAssignment).filter(isDefined);

        if (isNotEmptyArray(assignments)) {
            assign(assignments);
        }
    };

    const handleAssignCluster = (cluster: CategorizeInboxClusterInterface, labelId: number): void =>
        void assignLabels([labelId], clusterLabelId => toClusterAssignment(cluster, clusterLabelId));

    const handleAssignRow = (row: CategorizeInboxRowInterface, labelId: number): void =>
        void assignLabels([labelId], rowLabelId => toRowAssignment(row, rowLabelId));

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

    return {
        toClusterAssignment,
        assignCluster: handleAssignCluster,
        assignRow: handleAssignRow,
        pickClusterLabels: handlePickClusterLabels,
        pickRowLabels: handlePickRowLabels
    };
};
