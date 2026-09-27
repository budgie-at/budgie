import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useCategorySelectorModal } from '../../category/context/category-selector-modal.context';

import type { CategorizeInboxAssignInterface } from '../interface/categorize-inbox-assign.interface';
import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxClusterInterface } from '../interface/categorize-inbox-cluster.interface';
import type { CategorizeInboxRowInterface } from '@budgie/contracts';

export const useCategorizeInboxAssign = (
    assign: (assignments: CategorizeInboxAssignmentInterface[]) => void,
    excludedTransactionIds: ReadonlySet<number>
): CategorizeInboxAssignInterface => {
    const [openCategorySelector] = useCategorySelectorModal();

    const toClusterAssignment = (
        cluster: CategorizeInboxClusterInterface,
        categoryId: number
    ): CategorizeInboxAssignmentInterface | null => {
        const transactionIds = cluster.rows
            .map(row => row.transactionId)
            .filter(transactionId => !excludedTransactionIds.has(transactionId));

        return isNotEmptyArray(transactionIds)
            ? {
                  clusterKey: cluster.key,
                  displayTitle: cluster.displayTitle,
                  categoryId,
                  transactionIds,
                  ruleConditionValue: cluster.ruleConditionValue
              }
            : null;
    };

    const handleAssignCluster = (cluster: CategorizeInboxClusterInterface, categoryId: number): void => {
        const assignment = toClusterAssignment(cluster, categoryId);

        if (isDefined(assignment)) {
            assign([assignment]);
        }
    };

    const handleAssignRow = (row: CategorizeInboxRowInterface, categoryId: number): void =>
        void assign([
            {
                clusterKey: String(row.transactionId),
                displayTitle: row.title,
                categoryId,
                transactionIds: [row.transactionId],
                ruleConditionValue: ''
            }
        ]);

    const handlePickClusterCategory = async (cluster: CategorizeInboxClusterInterface): Promise<void> => {
        const categoryId = await openCategorySelector({ description: cluster.displayTitle });

        if (isDefined(categoryId)) {
            handleAssignCluster(cluster, categoryId);
        }
    };

    const handlePickRowCategory = async (row: CategorizeInboxRowInterface): Promise<void> => {
        const categoryId = await openCategorySelector({ description: row.title });

        if (isDefined(categoryId)) {
            handleAssignRow(row, categoryId);
        }
    };

    return {
        toClusterAssignment,
        assignCluster: handleAssignCluster,
        assignRow: handleAssignRow,
        pickClusterCategory: handlePickClusterCategory,
        pickRowCategory: handlePickRowCategory
    };
};
